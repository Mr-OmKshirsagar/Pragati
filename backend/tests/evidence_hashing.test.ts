import crypto from "crypto";
import { describe, expect, it } from "vitest";
import { computeSHA256 } from "../src/_core/storage";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  validateEvidenceFile,
} from "../src/services/evidenceService";

describe("Cryptographic File Integrity & Evidence Hashing (Phase 11)", () => {
  it("should generate bit-level identical hashes for identical files", () => {
    const buffer1 = Buffer.from("Original Offer Letter Content 2026 - TechCorp Solutions");
    const buffer2 = Buffer.from("Original Offer Letter Content 2026 - TechCorp Solutions");

    const hash1 = crypto.createHash("sha256").update(buffer1).digest("hex");
    const hash2 = crypto.createHash("sha256").update(buffer2).digest("hex");

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
    expect(/^[a-f0-9]{64}$/.test(hash1)).toBe(true);
  });

  it("should produce a completely different hash upon even a 1-character file mutation (avalanche effect)", () => {
    const original = Buffer.from("Stipend: $5000/mo; Position: Software Engineer Intern");
    const tampered = Buffer.from("Stipend: $9000/mo; Position: Software Engineer Intern");

    const hashOriginal = crypto.createHash("sha256").update(original).digest("hex");
    const hashTampered = crypto.createHash("sha256").update(tampered).digest("hex");

    expect(hashOriginal).not.toBe(hashTampered);

    // Calculate differing characters to demonstrate cryptographic avalanche effect
    let differingChars = 0;
    for (let i = 0; i < hashOriginal.length; i++) {
      if (hashOriginal[i] !== hashTampered[i]) differingChars++;
    }
    // In SHA-256, flipping a few bits changes ~50% of the hex characters (typically > 25/64 chars)
    expect(differingChars).toBeGreaterThan(20);
  });

  it("should compute valid SHA-256 hex string using system computeSHA256 helper", () => {
    const data = Buffer.from("Northstar Institute of Technology - Verified Transcript");
    const hash = computeSHA256(data);

    const expected = crypto.createHash("sha256").update(data).digest("hex");
    expect(hash).toBe(expected);
    expect(hash).toHaveLength(64);
  });

  describe("File Security Validation Policies", () => {
    it("should accept valid PDF, PNG, and JPEG files within size limits", () => {
      expect(() => validateEvidenceFile("application/pdf", 1024 * 1024)).not.toThrow();
      expect(() => validateEvidenceFile("image/png", 500 * 1024)).not.toThrow();
      expect(() => validateEvidenceFile("image/jpeg", 2 * 1024 * 1024)).not.toThrow();
    });

    it("should reject malicious or disallowed file extensions and MIME types", () => {
      const maliciousTypes = [
        "application/x-msdownload",
        "text/html",
        "application/javascript",
        "application/x-sh",
        "text/x-python",
        "image/gif",
        "application/zip",
      ];

      for (const mime of maliciousTypes) {
        expect(() => validateEvidenceFile(mime, 1024)).toThrowError(/Invalid file type/);
      }
    });

    it("should reject files exceeding the 10MB maximum limit", () => {
      const oversizedBytes = MAX_FILE_SIZE_BYTES + 1; // 10MB + 1 byte
      expect(() => validateEvidenceFile("application/pdf", oversizedBytes)).toThrowError(
        /exceeds the maximum limit of 10MB/
      );
    });

    it("should reject empty (0 bytes) files", () => {
      expect(() => validateEvidenceFile("application/pdf", 0)).toThrowError(/File cannot be empty/);
      expect(() => validateEvidenceFile("image/png", -10)).toThrowError(/File cannot be empty/);
    });
  });

  describe("Server-Side Tamper Detection Logic", () => {
    it("should detect tampering between original document and altered document", () => {
      const originalDoc = {
        id: "doc-123",
        filename: "Completion_Certificate.pdf",
        sha256Hash: computeSHA256(Buffer.from("Valid Certificate Signed by Mentor")),
      };

      const incomingUpload = Buffer.from("Valid Certificate Signed by Mentor - TAMPERED");
      const incomingHash = computeSHA256(incomingUpload);

      const isTampered = incomingHash !== originalDoc.sha256Hash;
      expect(isTampered).toBe(true);
    });
  });
});
