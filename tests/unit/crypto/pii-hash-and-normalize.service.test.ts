import { PiiHashService } from "../../../src/services/crypto/pii-hash.service";
import {
  normalizeEmail,
  normalizePhone,
} from "../../../src/services/normalizers/contact-normalizer.service";

const HASH_KEY_BASE64 = Buffer.from("unit-test-hash-key-987").toString("base64");

describe("normalize and hash", () => {
  it("normalizes email by trimming and lowercasing", () => {
    expect(normalizeEmail("  USER@Example.COM  ")).toBe("user@example.com");
  });

  it("normalizes phone by removing spaces, dashes and parentheses", () => {
    expect(normalizePhone(" +34 (600) 12-34-56 ")).toBe("+34600123456");
  });

  it("generates deterministic hashes for equivalent normalized values", () => {
    const hashService = new PiiHashService(HASH_KEY_BASE64);

    const emailHash1 = hashService.hashNormalizedValue(
      normalizeEmail("  USER@Example.COM "),
    );
    const emailHash2 = hashService.hashNormalizedValue(
      normalizeEmail("user@example.com"),
    );

    const phoneHash1 = hashService.hashNormalizedValue(
      normalizePhone(" +34 (600) 12-34-56 "),
    );
    const phoneHash2 = hashService.hashNormalizedValue(
      normalizePhone("+34600123456"),
    );

    expect(emailHash1).toBe(emailHash2);
    expect(phoneHash1).toBe(phoneHash2);
    expect(emailHash1).toHaveLength(64);
    expect(phoneHash1).toHaveLength(64);
  });
});
