import crypto from "crypto";
import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  auditLogs,
  evidenceDocuments,
  internshipCheckins,
  internshipEvidence,
  internships,
  studentProfiles,
  users,
  verifications,
} from "../drizzle/schema";
import { getDb } from "../src/db";
import { appRouter } from "../src/routers";
import * as internshipService from "../src/services/internshipService";
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

describe("Phase 07: Smart Internship Lifecycle Management & Faculty Verification", () => {
  let studentCtx: Context;
  let facultyCtx: Context;
  let unauthCtx: Context;
  let testInternshipId: string | undefined;
  let testEvidenceDocIds: string[] = [];
  let foreignProfileId: string | undefined;
  let foreignUserId: string | undefined;

  beforeAll(async () => {
    studentCtx = await createTestContext("demo_STUDENT");
    facultyCtx = await createTestContext("demo_FACULTY");
    unauthCtx = await createTestContext();
  });

  afterAll(async () => {
    const db = await getDb();
    if (db) {
      if (testInternshipId) {
        await db
          .delete(verifications)
          .where(
            eq(
              verifications.notes,
              "Phase 07 Automated Test Approval Notes"
            )
          );
        await db
          .delete(auditLogs)
          .where(eq(auditLogs.resourceId, testInternshipId));
        await db
          .delete(internshipCheckins)
          .where(eq(internshipCheckins.internshipId, testInternshipId));
        await db
          .delete(internshipEvidence)
          .where(eq(internshipEvidence.internshipId, testInternshipId));
        await db
          .delete(internships)
          .where(eq(internships.id, testInternshipId));
      }
      for (const docId of testEvidenceDocIds) {
        await db
          .delete(evidenceDocuments)
          .where(eq(evidenceDocuments.id, docId));
      }
      if (foreignProfileId) {
        await db
          .delete(studentProfiles)
          .where(eq(studentProfiles.id, foreignProfileId));
      }
      if (foreignUserId) {
        await db.delete(users).where(eq(users.id, foreignUserId));
      }
    }
  });

  describe("1. RBAC and Endpoint Access Control", () => {
    it("should prevent unauthenticated callers from accessing student internship procedures", async () => {
      const caller = appRouter.createCaller(unauthCtx);
      await expect(caller.internship.getMyInternship()).rejects.toThrow(
        /Session expired|missing authentication token/
      );
    });

    it("should prevent unauthenticated callers from accessing faculty review queue", async () => {
      const caller = appRouter.createCaller(unauthCtx);
      await expect(caller.internship.getReviewQueue()).rejects.toThrow(
        /Session expired|missing authentication token/
      );
    });

    it("should forbid students from executing verifyInternship", async () => {
      const studentCaller = appRouter.createCaller(studentCtx);
      await expect(
        studentCaller.internship.verifyInternship({
          internshipId: "00000000-0000-0000-0000-000000000001",
          status: "INSTITUTION_VERIFIED",
        })
      ).rejects.toThrow(/not authorized|Access denied/);
    });
  });

  describe("2. Evidence Completeness Formula Calculation", () => {
    it("should calculate 0% when no milestones are completed", () => {
      const score = internshipService.calculateEvidenceCompleteness({
        hasOfferLetter: false,
        hasCheckin: false,
        hasReport: false,
        hasCertificate: false,
      });
      expect(score).toBe(0);
    });

    it("should calculate 25% for Offer Letter only", () => {
      const score = internshipService.calculateEvidenceCompleteness({
        hasOfferLetter: true,
        hasCheckin: false,
        hasReport: false,
        hasCertificate: false,
      });
      expect(score).toBe(25);
    });

    it("should calculate 50% for Offer Letter and >= 1 Check-in", () => {
      const score = internshipService.calculateEvidenceCompleteness({
        hasOfferLetter: true,
        hasCheckin: true,
        hasReport: false,
        hasCertificate: false,
      });
      expect(score).toBe(50);
    });

    it("should calculate 75% for Offer Letter, Check-in, and Internship Report", () => {
      const score = internshipService.calculateEvidenceCompleteness({
        hasOfferLetter: true,
        hasCheckin: true,
        hasReport: true,
        hasCertificate: false,
      });
      expect(score).toBe(75);
    });

    it("should calculate 100% when all 4 milestones are complete", () => {
      const score = internshipService.calculateEvidenceCompleteness({
        hasOfferLetter: true,
        hasCheckin: true,
        hasReport: true,
        hasCertificate: true,
      });
      expect(score).toBe(100);
    });
  });

  describe("3. Internship Creation & Active Tracking", () => {
    it("should create a new student internship record with default IN_PROGRESS and PENDING states", async () => {
      const studentCaller = appRouter.createCaller(studentCtx);
      const res = await studentCaller.internship.createInternship({
        companyName: "Hyperion Robotics",
        role: "Robotics Firmware Intern",
        startDate: "2026-06-01",
        endDate: "2026-11-30",
        stipend: 50000,
        supervisorName: "Dr. Elena Vance",
        supervisorEmail: "elena@hyperionrobotics.tech",
      });

      expect(res).toBeDefined();
      expect(res.id).toBeDefined();
      expect(res.companyName).toBe("Hyperion Robotics");
      expect(res.role).toBe("Robotics Firmware Intern");
      expect(res.status).toBe("IN_PROGRESS");
      expect(res.verificationStatus).toBe("PENDING");

      testInternshipId = res.id;
    });

    it("should retrieve active internship for student with 0% initial completeness", async () => {
      const studentCaller = appRouter.createCaller(studentCtx);
      const active = await studentCaller.internship.getMyInternship();

      expect(active).toBeDefined();
      expect(active.id).toBe(testInternshipId);
      expect(active.companyName).toBe("Hyperion Robotics");
      expect(active.completeness).toBe(0);
      expect(active.milestones.hasOfferLetter).toBe(false);
      expect(active.milestones.hasCheckin).toBe(false);
      expect(active.milestones.hasReport).toBe(false);
      expect(active.milestones.hasCertificate).toBe(false);
    });
  });

  describe("4. Progress Check-in Submissions", () => {
    it("should allow student to submit a bi-weekly progress check-in", async () => {
      const studentCaller = appRouter.createCaller(studentCtx);
      const checkin = await studentCaller.internship.submitCheckin({
        internshipId: testInternshipId!,
        summary: "Implemented RTOS interrupt handlers and telemetry transmission modules.",
      });

      expect(checkin).toBeDefined();
      expect(checkin.internshipId).toBe(testInternshipId);
      expect(checkin.status).toBe("SUBMITTED");
      expect(checkin.summary).toContain("RTOS interrupt handlers");
    });

    it("should increase completeness to 25% after submitting check-in", async () => {
      const studentCaller = appRouter.createCaller(studentCtx);
      const active = await studentCaller.internship.getMyInternship();

      expect(active.checkins.length).toBeGreaterThanOrEqual(1);
      expect(active.milestones.hasCheckin).toBe(true);
      expect(active.completeness).toBe(25);
    });

    it("should reject check-in submission with insufficient summary length", async () => {
      const studentCaller = appRouter.createCaller(studentCtx);
      await expect(
        studentCaller.internship.submitCheckin({
          internshipId: testInternshipId!,
          summary: "Hi",
        })
      ).rejects.toThrow();
    });
  });

  describe("5. Cryptographic Evidence Linking & Milestone Progression", () => {
    it("should link cryptographic evidence documents to internship milestones", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database offline");

      // Seed 3 evidence documents (Offer Letter, Report, Certificate)
      const [offerDoc] = await db
        .insert(evidenceDocuments)
        .values({
          studentId: studentCtx.user!.studentProfile!.id,
          filename: "Hyperion_Offer_Letter.pdf",
          storageBucket: "evidence-vault",
          storagePath: `NIT-001/${studentCtx.user!.studentProfile!.id}/offer.pdf`,
          mimeType: "application/pdf",
          fileSize: 154200,
          sha256Hash:
            "1111111111111111111111111111111111111111111111111111111111111111",
          verificationStatus: "SELF_REPORTED",
        })
        .returning();
      testEvidenceDocIds.push(offerDoc.id);

      const [reportDoc] = await db
        .insert(evidenceDocuments)
        .values({
          studentId: studentCtx.user!.studentProfile!.id,
          filename: "Hyperion_Internship_Report.pdf",
          storageBucket: "evidence-vault",
          storagePath: `NIT-001/${studentCtx.user!.studentProfile!.id}/report.pdf`,
          mimeType: "application/pdf",
          fileSize: 450120,
          sha256Hash:
            "2222222222222222222222222222222222222222222222222222222222222222",
          verificationStatus: "SELF_REPORTED",
        })
        .returning();
      testEvidenceDocIds.push(reportDoc.id);

      const [certDoc] = await db
        .insert(evidenceDocuments)
        .values({
          studentId: studentCtx.user!.studentProfile!.id,
          filename: "Hyperion_Completion_Certificate.pdf",
          storageBucket: "evidence-vault",
          storagePath: `NIT-001/${studentCtx.user!.studentProfile!.id}/cert.pdf`,
          mimeType: "application/pdf",
          fileSize: 220500,
          sha256Hash:
            "3333333333333333333333333333333333333333333333333333333333333333",
          verificationStatus: "SELF_REPORTED",
        })
        .returning();
      testEvidenceDocIds.push(certDoc.id);

      const studentCaller = appRouter.createCaller(studentCtx);

      // Link Offer Letter -> Completeness becomes 50%
      await studentCaller.internship.linkEvidence({
        internshipId: testInternshipId!,
        evidenceDocumentId: offerDoc.id,
        evidenceType: "OFFER_LETTER",
      });

      let active = await studentCaller.internship.getMyInternship();
      expect(active.milestones.hasOfferLetter).toBe(true);
      expect(active.completeness).toBe(50); // Offer Letter (25) + Check-in (25)

      // Link Internship Report -> Completeness becomes 75%
      await studentCaller.internship.linkEvidence({
        internshipId: testInternshipId!,
        evidenceDocumentId: reportDoc.id,
        evidenceType: "INTERNSHIP_REPORT",
      });

      active = await studentCaller.internship.getMyInternship();
      expect(active.milestones.hasReport).toBe(true);
      expect(active.completeness).toBe(75);

      // Link Completion Certificate -> Completeness reaches 100%
      await studentCaller.internship.linkEvidence({
        internshipId: testInternshipId!,
        evidenceDocumentId: certDoc.id,
        evidenceType: "COMPLETION_CERTIFICATE",
      });

      active = await studentCaller.internship.getMyInternship();
      expect(active.milestones.hasCertificate).toBe(true);
      expect(active.completeness).toBe(100);
      expect(active.evidence.length).toBe(3);
    });
  });

  describe("6. Anti-IDOR & Security Boundary Enforcements", () => {
    it("should prevent student from linking an evidence document belonging to another student", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database offline");

      // Create a foreign student profile to test IDOR violation safely
      const [foreignUser] = await db
        .insert(users)
        .values({
          id: crypto.randomUUID(),
          email: `foreign-student-${Date.now()}@test.edu`,
          name: "Foreign Student",
          role: "STUDENT",
          institutionId: studentCtx.user!.institutionId!,
          departmentId: studentCtx.user!.departmentId!,
        })
        .returning();
      foreignUserId = foreignUser.id;

      const [foreignProfile] = await db
        .insert(studentProfiles)
        .values({
          userId: foreignUser.id,
          institutionId: studentCtx.user!.institutionId!,
          departmentId: studentCtx.user!.departmentId!,
          enrollmentNumber: `FOR${Date.now().toString().slice(-6)}`,
          program: "B.Tech Computer Science and Engineering",
          currentSemester: 6,
          admissionYear: 2023,
          graduationYear: 2027,
        })
        .returning();
      foreignProfileId = foreignProfile.id;

      const [foreignDoc] = await db
        .insert(evidenceDocuments)
        .values({
          studentId: foreignProfile.id,
          filename: "Stolen_Doc.pdf",
          storageBucket: "evidence-vault",
          storagePath: "forbidden/stolen.pdf",
          mimeType: "application/pdf",
          fileSize: 1000,
          sha256Hash:
            "9999999999999999999999999999999999999999999999999999999999999999",
          verificationStatus: "SELF_REPORTED",
        })
        .returning();
      testEvidenceDocIds.push(foreignDoc.id);

      const studentCaller = appRouter.createCaller(studentCtx);
      await expect(
        studentCaller.internship.linkEvidence({
          internshipId: testInternshipId!,
          evidenceDocumentId: foreignDoc.id,
          evidenceType: "OFFER_LETTER",
        })
      ).rejects.toThrow();
    });

    it("should prevent student from submitting check-in to an internship belonging to another student", async () => {
      const studentCaller = appRouter.createCaller(studentCtx);
      await expect(
        studentCaller.internship.submitCheckin({
          internshipId: "00000000-0000-0000-0000-000000000099",
          summary: "Attempting IDOR checkin injection",
        })
      ).rejects.toThrow();
    });
  });

  describe("7. Faculty Verification Desk & Audit Trail", () => {
    it("should list the active internship in the faculty review queue with 100% completeness", async () => {
      const facultyCaller = appRouter.createCaller(facultyCtx);
      const queue = await facultyCaller.internship.getReviewQueue();

      expect(queue).toBeDefined();
      const target = queue.find((q) => q.id === testInternshipId);
      expect(target).toBeDefined();
      expect(target?.completeness).toBe(100);
      expect(target?.companyName).toBe("Hyperion Robotics");
      expect(target?.verificationStatus).toBe("PENDING");
      expect(target?.evidenceCount).toBe(3);
      expect(target?.checkinCount).toBe(1);
    });

    it("should allow faculty to request revision / reject internship", async () => {
      const facultyCaller = appRouter.createCaller(facultyCtx);
      const res = await facultyCaller.internship.verifyInternship({
        internshipId: testInternshipId!,
        status: "REJECTED",
        notes: "Please provide signed supervisor feedback sheet.",
      });

      expect(res.success).toBe(true);
      expect(res.verificationStatus).toBe("REJECTED");
      expect(res.status).toBe("IN_PROGRESS"); // Rejected does not complete internship
    });

    it("should allow faculty to approve and institutionally verify internship with full audit logging", async () => {
      const facultyCaller = appRouter.createCaller(facultyCtx);
      const res = await facultyCaller.internship.verifyInternship({
        internshipId: testInternshipId!,
        status: "INSTITUTION_VERIFIED",
        notes: "Phase 07 Automated Test Approval Notes",
      });

      expect(res.success).toBe(true);
      expect(res.verificationStatus).toBe("INSTITUTION_VERIFIED");
      expect(res.status).toBe("COMPLETED");

      // Verify database state: internships table
      const db = await getDb();
      if (!db) throw new Error("Database offline");

      const [storedInternship] = await db
        .select()
        .from(internships)
        .where(eq(internships.id, testInternshipId!));
      expect(storedInternship.verificationStatus).toBe("INSTITUTION_VERIFIED");
      expect(storedInternship.status).toBe("COMPLETED");

      // Verify database state: verifications table
      const verifs = await db
        .select()
        .from(verifications)
        .where(
          eq(
            verifications.notes,
            "Phase 07 Automated Test Approval Notes"
          )
        );
      expect(verifs.length).toBeGreaterThanOrEqual(1);
      expect(verifs[0].verifierUserId).toBe(facultyCtx.user!.id);
      expect(verifs[0].verificationType).toBe("INSTITUTION");
      expect(verifs[0].status).toBe("VERIFIED");

      // Verify database state: audit_logs table
      const logs = await db
        .select()
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.resourceId, testInternshipId!),
            eq(auditLogs.action, "INTERNSHIP_VERIFIED")
          )
        );
      expect(logs.length).toBe(1);
      expect(logs[0].resourceType).toBe("internships");
      expect(logs[0].userId).toBe(facultyCtx.user!.id);
    });
  });
});
