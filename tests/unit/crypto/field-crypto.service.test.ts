import { FieldCryptoService } from "../../../src/services/crypto/field-crypto.service";

const MASTER_KEY_BASE64 = Buffer.from("unit-test-master-key-123").toString("base64");

describe("FieldCryptoService", () => {
  it("encrypts and decrypts payloads correctly", () => {
    const service = new FieldCryptoService(MASTER_KEY_BASE64, 1);
    const plainText = "john.doe@example.com";

    const encrypted = service.encrypt(plainText);
    const decrypted = service.decrypt(encrypted);

    expect(encrypted.startsWith("enc:v1:")).toBe(true);
    expect(decrypted).toBe(plainText);
  });

  it("uses random IV so the same plaintext generates different ciphertext", () => {
    const service = new FieldCryptoService(MASTER_KEY_BASE64, 1);
    const plainText = "same-value";

    const first = service.encrypt(plainText);
    const second = service.encrypt(plainText);

    expect(first).not.toBe(second);
  });

  it("throws when payload integrity is tampered", () => {
    const service = new FieldCryptoService(MASTER_KEY_BASE64, 1);
    const encrypted = service.encrypt("tamper-test");

    const parts = encrypted.split(":");
    const tamperedTag = Buffer.from(parts[3], "base64");
    tamperedTag[0] = tamperedTag[0] ^ 0xff;
    parts[3] = tamperedTag.toString("base64");

    const tamperedPayload = parts.join(":");

    expect(() => service.decrypt(tamperedPayload)).toThrow(/authentication/i);
  });
});
