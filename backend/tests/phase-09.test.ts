import crypto from "crypto";
import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  applications,
  auditLogs,
  notifications,
  placementRules,
  recruitmentDrives,
  studentProfiles,
  users,
} from "../drizzle/schema";
import { getDb } from "../src/db";
import { appRouter } from "../src/routers";
import * as applicationService from "../src/services/applicationService";
import * as tnpService from "../src/services/tnpService";
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

describe("Phase 09: Recruitment Drive Publishing & 1-Click Transparent Applications", () => {
  let studentCtx: Context;
  let tnpCtx: Context;
  let unauthCtx: Context;
  let benchmarkDriveId: string;
  let impossibleDriveId: string;
  let createdApplicationId: string;

  beforeAll(async () => {
    studentCtx = await createTestContext("demo_STUDENT");
    tnpCtx = await createTestContext("demo_TNP_COORDINATOR");
    unauthCtx = await createTestContext();

    const db = await getDb();
    if (!db) throw new Error("Database offline");

    // 1. Create a dedicated eligible recruitment drive where Rahul Sharma is 100% eligible
    const [eligibleDrive] = await db
      .insert(recruitmentDrives)
      .values({
        institutionId: tnpCtx.user!.institutionId,
        companyName: "ABC Technologies",
        jobTitle: "Associate Software Engineer",
        description:
          "Flagship campus recruitment drive for ABC Technologies. Evaluates verified student profile attributes.",
        ctcOrStipend: "14.5 LPA",
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: "PUBLISHED",
        createdBy: tnpCtx.user!.id,
      })
      .returning();
    benchmarkDriveId = eligibleDrive.id;

    await db.insert(placementRules).values({
      recruitmentDriveId: benchmarkDriveId,
      version: 1,
      ruleDefinition: {
        operator: "AND",
        conditions: [
          { field: "cgpa", operator: ">=", value: 7.0 },
          { field: "active_backlogs", operator: "<=", value: 2 },
        ],
      },
      isActive: true,
      createdBy: tnpCtx.user!.id,
    });

    // Clean up any pre-existing application for Rahul Sharma on benchmark drive
    if (studentCtx.user?.studentProfile?.id) {
      await db
        .delete(applications)
        .where(
          and(
            eq(applications.studentId, studentCtx.user.studentProfile.id),
            eq(applications.recruitmentDriveId, benchmarkDriveId)
          )
        );
    }

    // 2. Create an "Impossible Criteria" Drive to test Server-Side Gatekeeping
    const [impossibleDrive] = await db
      .insert(recruitmentDrives)
      .values({
        institutionId: tnpCtx.user!.institutionId,
        companyName: "Quantum Research Labs",
        jobTitle: "Principal Systems Scientist",
        description: "Requires extraordinary CGPA >= 9.85 and DSA >= 99 to test gatekeeping.",
        ctcOrStipend: "45 LPA",
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: "PUBLISHED",
        createdBy: tnpCtx.user!.id,
      })
      .returning();
    impossibleDriveId = impossibleDrive.id;

    await db.insert(placementRules).values({
      recruitmentDriveId: impossibleDriveId,
      version: 1,
      ruleDefinition: {
        operator: "AND",
        conditions: [
          { field: "cgpa", operator: ">=", value: 9.85 },
          { field: "skill.DSA", operator: ">=", value: 99 },
        ],
      },
      isActive: true,
      createdBy: tnpCtx.user!.id,
    });
  });

  afterAll(async () => {
    const db = await getDb();
    if (db) {
      // Clean up test applications & drives
      if (benchmarkDriveId) {
        await db
          .delete(applications)
          .where(eq(applications.recruitmentDriveId, benchmarkDriveId));
        await db
          .delete(placementRules)
          .where(eq(placementRules.recruitmentDriveId, benchmarkDriveId));
        await db
          .delete(recruitmentDrives)
          .where(eq(recruitmentDrives.id, benchmarkDriveId));
      }

      if (impossibleDriveId) {
        await db
          .delete(applications)
          .where(eq(applications.recruitmentDriveId, impossibleDriveId));
        await db
          .delete(placementRules)
          .where(eq(placementRules.recruitmentDriveId, impossibleDriveId));
        await db
          .delete(recruitmentDrives)
          .where(eq(recruitmentDrives.id, impossibleDriveId));
      }
    }
  });

  // =========================================================================
  // 1. SERVER-SIDE GATEKEEPING & DIRECT API BYPASS PROTECTION
  // =========================================================================
  describe("1. Server-Side Gatekeeping & Invariant Enforcement", () => {
    it("blocks an ineligible student from applying via direct API call with RULE_VIOLATION (400)", async () => {
      const caller = appRouter.createCaller(studentCtx);

      // Student has CGPA ~8.42 and DSA ~78, which is below 9.85 & 99
      await expect(
        caller.recruitment.applyToDrive({ driveId: impossibleDriveId })
      ).rejects.toThrow(/RULE_VIOLATION/);

      // Verify no row was inserted
      const db = await getDb();
      const rows = await db!
        .select()
        .from(applications)
        .where(
          and(
            eq(applications.studentId, studentCtx.user!.studentProfile!.id),
            eq(applications.recruitmentDriveId, impossibleDriveId)
          )
        );
      expect(rows).toHaveLength(0);
    });
  });

  // =========================================================================
  // 2. ELIGIBLE 1-CLICK APPLICATION SUBMISSION
  // =========================================================================
  describe("2. 1-Click Application Submission for Eligible Candidates", () => {
    it("allows eligible student (Rahul Sharma) to apply to ABC Technologies drive in 1-click", async () => {
      const caller = appRouter.createCaller(studentCtx);

      const response = await caller.recruitment.applyToDrive({
        driveId: benchmarkDriveId,
      });

      expect(response).toBeDefined();
      expect(response.application).toBeDefined();
      expect(response.application.status).toBe("APPLIED");
      expect(response.drive.companyName).toBe("ABC Technologies");
      expect(response.evaluation.eligible).toBe(true);

      createdApplicationId = response.application.id;

      // Verify directly in Postgres DB
      const db = await getDb();
      const [dbRecord] = await db!
        .select()
        .from(applications)
        .where(eq(applications.id, createdApplicationId));

      expect(dbRecord).toBeDefined();
      expect(dbRecord.studentId).toBe(studentCtx.user!.studentProfile!.id);
      expect(dbRecord.recruitmentDriveId).toBe(benchmarkDriveId);
      expect(dbRecord.status).toBe("APPLIED");
    });
  });

  // =========================================================================
  // 3. IDEMPOTENCY & DUPLICATE SUBMISSION PREVENTION
  // =========================================================================
  describe("3. Idempotency & Duplicate Prevention", () => {
    it("rejects duplicate application attempts with 409 CONFLICT and DUPLICATE_APPLICATION", async () => {
      const caller = appRouter.createCaller(studentCtx);

      // Second application attempt for the same student & drive
      await expect(
        caller.recruitment.applyToDrive({ driveId: benchmarkDriveId })
      ).rejects.toThrow(/DUPLICATE_APPLICATION/);

      // Verify only 1 application exists in DB
      const db = await getDb();
      const records = await db!
        .select()
        .from(applications)
        .where(
          and(
            eq(applications.studentId, studentCtx.user!.studentProfile!.id),
            eq(applications.recruitmentDriveId, benchmarkDriveId)
          )
        );
      expect(records).toHaveLength(1);
    });
  });

  // =========================================================================
  // 4. STUDENT APPLICATION HISTORY RETRIEVAL
  // =========================================================================
  describe("4. Student Application Tracking", () => {
    it("allows student to view their submitted applications with drive details", async () => {
      const caller = appRouter.createCaller(studentCtx);

      const myApps = await caller.recruitment.getMyApplications();

      expect(Array.isArray(myApps)).toBe(true);
      expect(myApps.length).toBeGreaterThanOrEqual(1);

      const abcApp = myApps.find((a) => a.recruitmentDriveId === benchmarkDriveId);
      expect(abcApp).toBeDefined();
      expect(abcApp?.companyName).toBe("ABC Technologies");
      expect(abcApp?.jobTitle).toBe("Associate Software Engineer");
      expect(abcApp?.status).toBe("APPLIED");
      expect(abcApp?.appliedAt).toBeDefined();
    });
  });

  // =========================================================================
  // 5. T&P CANDIDATE PIPELINE & APPLICANT ROSTER
  // =========================================================================
  describe("5. T&P Coordinator Candidate Pipeline & Roster", () => {
    it("allows T&P Coordinator to query candidate applications for a drive", async () => {
      const caller = appRouter.createCaller(tnpCtx);

      const applicants = await caller.recruitment.getDriveApplicants({
        driveId: benchmarkDriveId,
      });

      expect(Array.isArray(applicants)).toBe(true);
      expect(applicants.length).toBeGreaterThanOrEqual(1);

      const rahulApp = applicants.find(
        (a: any) => a.studentId === studentCtx.user!.studentProfile!.id
      );
      expect(rahulApp).toBeDefined();
      expect(rahulApp?.studentName).toBe(studentCtx.user!.name);
      expect(rahulApp?.status).toBe("APPLIED");
      expect(rahulApp?.snapshot).toBeDefined();
      expect(rahulApp?.snapshot?.cgpa).toBeGreaterThanOrEqual(7.5);
    });
  });

  // =========================================================================
  // 6. CANDIDATE STAGE PROGRESSION STATE MACHINE
  // =========================================================================
  describe("6. Candidate Pipeline Stage Transitions", () => {
    it("allows T&P Coordinator to advance candidate to SHORTLISTED", async () => {
      const caller = appRouter.createCaller(tnpCtx);

      const updated = await caller.recruitment.updateApplicantStatus({
        applicationId: createdApplicationId,
        status: "SHORTLISTED",
        remarks: "Top quartile CGPA & DSA assessment scores",
      });

      expect(updated.status).toBe("SHORTLISTED");

      const db = await getDb();
      const [app] = await db!
        .select()
        .from(applications)
        .where(eq(applications.id, createdApplicationId));
      expect(app.status).toBe("SHORTLISTED");
    });

    it("allows T&P Coordinator to advance candidate to INTERVIEWING", async () => {
      const caller = appRouter.createCaller(tnpCtx);

      const updated = await caller.recruitment.updateApplicantStatus({
        applicationId: createdApplicationId,
        status: "INTERVIEWING",
        remarks: "Invited to Technical Round 1",
      });

      expect(updated.status).toBe("INTERVIEWING");
    });

    it("allows T&P Coordinator to advance candidate to OFFERED", async () => {
      const caller = appRouter.createCaller(tnpCtx);

      const updated = await caller.recruitment.updateApplicantStatus({
        applicationId: createdApplicationId,
        status: "OFFERED",
        remarks: "Final Offer extended: 14.5 LPA",
      });

      expect(updated.status).toBe("OFFERED");
    });
  });

  // =========================================================================
  // 7. COMPLIANCE AUDIT TRAIL & NOTIFICATIONS
  // =========================================================================
  describe("7. Compliance Ledger & In-App Notifications", () => {
    it("records immutable audit log entries for submission and status changes", async () => {
      const db = await getDb();
      expect(db).toBeDefined();
      if (!db) return;

      const logs = await db
        .select()
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.resourceType, "APPLICATION"),
            eq(auditLogs.resourceId, createdApplicationId)
          )
        );

      expect(logs.length).toBeGreaterThanOrEqual(2);

      const submitLog = logs.find((l) => l.action === "SUBMIT_APPLICATION");
      expect(submitLog).toBeDefined();
      expect((submitLog?.metadata as any).companyName).toBe("ABC Technologies");

      const statusLog = logs.find((l) => l.action === "UPDATE_APPLICATION_STATUS");
      expect(statusLog).toBeDefined();
    });

    it("creates user notifications upon application milestones", async () => {
      const db = await getDb();
      expect(db).toBeDefined();
      if (!db) return;

      const userNotes = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, studentCtx.user!.id));

      const appSubmittedNote = userNotes.find(
        (n) => n.type === "APPLICATION_SUBMITTED"
      );
      expect(appSubmittedNote).toBeDefined();
      expect(appSubmittedNote?.title).toContain("ABC Technologies");
    });
  });

  // =========================================================================
  // 8. SECURITY & RBAC GUARDS
  // =========================================================================
  describe("8. Security & RBAC Enforcement", () => {
    it("forbids students from updating applicant statuses", async () => {
      const studentCaller = appRouter.createCaller(studentCtx);

      await expect(
        studentCaller.recruitment.updateApplicantStatus({
          applicationId: createdApplicationId,
          status: "OFFERED",
        })
      ).rejects.toThrow();
    });

    it("forbids students from viewing the entire drive candidate pipeline", async () => {
      const studentCaller = appRouter.createCaller(studentCtx);

      await expect(
        studentCaller.recruitment.getDriveApplicants({ driveId: benchmarkDriveId })
      ).rejects.toThrow();
    });

    it("forbids unauthenticated users from accessing recruitment procedures", async () => {
      const unauthCaller = appRouter.createCaller(unauthCtx);

      await expect(
        unauthCaller.recruitment.applyToDrive({ driveId: benchmarkDriveId })
      ).rejects.toThrow();

      await expect(
        unauthCaller.recruitment.getMyApplications()
      ).rejects.toThrow();

      await expect(
        unauthCaller.recruitment.getDriveApplicants({ driveId: benchmarkDriveId })
      ).rejects.toThrow();

      await expect(
        unauthCaller.recruitment.updateApplicantStatus({
          applicationId: createdApplicationId,
          status: "OFFERED",
        })
      ).rejects.toThrow();
    });
  });
});
