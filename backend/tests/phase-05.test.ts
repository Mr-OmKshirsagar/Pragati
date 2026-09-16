import { and, eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  assessments,
  assessmentSubmissions,
  interventions,
  skillGaps,
  skillHistory,
  skills,
  studentProfiles,
  users,
} from "../drizzle/schema";
import { getDb } from "../src/db";
import { appRouter } from "../src/routers";
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

describe("Phase 05: Faculty Mentoring & Closed-Loop Interventions", () => {
  let createdInterventionId: string | undefined;
  let testGapId: string | undefined;
  let studentProfileId: string | undefined;

  beforeAll(async () => {
    const studentCtx = await createTestContext("demo_STUDENT");
    studentProfileId = studentCtx.user?.studentProfile?.id;

    const db = await getDb();
    if (db && studentProfileId) {
      // Ensure any leftover 82 scores from prior test crashes are removed
      await db
        .delete(skillHistory)
        .where(
          and(
            eq(skillHistory.studentId, studentProfileId),
            eq(skillHistory.score, "82.00")
          )
        );
      // Ensure DSA gap is reset to OPEN
      await db
        .update(skillGaps)
        .set({ status: "OPEN", resolvedAt: null })
        .where(eq(skillGaps.studentId, studentProfileId));
    }

    const caller = appRouter.createCaller(studentCtx);
    // Ensure student's gaps are evaluated and seeded
    const gaps = await caller.skillGap.getMyGaps();
    const dsaGap = gaps.find((g) => g.skillName === "Data Structures & Algorithms");
    testGapId = dsaGap?.id;
  });

  afterAll(async () => {
    const db = await getDb();
    if (db) {
      if (createdInterventionId) {
        await db
          .delete(interventions)
          .where(eq(interventions.id, createdInterventionId));
      }
      if (testGapId) {
        await db
          .update(skillGaps)
          .set({ status: "OPEN", resolvedAt: null })
          .where(eq(skillGaps.id, testGapId));
      }
      if (studentProfileId) {
        await db
          .delete(skillHistory)
          .where(
            and(
              eq(skillHistory.studentId, studentProfileId),
              eq(skillHistory.score, "82.00")
            )
          );
      }
    }
  });

  describe("1. Teacher-Guardian Ward Scope", () => {
    it("should allow Dr. Anand Verma (FACULTY) to view assigned ward Rahul Sharma", async () => {
      const facultyCtx = await createTestContext("demo_FACULTY");
      const caller = appRouter.createCaller(facultyCtx);

      const wards = await caller.faculty.getWards();
      expect(wards).toBeDefined();
      expect(wards.length).toBeGreaterThan(0);

      const rahul = wards.find((w) => w.name === "Rahul Sharma");
      expect(rahul).toBeDefined();
      expect(rahul?.enrollmentNumber).toBe("CSE2024042");
      expect(rahul?.cgpa).toBe(8.42);
      expect(["NEEDS_ATTENTION", "ON_TRACK"]).toContain(rahul?.status);
    });
  });

  describe("2. Intervention Scheduling & State Transition", () => {
    it("should schedule a mentoring intervention and update skill gap to IN_REVIEW", async () => {
      const facultyCtx = await createTestContext("demo_FACULTY");
      const caller = appRouter.createCaller(facultyCtx);

      expect(testGapId).toBeDefined();
      expect(studentProfileId).toBeDefined();

      const result = await caller.faculty.createIntervention({
        studentId: studentProfileId!,
        skillGapId: testGapId!,
        type: "MENTORING",
        description: "1-on-1 deep dive on tree traversal and recursion optimization.",
        startDate: "2026-09-20",
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.status).toBe("SCHEDULED");
      expect(result.type).toBe("MENTORING");
      createdInterventionId = result.id;

      // Verify gap is now IN_REVIEW in live database
      const db = await getDb();
      const [gapRecord] = await db!
        .select()
        .from(skillGaps)
        .where(eq(skillGaps.id, testGapId!))
        .limit(1);

      expect(gapRecord).toBeDefined();
      expect(gapRecord.status).toBe("IN_REVIEW");
    });

    it("should record intervention session outcome text and mark as COMPLETED", async () => {
      const facultyCtx = await createTestContext("demo_FACULTY");
      const caller = appRouter.createCaller(facultyCtx);

      expect(createdInterventionId).toBeDefined();

      const updated = await caller.faculty.recordOutcome({
        interventionId: createdInterventionId!,
        outcome: "Conducted 45-min whiteboard session. Assigned 5 practice LeetCode problems on trees.",
        status: "COMPLETED",
      });

      expect(updated).toBeDefined();
      expect(updated.status).toBe("COMPLETED");
      expect(updated.outcome).toContain("whiteboard session");
    });
  });

  describe("3. Student Mentoring Perspective", () => {
    it("should allow student to query their scheduled interventions via studentRouter", async () => {
      const studentCtx = await createTestContext("demo_STUDENT");
      const caller = appRouter.createCaller(studentCtx);

      const list = await caller.student.getInterventions();
      expect(list).toBeDefined();
      expect(list.length).toBeGreaterThan(0);

      const ourIntervention = list.find((i) => i.id === createdInterventionId);
      expect(ourIntervention).toBeDefined();
      expect(ourIntervention?.mentorName).toBe("Dr. Anand Verma");
      expect(ourIntervention?.skillName).toBe("Data Structures & Algorithms");
    });
  });

  describe("4. Automated Closed-Loop Resolution", () => {
    it("should automatically resolve skill gap when follow-up assessment score >= 75", async () => {
      const studentCtx = await createTestContext("demo_STUDENT");
      const caller = appRouter.createCaller(studentCtx);

      // Get DSA assessments
      const assessmentsList = await caller.student.getAssessments();
      const dsaAssessment = assessmentsList[0];
      expect(dsaAssessment).toBeDefined();

      // Submit follow-up assessment scoring 82 (>= 75 target)
      const submission = await caller.student.submitAssessment({
        assessmentId: dsaAssessment.id,
        score: 82,
        answers: { followUp: "resolved" },
      });

      expect(submission.success).toBe(true);

      // Verify skill gap is marked RESOLVED in database
      const db = await getDb();
      const [resolvedGap] = await db!
        .select()
        .from(skillGaps)
        .where(eq(skillGaps.id, testGapId!))
        .limit(1);

      expect(resolvedGap).toBeDefined();
      expect(resolvedGap.status).toBe("RESOLVED");
      expect(resolvedGap.resolvedAt).toBeDefined();

      // Verify linked intervention is COMPLETED
      const [resolvedIntervention] = await db!
        .select()
        .from(interventions)
        .where(eq(interventions.id, createdInterventionId!))
        .limit(1);

      expect(resolvedIntervention).toBeDefined();
      expect(resolvedIntervention.status).toBe("COMPLETED");

      // Clean up test submission score 82
      await db!
        .delete(assessmentSubmissions)
        .where(eq(assessmentSubmissions.score, "82.00"));
      await db!.delete(skillHistory).where(eq(skillHistory.score, "82.00"));
    });
  });

  describe("5. Role-Based Access Control", () => {
    it("should reject unauthenticated request to faculty.getWards with UNAUTHORIZED", async () => {
      const anonCtx = await createTestContext();
      const caller = appRouter.createCaller(anonCtx);

      await expect(caller.faculty.getWards()).rejects.toThrowError(
        /Session expired or missing authentication token/
      );
    });

    it("should FORBID a STUDENT from calling faculty.getWards", async () => {
      const studentCtx = await createTestContext("demo_STUDENT");
      const caller = appRouter.createCaller(studentCtx);

      await expect(caller.faculty.getWards()).rejects.toThrowError(
        /Role 'STUDENT' is not authorized to execute this procedure/
      );
    });
  });
});
