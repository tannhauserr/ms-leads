import { createHmac } from "crypto";

export class PiiHashService {
  private readonly hashKey: Buffer;

  constructor(hashKeyBase64: string) {
    this.hashKey = this.decodeBase64(hashKeyBase64, "LEADS_HASH_KEY");
  }

  public hashNormalizedValue(value: string): string {
    return createHmac("sha256", this.hashKey).update(value, "utf8").digest("hex");
  }

  private decodeBase64(value: string, fieldName: string): Buffer {
    const decoded = Buffer.from(value, "base64");

    if (decoded.length === 0) {
      throw new Error(`${fieldName} must be valid base64`);
    }

    return decoded;
  }
}
