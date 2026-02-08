import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

interface ParsedPayload {
  version: number;
  iv: Buffer;
  tag: Buffer;
  ciphertext: Buffer;
}

/**
 * Servicio de cifrado de campos PII usando AES-256-GCM.
 *
 * Reglas implementadas:
 * - Formato serializado: enc:v{version}:{iv_b64}:{tag_b64}:{ciphertext_b64}
 * - IV de 12 bytes aleatorios.
 * - Tag de autenticación de 16 bytes.
 * - Key derivada por versión: SHA256(master + "::v" + version)
 *
 * Este servicio está pensado para cifrado a nivel de campo (no de documento completo).
 */
export class FieldCryptoService {
  private readonly masterKey: Buffer;
  private readonly activeVersion: number;

  constructor(masterKeyBase64: string, activeVersion: number) {
    this.masterKey = this.decodeBase64(masterKeyBase64, "LEADS_MASTER_KEY");
    this.activeVersion = activeVersion;
  }

  /**
   * Cifra texto plano con la versión activa de clave.
   *
   * @param plainText texto original a cifrar
   * @returns string serializado con versión, iv, tag y ciphertext en base64
   */
  public encrypt(plainText: string): string {
    // 1) Derivamos la clave de 32 bytes para la versión activa.
    const key = this.deriveVersionedKey(this.activeVersion);

    // 2) AES-GCM recomienda IV de 12 bytes para rendimiento/seguridad.
    const iv = randomBytes(12);

    // 3) Creamos el cifrador AES-256-GCM.
    const cipher = createCipheriv("aes-256-gcm", key, iv);

    // 4) Ciframos UTF-8 -> bytes cifrados.
    const ciphertext = Buffer.concat([
      cipher.update(plainText, "utf8"),
      cipher.final(),
    ]);

    // 5) Extraemos tag de autenticación (16 bytes en GCM).
    const tag = cipher.getAuthTag();

    // 6) Serializamos con el formato obligatorio para almacenamiento.
    return `enc:v${this.activeVersion}:${iv.toString("base64")}:${tag.toString("base64")}:${ciphertext.toString("base64")}`;
  }

  /**
   * Descifra una cadena en formato enc:v{n}:iv:tag:ciphertext.
   *
   * Importante:
   * - Si el tag no valida (datos manipulados o clave incorrecta),
   *   `decipher.final()` lanza error y se propaga como fallo de autenticación.
   *
   * @param serialized valor cifrado almacenado en BD
   * @returns texto plano original
   */
  public decrypt(serialized: string): string {
    const parsed = this.parsePayload(serialized);

    // 1) Derivamos clave de la versión incluida en el payload.
    const key = this.deriveVersionedKey(parsed.version);

    // 2) Creamos descifrador AES-256-GCM y cargamos el tag.
    const decipher = createDecipheriv("aes-256-gcm", key, parsed.iv);
    decipher.setAuthTag(parsed.tag);

    // 3) Intentamos descifrar. Si el tag no cuadra, aquí se lanza error.
    try {
      const plainBuffer = Buffer.concat([
        decipher.update(parsed.ciphertext),
        decipher.final(),
      ]);

      return plainBuffer.toString("utf8");
    } catch (_error) {
      throw new Error("Ciphertext authentication failed.");
    }
  }

  /**
   * Deriva una clave de 32 bytes por versión:
   * SHA256(master + "::v" + version)
   */
  private deriveVersionedKey(version: number): Buffer {
    if (!Number.isInteger(version) || version <= 0) {
      throw new Error("Encryption key version must be a positive integer.");
    }

    const suffix = Buffer.from(`::v${version}`, "utf8");

    return createHash("sha256")
      .update(Buffer.concat([this.masterKey, suffix]))
      .digest();
  }

  /**
   * Parsea y valida el formato serializado.
   *
   * Formato esperado:
   * enc:v{version}:{iv_b64}:{tag_b64}:{ciphertext_b64}
   */
  private parsePayload(serialized: string): ParsedPayload {
    const match = /^enc:v(\d+):([^:]+):([^:]+):([^:]+)$/.exec(serialized);

    if (!match) {
      throw new Error("Invalid encrypted payload format.");
    }

    const version = Number(match[1]);
    const iv = this.decodeBase64(match[2], "iv");
    const tag = this.decodeBase64(match[3], "tag");
    const ciphertext = this.decodeBase64(match[4], "ciphertext");

    if (iv.length !== 12) {
      throw new Error("Invalid IV length for AES-256-GCM.");
    }

    if (tag.length !== 16) {
      throw new Error("Invalid auth tag length for AES-256-GCM.");
    }

    return {
      version,
      iv,
      tag,
      ciphertext,
    };
  }

  /**
   * Decodifica base64 y valida que haya contenido.
   */
  private decodeBase64(value: string, fieldName: string): Buffer {
    const decoded = Buffer.from(value, "base64");

    if (decoded.length === 0) {
      throw new Error(`${fieldName} must be valid base64`);
    }

    return decoded;
  }
}
