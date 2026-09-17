import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  assessments,
  assessmentSubmissions,
  skillGaps,
  skillHistory,
  skills,
  studentProfiles,
  users,
} from "../drizzle/schema";
import { getDb } from "../src/db";
import { appRouter } from "../src/routers";
import { evaluateRuleGap01 } from "../src/rules/skillGapEngine";
import { explainSkillGap } from "../src/services/aiService";
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

describe("Phase 04: Deterministic Skill-Gap Engine & Assistive AI", () => {
  const testAssessmentName = "Vitest Automated Test Assessment Phase 04";

  beforeAll(async () => {
    const db = await getDb();
    if (db) {
      // Clean up any test assessment if it exists
      await db
        .delete(assessments)
        .where(eq(assessments.name, testAssessmentName));

      // Reset gap status to OPEN for fresh test cycle
      await db
        .update(skillGaps)
        .set({ status: "OPEN" })
        .where(eq(skillGaps.ruleId, "RULE_GAP_01"));
    }
  });

  afterAll(async () => {
    const db = await getDb();
    if (db) {
      await db
        .delete(assessments)
        .where(eq(assessments.name, testAssessmentName));
    }
  });

  describe("1. Deterministic Rule Logic (RULE_GAP_01)", () => {
    it("should trigger TRUE when scores strictly decrease across last 3 cycles and active backlogs > 0", () => {
      const result = evaluateRuleGap01([78, 70, 61], 1);
      expect(result).toBe(true);
    });

    it("should trigger FALSE when active backlogs count is 0 even if scores decline", () => {
      const result = evaluateRuleGap01([78, 70, 61], 0);
      expect(result).toBe(false);
    });

    it("should trigger FALSE when scores are increasing or recovering", () => {
      const result1 = evaluateRuleGap01([61, 70, 78], 1);
      expect(result1).toBe(false);

      const result2 = evaluateRuleGap01([78, 61, 70], 1);
      expect(result2).toBe(false);
    });

    it("should trigger FALSE when scores are steady", () => {
      const result = evaluateRuleGap01([75, 75, 75], 2);
      expect(result).toBe(false);
    });

    it("should trigger FALSE when fewer than 3 assessment scores exist", () => {
      const result = evaluateRuleGap01([80, 70], 1);
      expect(result).toBe(false);
    });
  });

  describe("2. Database Gap Evaluation & Idempotent Synchronization", () => {
    it("should evaluate Rahul Sharma's seeded DSA decline and synchronize to skill_gaps", async () => {
      const ctx = await createTestContext("demo_STUDENT");
      const caller = appRouter.createCaller(ctx);

      const gaps = await caller.skillGap.getMyGaps();
      expect(gaps).toBeDefined();
      expect(gaps.length).toBeGreaterThan(0);

      // Verify that DSA is identified as an open skill gap
      const dsaGap = gaps.find((g) => g.skillName === "Data Structures & Algorithms");
      expect(dsaGap).toBeDefined();
      expect(dsaGap?.ruleId).toBe("RULE_GAP_01");
      expect(dsaGap?.severity).toBe("HIGH");
      expect(["OPEN", "IN_REVIEW"]).toContain(dsaGap?.status);
      expect(dsaGap?.reason.active_backlogs).toBeGreaterThanOrEqual(1);
      expect(dsaGap?.reason.score_history).toEqual([78, 70, 61]);
      expect(dsaGap?.reason.backlog_subject).toBe("Operating Systems");
    });

    it("should be idempotent: calling getMyGaps again does not create duplicate entries", async () => {
      const ctx = await createTestContext("demo_STUDENT");
      const caller = appRouter.createCaller(ctx);

      const firstCall = await caller.skillGap.getMyGaps();
      const secondCall = await caller.skillGap.getMyGaps();

      expect(firstCall.length).toBe(secondCall.length);
    });
  });

  describe("3. Assistive AI Explanation Service", () => {
    it(
      "should draft an explanation and recommendation with zero crash guarantee",
      async () => {
        const ctx = await createTestContext("demo_STUDENT");
        const caller = appRouter.createCaller(ctx);

        const gaps = await caller.skillGap.getMyGaps();
        const dsaGap = gaps.find(
          (g) => g.skillName === "Data Structures & Algorithms"
        )!;
        expect(dsaGap).toBeDefined();

        const aiResponse = await caller.skillGap.explainGap({
          skillGapId: dsaGap.id,
        });

        expect(aiResponse).toBeDefined();
        expect(aiResponse.explanation).toBeDefined();
        expect(aiResponse.explanation.length).toBeGreaterThan(10);
        expect(aiResponse.recommendedAction).toBeDefined();
        expect(["ai", "rule_fallback"]).toContain(aiResponse.source);
      },
      15000
    );

    it("should return deterministic rule fallback when apiKey is missing or invalid", async () => {
      const prevKey = process.env.GEMINI_API_KEY;
      process.env.GEMINI_API_KEY = "";
      try {
        const fallbackResult = await explainSkillGap({
          studentName: "Test Student",
          skillName: "Operating Systems",
          scoreHistory: [80, 72, 63],
          backlogSubject: "Computer Networks",
        });

        expect(fallbackResult.source).toBe("rule_fallback");
        expect(fallbackResult.explanation).toContain("Operating Systems");
        expect(fallbackResult.recommendedAction).toContain("mentoring");
      } finally {
        process.env.GEMINI_API_KEY = prevKey;
      }
    });
  });

  describe("4. Faculty Assessment Creation & RBAC Guards", () => {
    it("should allow FACULTY to create a new assessment mapped to skills", async () => {
      const facultyCtx = await createTestContext("demo_FACULTY");
      const caller = appRouter.createCaller(facultyCtx);

      // Get a skill ID to map
      const db = await getDb();
      const [skill] = await db!.select().from(skills).limit(1);
      expect(skill).toBeDefined();

      const newAssessment = await caller.skillGap.createAssessment({
        name: testAssessmentName,
        skillIds: [skill.id],
        maxScore: 100,
        durationMinutes: 45,
      });

      expect(newAssessment).toBeDefined();
      expect(newAssessment.name).toBe(testAssessmentName);
      expect(newAssessment.durationMinutes).toBe(45);
      expect(newAssessment.status).toBe("PUBLISHED");

      // Verify stored in live database
      const [dbRecord] = await db!
        .select()
        .from(assessments)
        .where(eq(assessments.id, newAssessment.id))
        .limit(1);

      expect(dbRecord).toBeDefined();
      expect(dbRecord.name).toBe(testAssessmentName);
    });

    it("should FORBID a STUDENT from calling faculty createAssessment", async () => {
      const studentCtx = await createTestContext("demo_STUDENT");
      const caller = appRouter.createCaller(studentCtx);

      await expect(
        caller.skillGap.createAssessment({
          name: "Unauthorized Assessment",
          skillIds: ["10000000-0000-0000-0000-000000000001"],
        })
      ).rejects.toThrowError(/not authorized to execute this procedure/);
    });

    it("should reject unauthenticated request to getMyGaps with UNAUTHORIZED", async () => {
      const anonCtx = await createTestContext();
      const caller = appRouter.createCaller(anonCtx);

      await expect(caller.skillGap.getMyGaps()).rejects.toThrowError(
        /Session expired or missing authentication token/
      );
    });
  });
});
