import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assessmentSubmissions, skillHistory, studentProfiles, users } from "../drizzle/schema";
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
      const [matchedUser] = await db.select().from(users).where(eq(users.role, role)).limit(1);
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

describe("Phase 03: Student Profiles, Academics & Skills Engine", () => {
  beforeAll(async () => {
    const db = await getDb();
    if (db) {
      await db.delete(assessmentSubmissions).where(eq(assessmentSubmissions.score, "88.00"));
      await db.delete(skillHistory).where(eq(skillHistory.score, "88.00"));
    }
  });

  afterAll(async () => {
    const db = await getDb();
    if (db) {
      await db.delete(assessmentSubmissions).where(eq(assessmentSubmissions.score, "88.00"));
      await db.delete(skillHistory).where(eq(skillHistory.score, "88.00"));
    }
  });
  it("should fetch Rahul Sharma's student profile with institution, department, and mentor", async () => {
    const ctx = await createTestContext("demo_STUDENT");
    const caller = appRouter.createCaller(ctx);

    const profile = await caller.student.getProfile();
    expect(profile).toBeDefined();
    expect(profile.name).toBe("Rahul Sharma");
    expect(profile.enrollmentNumber).toBe("CSE2024042");
    expect(profile.program).toContain("Computer Science");
    expect(profile.institution.code).toBe("NIT-001");
    expect(profile.department.code).toBe("CSE");
    expect(profile.mentor).toBeDefined();
    expect(profile.mentor?.name).toBe("Dr. Anand Verma");
  });

  it("should fetch academic records with CGPA 8.42, 5 semesters, and 1 active OS backlog", async () => {
    const ctx = await createTestContext("demo_STUDENT");
    const caller = appRouter.createCaller(ctx);

    const academics = await caller.student.getAcademics();
    expect(academics).toBeDefined();
    expect(academics.cgpa).toBe(8.42);
    expect(academics.semesters.length).toBe(5);
    expect(academics.totalCredits).toBe(100);
    expect(academics.activeBacklogsCount).toBe(1);

    // Verify the active backlog is Operating Systems
    const osBacklog = academics.backlogs.find((b) => b.subjectCode === "CS401");
    expect(osBacklog).toBeDefined();
    expect(osBacklog?.status).toBe("ACTIVE");
    expect(osBacklog?.subjectName).toBe("Operating Systems");
  });

  it("should fetch skills progression and identify historical DSA decline [78, 70, 61]", async () => {
    const ctx = await createTestContext("demo_STUDENT");
    const caller = appRouter.createCaller(ctx);

    const skillData = await caller.student.getSkills();
    expect(skillData.skills.length).toBeGreaterThanOrEqual(6);

    const dsa = skillData.skills.find((s) => s.name === "Data Structures & Algorithms");
    expect(dsa).toBeDefined();
    expect(dsa?.scoreHistory).toEqual(expect.arrayContaining([78, 70, 61]));
    expect(dsa?.latestScore).toBe(61);
    expect(dsa?.delta).toBe(-9);
    expect(dsa?.verified).toBe(true);
  });

  it("should submit a continuous assessment and append immutable record to skill_history", async () => {
    const ctx = await createTestContext("demo_STUDENT");
    const caller = appRouter.createCaller(ctx);

    const assessments = await caller.student.getAssessments();
    expect(assessments.length).toBeGreaterThan(0);
    const targetAssessment = assessments[0];

    const submissionResult = await caller.student.submitAssessment({
      assessmentId: targetAssessment.id,
      score: 88,
      answers: { q1: "A", q2: "B" },
    });

    expect(submissionResult.success).toBe(true);
    expect(submissionResult.score).toBe(88);
    expect(submissionResult.submissionId).toBeDefined();

    // Verify record exists in live database
    const db = await getDb();
    expect(db).toBeDefined();

    const [subRecord] = await db!
      .select()
      .from(assessmentSubmissions)
      .where(eq(assessmentSubmissions.id, submissionResult.submissionId))
      .limit(1);

    expect(subRecord).toBeDefined();
    expect(parseFloat(subRecord.score)).toBe(88);
    expect(subRecord.studentId).toBe(ctx.user?.studentProfile?.id);

    // Verify skill_history updated with new entry
    const historyEntries = await db!
      .select()
      .from(skillHistory)
      .where(eq(skillHistory.assessmentId, targetAssessment.id));

    expect(historyEntries.length).toBeGreaterThan(0);
    const latestHistory = historyEntries[historyEntries.length - 1];
    expect(parseFloat(latestHistory.score)).toBe(88);
  });

  it("should enforce Anti-IDOR: reject unauthenticated users with UNAUTHORIZED", async () => {
    const ctx = await createTestContext(); // No token
    const caller = appRouter.createCaller(ctx);

    await expect(caller.student.getProfile()).rejects.toThrowError(/Session expired or missing authentication token/);
    await expect(caller.student.getAcademics()).rejects.toThrowError(/Session expired or missing authentication token/);
    await expect(caller.student.getSkills()).rejects.toThrowError(/Session expired or missing authentication token/);
  });

  it("should enforce Anti-IDOR: reject FACULTY role from calling studentProcedure with FORBIDDEN", async () => {
    const ctx = await createTestContext("demo_FACULTY");
    const caller = appRouter.createCaller(ctx);

    await expect(caller.student.getProfile()).rejects.toThrowError(/Role 'FACULTY' is not authorized/);
    await expect(caller.student.getAcademics()).rejects.toThrowError(/Role 'FACULTY' is not authorized/);
    await expect(caller.student.getSkills()).rejects.toThrowError(/Role 'FACULTY' is not authorized/);
  });
});
