import crypto from "crypto";
import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { evidenceDocuments, studentProfiles, users } from "../drizzle/schema";
import { getDb } from "../src/db";
import { appRouter } from "../src/routers";
import { computeSHA256 } from "../src/_core/storage";
import type { Context } from "../src/_core/context";

async function createTestContext(token?: string): Promise<Context> {
  const req: any = {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  };
  const res: any = {};

  let user = null;
  if (token?.startsWith("demo_")) {
    const role = token.replace("demo_", "") as any;
    const db = await getDb();
    if (db) {
      const [matchedUser] = await db
        .select()
        .from(users)
        .where(eq(users.role, role))
        .limit(1);
      if (matchedUser) {
        let sp;
        if (matchedUser.role === "STUDENT") {
          const [foundSp] = await db
            .select()
            .from(studentProfiles)
            .where(eq(studentProfiles.userId, matchedUser.id))
            .limit(1);
          sp = foundSp
            ? {
                id: foundSp.id,
                enrollmentNumber: foundSp.enrollmentNumber,
                program: foundSp.program,
                currentSemester: foundSp.currentSemester,
              }
            : undefined;
        }

        user = {
          id: matchedUser.id,
          email: matchedUser.email,
          role: matchedUser.role,
          institutionId: matchedUser.institutionId,
          departmentId: matchedUser.departmentId,
          name: matchedUser.name,
          studentProfile: sp,
        };
      }
    }
  }

  return { req, res, user };
}

describe("Phase 06: Cryptographic Evidence Vault & SHA-256 Tamper Detection", () => {
  let createdEvidenceId: string | undefined;
  let studentProfileId: string | undefined;

  beforeAll(async () => {
    const studentCtx = await createTestContext("demo_STUDENT");
    studentProfileId = studentCtx.user?.studentProfile?.id;
  });

  afterAll(async () => {
    const db = await getDb();
    if (db && createdEvidenceId) {
      await db
        .delete(evidenceDocuments)
        .where(eq(evidenceDocuments.id, createdEvidenceId));
    }
  });

  describe("1. Cryptographic Hashing Standard Match", () => {
    it("should compute exact SHA-256 standard hash for a known byte sequence", () => {
      const sampleText = "PRAGATI Evidence Cryptographic Verification Token 2026";
      const buffer = Buffer.from(sampleText, "utf-8");

      const computed = computeSHA256(buffer);
      const expected = crypto.createHash("sha256").update(buffer).digest("hex");

      expect(computed).toBe(expected);
      expect(computed).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/.test(computed)).toBe(true);
    });

    it("should demonstrate the avalanche effect: altering 1 character completely alters the hash", () => {
      const original = Buffer.from("Stipend: INR 45,000", "utf-8");
      const tampered = Buffer.from("Stipend: INR 95,000", "utf-8"); // '4' -> '9'

      const hashOrig = computeSHA256(original);
      const hashTamp = computeSHA256(tampered);

      expect(hashOrig).not.toBe(hashTamp);

      // Count differing characters (avalanche effect typically flips > 30% of hex chars)
      let diffCount = 0;
      for (let i = 0; i < hashOrig.length; i++) {
        if (hashOrig[i] !== hashTamp[i]) diffCount++;
      }
      expect(diffCount).toBeGreaterThan(20);
    });
  });

  describe("2. Security Restrictions & File Validation", () => {
    it("should reject files exceeding the 10MB limit with BAD_REQUEST", async () => {
      const studentCtx = await createTestContext("demo_STUDENT");
      const caller = appRouter.createCaller(studentCtx);

      await expect(
        caller.evidence.registerEvidence({
          filename: "huge_file.pdf",
          storagePath: "NIT-001/test/huge.pdf",
          mimeType: "application/pdf",
          fileSize: 11 * 1024 * 1024, // 11MB
          sha256Hash: "a".repeat(64),
        })
      ).rejects.toThrow();
    });

    it("should reject executable files with invalid MIME types", async () => {
      const studentCtx = await createTestContext("demo_STUDENT");
      const caller = appRouter.createCaller(studentCtx);

      await expect(
        caller.evidence.registerEvidence({
          filename: "malware.exe",
          storagePath: "NIT-001/test/malware.exe",
          mimeType: "application/x-msdownload" as any,
          fileSize: 1024,
          sha256Hash: "a".repeat(64),
        })
      ).rejects.toThrow();
    });
  });

  describe("3. Dual-Layer Checksum Validation & Vault Upload", () => {
    it("should accept valid PDF upload when client checksum matches server computation", async () => {
      const studentCtx = await createTestContext("demo_STUDENT");
      const caller = appRouter.createCaller(studentCtx);

      const fileContent = "Official Offer Letter - Atlas Labs 2026. Stipend: INR 50,000.";
      const buffer = Buffer.from(fileContent, "utf-8");
      const base64Data = buffer.toString("base64");
      const clientHash = computeSHA256(buffer);

      const record = await caller.evidence.uploadAndRegister({
        filename: "AtlasLabs_OfferLetter.pdf",
        mimeType: "application/pdf",
        base64Data,
        clientHash,
      });

      expect(record).toBeDefined();
      expect(record.id).toBeDefined();
      expect(record.filename).toBe("AtlasLabs_OfferLetter.pdf");
      expect(record.sha256Hash).toBe(clientHash);
      expect(record.storageBucket).toBe("evidence-vault");
      expect(record.verificationStatus).toBe("SELF_REPORTED");

      // Verify tenant isolated path structure
      expect(record.storagePath).toContain("AtlasLabs_OfferLetter.pdf");

      createdEvidenceId = record.id;
    });

    it("should reject upload with Tamper Alert when client hash does not match file bytes", async () => {
      const studentCtx = await createTestContext("demo_STUDENT");
      const caller = appRouter.createCaller(studentCtx);

      const fileContent = "Legitimate document content";
      const base64Data = Buffer.from(fileContent, "utf-8").toString("base64");
      const falsifiedClientHash = "f".repeat(64); // Tampered hash

      await expect(
        caller.evidence.uploadAndRegister({
          filename: "falsified.pdf",
          mimeType: "application/pdf",
          base64Data,
          clientHash: falsifiedClientHash,
        })
      ).rejects.toThrow(/Tamper Alert/);
    });
  });

  describe("4. Anti-IDOR & Evidence Retrieval", () => {
    it("should allow student to query their own vaulted evidence documents", async () => {
      const studentCtx = await createTestContext("demo_STUDENT");
      const caller = appRouter.createCaller(studentCtx);

      const list = await caller.evidence.getMyEvidence();
      expect(list).toBeDefined();
      expect(list.length).toBeGreaterThan(0);

      const found = list.find((d) => d.id === createdEvidenceId);
      expect(found).toBeDefined();
      expect(found?.sha256Hash).toBeDefined();
      expect(found?.downloadUrl).toBeDefined();
    });

    it("should forbid unauthenticated users from querying student evidence", async () => {
      const unauthCtx = await createTestContext();
      const caller = appRouter.createCaller(unauthCtx);

      await expect(caller.evidence.getMyEvidence()).rejects.toThrow(
        /Session expired|missing authentication token/
      );
    });
  });

  describe("5. Integrity Verification & Tamper Detection", () => {
    it("should verify document integrity when valid payload matches recorded hash", async () => {
      const studentCtx = await createTestContext("demo_STUDENT");
      const caller = appRouter.createCaller(studentCtx);

      expect(createdEvidenceId).toBeDefined();

      const originalBuffer = Buffer.from(
        "Official Offer Letter - Atlas Labs 2026. Stipend: INR 50,000.",
        "utf-8"
      );

      const result = await caller.evidence.verifyIntegrity({
        evidenceId: createdEvidenceId!,
        base64Data: originalBuffer.toString("base64"),
      });

      expect(result.isIntact).toBe(true);
      expect(result.status).toBe("VERIFIED");
      expect(result.message).toContain("Cryptographic integrity verified");
    });

    it("should detect tamper when modified byte payload is verified against recorded hash", async () => {
      const studentCtx = await createTestContext("demo_STUDENT");
      const caller = appRouter.createCaller(studentCtx);

      expect(createdEvidenceId).toBeDefined();

      // Tampered: INR 50,000 -> INR 90,000
      const tamperedBuffer = Buffer.from(
        "Official Offer Letter - Atlas Labs 2026. Stipend: INR 90,000.",
        "utf-8"
      );

      const result = await caller.evidence.verifyIntegrity({
        evidenceId: createdEvidenceId!,
        base64Data: tamperedBuffer.toString("base64"),
      });

      expect(result.isIntact).toBe(false);
      expect(result.status).toBe("TAMPER_DETECTED");
      expect(result.storedHash).not.toBe(result.computedHash);
      expect(result.message).toContain("Tamper Alert");
    });
  });

  describe("6. Evaluator Tamper Demonstration Endpoint", () => {
    it("should provide an interactive tamper simulation with side-by-side hash comparison", async () => {
      const caller = appRouter.createCaller({ req: {} as any, res: {} as any, user: null });

      const demo = await caller.evidence.simulateTamper();

      expect(demo).toBeDefined();
      expect(demo.documentName).toBe("TechCorp_OfferLetter.pdf");
      expect(demo.isMatch).toBe(false);
      expect(demo.status).toBe("TAMPER_DETECTED");
      expect(demo.originalHash).toHaveLength(64);
      expect(demo.tamperedHash).toHaveLength(64);
      expect(demo.originalHash).not.toBe(demo.tamperedHash);
      expect(demo.alertMessage).toContain("INTEGRITY FAILURE");
      expect(demo.educationalNote).toContain("authenticity requires faculty sign-off");
    });
  });
});
