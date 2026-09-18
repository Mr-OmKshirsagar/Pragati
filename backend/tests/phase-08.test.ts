import crypto from "crypto";
import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  eligibilityEvaluations,
  placementRules,
  recruitmentDrives,
  studentProfiles,
  users,
} from "../drizzle/schema";
import { getDb } from "../src/db";
import {
  BENCHMARK_ABC_RULE,
  evaluateCondition,
  evaluateStudentEligibility,
  type RuleAST,
  type StudentCandidateSnapshot,
} from "../src/rules/eligibilityEngine";
import { appRouter } from "../src/routers";
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

describe("Phase 08: AST Placement Rule Builder & Transparent Deterministic Eligibility Engine", () => {
  let studentCtx: Context;
  let tnpCtx: Context;
  let unauthCtx: Context;
  let benchmarkDriveId: string;
  let customDriveId: string | undefined;

  beforeAll(async () => {
    studentCtx = await createTestContext("demo_STUDENT");
    tnpCtx = await createTestContext("demo_TNP_COORDINATOR");
    unauthCtx = await createTestContext();

    // Ensure benchmark drive exists
    const drive = await tnpService.getOrCreateBenchmarkDrive(
      studentCtx.user?.institutionId,
      tnpCtx.user?.id
    );
    benchmarkDriveId = drive.id;
  });

  afterAll(async () => {
    const db = await getDb();
    if (db && customDriveId) {
      await db
        .delete(eligibilityEvaluations)
        .where(eq(eligibilityEvaluations.recruitmentDriveId, customDriveId));
      await db
        .delete(placementRules)
        .where(eq(placementRules.recruitmentDriveId, customDriveId));
      await db
        .delete(recruitmentDrives)
        .where(eq(recruitmentDrives.id, customDriveId));
    }
  });

  // =========================================================================
  // 1. PURE FUNCTIONAL AST EVALUATION UNIT TESTS
  // =========================================================================
  describe("1. Pure AST Rule Engine - Condition & Operator Evaluations", () => {
    it("evaluates numeric comparison operators (>=, <=, >, <, =, !=)", () => {
      expect(evaluateCondition(8.42, ">=", 7.5)).toBe(true);
      expect(evaluateCondition(7.2, ">=", 7.5)).toBe(false);
      expect(evaluateCondition(7.5, ">=", 7.5)).toBe(true);

      expect(evaluateCondition(0, "=", 0)).toBe(true);
      expect(evaluateCondition(1, "=", 0)).toBe(false);

      expect(evaluateCondition(0, "<=", 0)).toBe(true);
      expect(evaluateCondition(2, "<=", 1)).toBe(false);

      expect(evaluateCondition(85, ">", 70)).toBe(true);
      expect(evaluateCondition(70, ">", 70)).toBe(false);

      expect(evaluateCondition(65, "<", 70)).toBe(true);
      expect(evaluateCondition(75, "<", 70)).toBe(false);

      expect(evaluateCondition(1, "!=", 0)).toBe(true);
      expect(evaluateCondition(0, "!=", 0)).toBe(false);
    });

    it("evaluates string comparison operators (=, !=)", () => {
      expect(evaluateCondition("COMPLETED", "=", "COMPLETED")).toBe(true);
      expect(evaluateCondition("IN_PROGRESS", "=", "COMPLETED")).toBe(false);
      expect(evaluateCondition("IN_PROGRESS", "!=", "COMPLETED")).toBe(true);
      expect(evaluateCondition("COMPLETED", "!=", "COMPLETED")).toBe(false);
    });

    it("evaluates AND trees strictly requiring all conditions to pass", () => {
      const snapshot: StudentCandidateSnapshot = {
        id: "student-test-1",
        name: "Test Student",
        cgpa: 8.0,
        activeBacklogs: 0,
        skills: { DSA: 75, Python: 70 },
        internshipStatus: "COMPLETED",
      };

      const result = evaluateStudentEligibility(BENCHMARK_ABC_RULE, snapshot);
      expect(result.eligible).toBe(true);
      expect(result.criteriaResults).toHaveLength(5);
      expect(result.criteriaResults.every((c) => c.pass)).toBe(true);
      expect(result.reasons).toHaveLength(5);
      expect(result.reasons[0]).toContain("[PASS] CGPA: Actual 8 >=");
    });

    it("explains failed criteria transparently with Actual vs Required values", () => {
      const deficientCandidate: StudentCandidateSnapshot = {
        id: "student-test-2",
        name: "Deficient Candidate",
        cgpa: 7.1, // Required >= 7.5 -> FAIL
        activeBacklogs: 1, // Required = 0 -> FAIL
        skills: { DSA: 62, Python: 80 }, // DSA Required >= 70 -> FAIL
        internshipStatus: "IN_PROGRESS", // Required = COMPLETED -> FAIL
      };

      const result = evaluateStudentEligibility(BENCHMARK_ABC_RULE, deficientCandidate);
      expect(result.eligible).toBe(false);

      const failedCriteria = result.criteriaResults.filter((c) => !c.pass);
      expect(failedCriteria.length).toBe(4);

      // Verify human-readable transparent explanation strings
      expect(result.reasons).toEqual(
        expect.arrayContaining([
          expect.stringContaining("[FAIL] CGPA: Actual 7.1 >= Required 7.5"),
          expect.stringContaining("[FAIL] Active backlogs: Actual 1 = Required 0"),
          expect.stringContaining("[FAIL] DSA: Actual 62 >= Required 70"),
          expect.stringContaining("[FAIL] Internship status: Actual IN_PROGRESS = Required COMPLETED"),
        ])
      );
      // Python passed
      expect(result.reasons).toEqual(
        expect.arrayContaining([
          expect.stringContaining("[PASS] Python: Actual 80 >= Required 65"),
        ])
      );
    });

    it("evaluates OR trees and nested sub-trees accurately", () => {
      const nestedRule: RuleAST = {
        operator: "AND",
        conditions: [
          { field: "cgpa", operator: ">=", value: 7.0 },
          {
            operator: "OR",
            conditions: [
              { field: "skill.Python", operator: ">=", value: 80 },
              { field: "skill.Java", operator: ">=", value: 80 },
            ],
          },
        ],
      };

      // Candidate has Python 85, no Java -> passes OR branch
      const candidatePass: StudentCandidateSnapshot = {
        id: "student-or-pass",
        name: "OR Passing Candidate",
        cgpa: 7.8,
        activeBacklogs: 0,
        skills: { Python: 85 },
        internshipStatus: "COMPLETED",
      };

      const passResult = evaluateStudentEligibility(nestedRule, candidatePass);
      expect(passResult.eligible).toBe(true);

      // Candidate has Python 60, no Java -> fails OR branch
      const candidateFail: StudentCandidateSnapshot = {
        id: "student-or-fail",
        name: "OR Failing Candidate",
        cgpa: 7.8,
        activeBacklogs: 0,
        skills: { Python: 60 },
        internshipStatus: "COMPLETED",
      };

      const failResult = evaluateStudentEligibility(nestedRule, candidateFail);
      expect(failResult.eligible).toBe(false);
    });

    it("gracefully handles missing skills in candidate snapshot by defaulting to 0", () => {
      const candidateNoSkills: StudentCandidateSnapshot = {
        id: "student-no-skills",
        name: "No Skills",
        cgpa: 9.0,
        activeBacklogs: 0,
        skills: {},
        internshipStatus: "COMPLETED",
      };

      const result = evaluateStudentEligibility(BENCHMARK_ABC_RULE, candidateNoSkills);
      expect(result.eligible).toBe(false);
      expect(result.reasons).toEqual(
        expect.arrayContaining([
          expect.stringContaining("[FAIL] DSA: Actual 0 >= Required 70"),
          expect.stringContaining("[FAIL] Python: Actual 0 >= Required 65"),
        ])
      );
    });
  });

  // =========================================================================
  // 2. ZERO-MOCK DATABASE SNAPSHOT EXTRACTION
  // =========================================================================
  describe("2. Live Database Candidate Snapshot Extraction", () => {
    it("extracts a complete, typed snapshot for the logged-in student from Postgres", async () => {
      expect(studentCtx.user?.studentProfile?.id).toBeDefined();
      const studentProfileId = studentCtx.user!.studentProfile!.id;

      const snapshot = await tnpService.getStudentCandidateSnapshot(studentProfileId);

      expect(snapshot).toBeDefined();
      expect(snapshot.id).toBe(studentProfileId);
      expect(snapshot.name).toBe(studentCtx.user!.name);
      expect(typeof snapshot.cgpa).toBe("number");
      expect(snapshot.cgpa).toBeGreaterThanOrEqual(0);
      expect(typeof snapshot.activeBacklogs).toBe("number");
      expect(snapshot.activeBacklogs).toBeGreaterThanOrEqual(0);
      expect(typeof snapshot.skills).toBe("object");
      expect(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]).toContain(
        snapshot.internshipStatus
      );
    });
  });

  // =========================================================================
  // 3. BENCHMARK DRIVE MANAGEMENT & RETRIEVAL
  // =========================================================================
  describe("3. Recruitment Drive & Benchmark Rule Management", () => {
    it("lazily initializes and retrieves the ABC Technologies benchmark drive", async () => {
      const caller = appRouter.createCaller(studentCtx);
      const benchmarkData = await caller.placement.getBenchmarkDrive();

      expect(benchmarkData).toBeDefined();
      expect(benchmarkData.drive).toBeDefined();
      expect(benchmarkData.drive.companyName).toBe("ABC Technologies");
      expect(benchmarkData.drive.jobTitle).toBe("Associate Software Engineer");
      expect(["12 LPA", "14.5 LPA"]).toContain(benchmarkData.drive.ctcOrStipend);
      expect(benchmarkData.rule).toBeDefined();
      expect(benchmarkData.rule.operator).toBe("AND");
      expect(benchmarkData.rule.conditions.length).toBeGreaterThanOrEqual(4);
    });

    it("lists all recruitment drives with active rules for authorized users", async () => {
      const caller = appRouter.createCaller(studentCtx);
      const drives = await caller.placement.getDrives();

      expect(Array.isArray(drives)).toBe(true);
      expect(drives.length).toBeGreaterThanOrEqual(1);

      const abcDrive = drives.find((d) => d.id === benchmarkDriveId);
      expect(abcDrive).toBeDefined();
      expect(abcDrive?.companyName).toBe("ABC Technologies");
      expect(abcDrive?.rule).toBeDefined();
    });

    it("fetches drive and its rule by ID", async () => {
      const caller = appRouter.createCaller(studentCtx);
      const driveWithRule = await caller.placement.getDriveById({
        driveId: benchmarkDriveId,
      });

      expect(driveWithRule.drive.id).toBe(benchmarkDriveId);
      expect(driveWithRule.drive.companyName).toBe("ABC Technologies");
      expect(driveWithRule.rule.operator).toBe("AND");
    });
  });

  // =========================================================================
  // 4. STUDENT ELIGIBILITY EVALUATION & AUDIT PERSISTENCE
  // =========================================================================
  describe("4. Student Eligibility Evaluation & Idempotent Audit Logging", () => {
    it("allows a student to check their own eligibility with itemized pass/fail results", async () => {
      const caller = appRouter.createCaller(studentCtx);
      const result = await caller.placement.checkMyEligibility({
        driveId: benchmarkDriveId,
      });

      expect(result).toBeDefined();
      expect(typeof result.eligible).toBe("boolean");
      expect(Array.isArray(result.reasons)).toBe(true);
      expect(Array.isArray(result.criteriaResults)).toBe(true);
      expect(result.criteriaResults.length).toBeGreaterThanOrEqual(4);
      expect(result.snapshot).toBeDefined();
      expect(result.snapshot.id).toBe(studentCtx.user!.studentProfile!.id);

      // Verify that every criterion result has label, actual, expected, pass
      for (const cr of result.criteriaResults) {
        expect(cr.label).toBeDefined();
        expect(cr.actual).toBeDefined();
        expect(cr.expected).toBeDefined();
        expect(typeof cr.pass).toBe("boolean");
      }
    });

    it("idempotently logs evaluation results in eligibility_evaluations", async () => {
      const db = await getDb();
      expect(db).toBeDefined();
      if (!db) return;

      const studentProfileId = studentCtx.user!.studentProfile!.id;

      // 1st call
      const caller = appRouter.createCaller(studentCtx);
      const firstResult = await caller.placement.checkMyEligibility({
        driveId: benchmarkDriveId,
      });

      // Query DB directly
      const [evalRecord1] = await db
        .select()
        .from(eligibilityEvaluations)
        .where(
          and(
            eq(eligibilityEvaluations.studentId, studentProfileId),
            eq(eligibilityEvaluations.recruitmentDriveId, benchmarkDriveId)
          )
        );

      expect(evalRecord1).toBeDefined();
      expect(evalRecord1.eligible).toBe(firstResult.eligible);

      // 2nd call (idempotent upsert verification)
      const secondResult = await caller.placement.checkMyEligibility({
        driveId: benchmarkDriveId,
      });
      expect(secondResult.eligible).toBe(firstResult.eligible);

      const records = await db
        .select()
        .from(eligibilityEvaluations)
        .where(
          and(
            eq(eligibilityEvaluations.studentId, studentProfileId),
            eq(eligibilityEvaluations.recruitmentDriveId, benchmarkDriveId)
          )
        );

      // Unique constraint on (student_id, recruitment_drive_id) guarantees exactly 1 row
      expect(records).toHaveLength(1);
    });
  });

  // =========================================================================
  // 5. T&P CANDIDATE ROSTER BULK EVALUATION
  // =========================================================================
  describe("5. T&P Coordinator Candidate Roster Bulk Evaluation", () => {
    it("allows TNP_COORDINATOR to evaluate all registered candidates for a drive", async () => {
      const caller = appRouter.createCaller(tnpCtx);
      const roster = await caller.placement.evaluateRoster({
        driveId: benchmarkDriveId,
      });

      expect(roster).toBeDefined();
      expect(roster.driveId).toBe(benchmarkDriveId);
      expect(roster.companyName).toBe("ABC Technologies");
      expect(roster.totalEvaluated).toBeGreaterThanOrEqual(1);
      expect(roster.eligibleCount + roster.ineligibleCount).toBe(roster.totalEvaluated);
      expect(Array.isArray(roster.results)).toBe(true);
      expect(roster.results.length).toBe(roster.totalEvaluated);

      const rahulResult = roster.results.find(
        (r: any) => r.studentId === studentCtx.user!.studentProfile!.id
      );
      expect(rahulResult).toBeDefined();
      expect(rahulResult?.studentName).toBe(studentCtx.user!.name);
      expect(rahulResult?.snapshot.cgpa).toBeDefined();
    });

    it("allows TNP_COORDINATOR to customize placement rules for a drive", async () => {
      const db = await getDb();
      if (!db) return;

      // Create a dedicated recruitment drive for testing custom rules
      const [newDrive] = await db
        .insert(recruitmentDrives)
        .values({
          institutionId: tnpCtx.user!.institutionId,
          companyName: "Zenith Software Corp",
          jobTitle: "Junior SRE",
          description: "Junior SRE and Cloud infrastructure specialist",
          ctcOrStipend: "11.0 LPA",
          applicationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          status: "PUBLISHED",
          createdBy: tnpCtx.user!.id,
        })
        .returning();
      customDriveId = newDrive.id;

      const customRule: RuleAST = {
        operator: "AND",
        conditions: [
          { field: "cgpa", operator: ">=", value: 8.0 },
          { field: "active_backlogs", operator: "<=", value: 0 },
        ],
      };

      const caller = appRouter.createCaller(tnpCtx);
      const saved = await caller.placement.saveRule({
        driveId: customDriveId,
        rule: customRule as any,
      });

      expect(saved).toBeDefined();
      expect(saved.recruitmentDriveId).toBe(customDriveId);
      expect(saved.isActive).toBe(true);

      // Verify reading back the saved rule
      const driveWithRule = await caller.placement.getDriveById({
        driveId: customDriveId,
      });
      expect(driveWithRule.rule.conditions).toHaveLength(2);
    });
  });

  // =========================================================================
  // 6. SECURITY, RBAC & AUTHORIZATION GUARDS
  // =========================================================================
  describe("6. Security & RBAC Enforcement", () => {
    it("forbids students from evaluating candidate rosters", async () => {
      const studentCaller = appRouter.createCaller(studentCtx);
      await expect(
        studentCaller.placement.evaluateRoster({ driveId: benchmarkDriveId })
      ).rejects.toThrow();
    });

    it("forbids students from saving or modifying placement rules", async () => {
      const studentCaller = appRouter.createCaller(studentCtx);
      await expect(
        studentCaller.placement.saveRule({
          driveId: benchmarkDriveId,
          rule: BENCHMARK_ABC_RULE as any,
        })
      ).rejects.toThrow();
    });

    it("forbids unauthenticated users from checking eligibility or evaluating rosters", async () => {
      const unauthCaller = appRouter.createCaller(unauthCtx);
      await expect(
        unauthCaller.placement.checkMyEligibility({ driveId: benchmarkDriveId })
      ).rejects.toThrow();

      await expect(
        unauthCaller.placement.evaluateRoster({ driveId: benchmarkDriveId })
      ).rejects.toThrow();

      await expect(unauthCaller.placement.getDrives()).rejects.toThrow();
    });
  });
});
