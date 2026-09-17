import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { studentProfiles, users } from "../drizzle/schema";
import { getDb } from "../src/db";
import { appRouter } from "../src/routers";
import * as dashboardService from "../src/services/dashboardService";
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

describe("Phase 10: Multi-Role Operational Dashboards & Verifiable Portable Career Passport", () => {
  let studentCtx: Context;
  let hodCtx: Context;
  let unauthCtx: Context;

  beforeAll(async () => {
    studentCtx = await createTestContext("demo_STUDENT");
    hodCtx = await createTestContext("demo_HOD");
    unauthCtx = await createTestContext();
  });

  // =========================================================================
  // 1. PURE DETERMINISTIC READINESS SCORECARD FORMULA UNIT TESTS
  // =========================================================================
  describe("1. Pure Functional Deterministic Readiness Scorecard", () => {
    it("calculates exact readiness score for benchmark candidate: (84.2*0.3) + (80*0.3) + (100*0.2) + (90*0.2) = 87.26%", () => {
      // Benchmark input specified in Phase 10 Spec Section 7:
      // Academic: CGPA 8.42 -> 84.2%
      // Skills: 4 out of 5 core skills >= 70 -> 80%
      // Internship: Completeness 100%
      // Evidence: 9 out of 10 verified -> 90%
      const scorecard = dashboardService.calculateReadinessScore({
        cgpa: 8.42,
        coreSkills: [
          { name: "Python", score: 84 },
          { name: "DSA", score: 78 },
          { name: "DBMS", score: 72 },
          { name: "OOP", score: 81 },
          { name: "OS", score: 61 },
        ],
        internshipCompleteness: 100,
        totalEvidenceClaims: 10,
        verifiedEvidenceClaims: 9,
      });

      // Expected calculation:
      // Academic: 84.2 * 0.30 = 25.26
      // Skills: 80 * 0.30 = 24.00
      // Internship: 100 * 0.20 = 20.00
      // Evidence: 90 * 0.20 = 18.00
      // Total: 25.26 + 24.00 + 20.00 + 18.00 = 87.26%
      expect(scorecard.readinessScore).toBe(87.26);

      // Verify itemized components
      expect(scorecard.breakdown.academic.percentage).toBe(84.2);
      expect(scorecard.breakdown.academic.weightedContribution).toBe(25.26);
      expect(scorecard.breakdown.academic.weight).toBe(0.3);

      expect(scorecard.breakdown.skills.percentage).toBe(80);
      expect(scorecard.breakdown.skills.weightedContribution).toBe(24);
      expect(scorecard.breakdown.skills.weight).toBe(0.3);

      expect(scorecard.breakdown.internship.completeness).toBe(100);
      expect(scorecard.breakdown.internship.weightedContribution).toBe(20);
      expect(scorecard.breakdown.internship.weight).toBe(0.2);

      expect(scorecard.breakdown.evidence.percentage).toBe(90);
      expect(scorecard.breakdown.evidence.weightedContribution).toBe(18);
      expect(scorecard.breakdown.evidence.weight).toBe(0.2);

      // Verify explanation methodology string
      expect(scorecard.methodologyExplanation).toContain("deterministic weighted average");
      expect(scorecard.methodologyExplanation).toContain("It is not an AI-generated employability score");
    });

    it("evaluates boundary conditions (0% and 100%) cleanly", () => {
      // Complete zero score
      const zeroScore = dashboardService.calculateReadinessScore({
        cgpa: 0,
        coreSkills: [{ name: "DSA", score: 40 }],
        internshipCompleteness: 0,
        totalEvidenceClaims: 5,
        verifiedEvidenceClaims: 0,
      });
      expect(zeroScore.readinessScore).toBe(0);

      // Perfect 100% score
      const perfectScore = dashboardService.calculateReadinessScore({
        cgpa: 10,
        coreSkills: [
          { name: "DSA", score: 95 },
          { name: "Python", score: 92 },
        ],
        internshipCompleteness: 100,
        totalEvidenceClaims: 5,
        verifiedEvidenceClaims: 5,
      });
      expect(perfectScore.readinessScore).toBe(100);
    });
  });

  // =========================================================================
  // 2. LIVE STUDENT DASHBOARD AGGREGATION & READINESS SCORECARD
  // =========================================================================
  describe("2. Live Student Dashboard Aggregation", () => {
    it("aggregates student profile, metrics, and readiness scorecard from live PostgreSQL", async () => {
      const caller = appRouter.createCaller(studentCtx);

      const dashboard = await caller.dashboard.getStudentDashboard();

      expect(dashboard).toBeDefined();
      expect(dashboard.student).toBeDefined();
      expect(dashboard.student.name).toBe(studentCtx.user!.name);
      expect(dashboard.student.enrollmentNumber).toBe(studentCtx.user!.studentProfile!.enrollmentNumber);
      expect(dashboard.student.program).toContain("Computer Science");

      // Verify academic summary
      expect(dashboard.metrics.cgpa).toBeGreaterThanOrEqual(7.5);
      expect(dashboard.metrics.totalCredits).toBeGreaterThanOrEqual(100);

      // Verify deterministic readiness scorecard in payload
      expect(dashboard.readinessScorecard).toBeDefined();
      expect(typeof dashboard.readinessScorecard.readinessScore).toBe("number");
      expect(dashboard.readinessScorecard.readinessScore).toBeGreaterThan(0);
      expect(dashboard.readinessScorecard.readinessScore).toBeLessThanOrEqual(100);
      expect(dashboard.readinessScorecard.breakdown.academic.weight).toBe(0.3);
      expect(dashboard.readinessScorecard.breakdown.skills.weight).toBe(0.3);
      expect(dashboard.readinessScorecard.breakdown.internship.weight).toBe(0.2);
      expect(dashboard.readinessScorecard.breakdown.evidence.weight).toBe(0.2);

      // Verify active skill gap detection
      expect(dashboard.skillGap).toBeDefined();
      expect(dashboard.skillGap.skill).toBeDefined();
    });

    it("serves backward-compatible student.dashboard query with the same data", async () => {
      const caller = appRouter.createCaller(studentCtx);

      const legacyDashboard = await caller.student.dashboard();

      expect(legacyDashboard).toBeDefined();
      expect(legacyDashboard.student.name).toBe(studentCtx.user!.name);
      expect(legacyDashboard.readinessScorecard).toBeDefined();
    });
  });

  // =========================================================================
  // 3. TAMPER-EVIDENT PORTABLE CAREER PASSPORT DOSSIER
  // =========================================================================
  describe("3. Portable Career Passport Dossier & Integrity Seal", () => {
    it("generates a complete, verifiable Career Passport with SHA-256 integrity hash", async () => {
      const caller = appRouter.createCaller(studentCtx);

      const passport = await caller.dashboard.getCareerPassport();

      expect(passport).toBeDefined();
      expect(passport.passportId).toContain("PASS-NIT-CSE-");
      expect(passport.generatedAt).toBeDefined();

      // 1. Institutional Seal & Metadata
      expect(passport.institution.name).toContain("Northstar Institute of Technology");
      expect(passport.institution.department).toContain("Computer Science");
      expect(passport.institution.sealText).toContain("OFFICIAL INSTITUTIONAL SEAL");

      // 2. Academic Ledger
      expect(passport.academicLedger).toBeDefined();
      expect(passport.academicLedger.cumulativeCgpa).toBeGreaterThanOrEqual(7.5);
      expect(passport.academicLedger.semesters.length).toBeGreaterThanOrEqual(4);
      for (const sem of passport.academicLedger.semesters) {
        expect(sem.semester).toBeGreaterThanOrEqual(1);
        expect(sem.sgpa).toBeGreaterThan(0);
        expect(sem.creditsEarned).toBeGreaterThan(0);
      }

      // 3. Verified Skills Profile
      expect(passport.verifiedSkills.length).toBeGreaterThanOrEqual(4);
      for (const sk of passport.verifiedSkills) {
        expect(sk.skillName).toBeDefined();
        expect(sk.score).toBeGreaterThanOrEqual(0);
        expect(["EXPERT", "PROFICIENT", "DEVELOPING"]).toContain(sk.proficiency);
        expect(sk.verified).toBe(true);
      }

      // 4. Verified Internship Record with Faculty Sign-Off
      expect(passport.verifiedInternship).toBeDefined();
      expect(passport.verifiedInternship?.companyName).toBeDefined();
      expect(passport.verifiedInternship?.mentorSignOff).toBeDefined();
      expect(passport.verifiedInternship?.mentorSignOff.facultyName).toBe("Dr. Anand Verma");
      expect(passport.verifiedInternship?.mentorSignOff.signedAt).toBeDefined();

      // 5. Cryptographic Verification Stamp & SHA-256 Hash
      expect(passport.verificationStamp).toBeDefined();
      expect(passport.verificationStamp.sha256IntegrityHash).toMatch(/^[a-f0-9]{64}$/);
      expect(passport.verificationStamp.signatureAuthority).toContain("Dean of Academic Affairs");
      expect(passport.verificationStamp.verificationUrl).toContain(passport.passportId);
    });
  });

  // =========================================================================
  // 4. HOD DEPARTMENT ANALYTICS HUB
  // =========================================================================
  describe("4. HOD Department Macro Analytics Hub", () => {
    it("allows HOD to retrieve cohort skill heatmap, intervention velocity, and placement distribution", async () => {
      const caller = appRouter.createCaller(hodCtx);

      const analytics = await caller.dashboard.getHodAnalytics();

      expect(analytics).toBeDefined();

      // 1. Department Overview
      expect(analytics.department.name).toContain("Computer Science");
      expect(analytics.department.totalStudents).toBeGreaterThan(0);
      expect(analytics.department.facultyCount).toBeGreaterThan(0);
      expect(analytics.department.averageCgpa).toBeGreaterThan(0);

      // 2. Skill Heatmap Matrix
      expect(analytics.skillHeatmap).toBeDefined();
      expect(analytics.skillHeatmap.semesters).toEqual(["Sem 3", "Sem 4", "Sem 5", "Sem 6"]);
      expect(analytics.skillHeatmap.skills.length).toBeGreaterThanOrEqual(4);
      for (const sk of analytics.skillHeatmap.skills) {
        expect(sk.skillName).toBeDefined();
        expect(sk.semesterAverages.length).toBe(4);
        for (const avg of sk.semesterAverages) {
          expect(avg.averageScore).toBeGreaterThan(0);
          expect(["EXCELLENT", "MODERATE", "CRITICAL"]).toContain(avg.status);
        }
      }

      // 3. Intervention Velocity
      expect(analytics.interventionVelocity).toBeDefined();
      expect(analytics.interventionVelocity.flaggedGaps).toBeGreaterThan(0);
      expect(analytics.interventionVelocity.completedInterventions).toBeGreaterThan(0);
      expect(analytics.interventionVelocity.resolutionRate).toBeGreaterThan(0);
      expect(analytics.interventionVelocity.breakdown.length).toBeGreaterThan(0);

      // 4. Placement Readiness Distribution
      expect(analytics.placementReadinessDistribution).toBeDefined();
      expect(analytics.placementReadinessDistribution.totalEligible).toBeGreaterThan(0);
      expect(analytics.placementReadinessDistribution.tier1Eligible.count).toBeGreaterThan(0);
      expect(analytics.placementReadinessDistribution.tier2Eligible.count).toBeGreaterThan(0);
      expect(
        analytics.placementReadinessDistribution.tier1Eligible.percentage +
          analytics.placementReadinessDistribution.tier2Eligible.percentage +
          analytics.placementReadinessDistribution.remedialRequired.percentage
      ).toBeCloseTo(100, -1);
    });
  });

  // =========================================================================
  // 5. SECURITY & RBAC ENFORCEMENT
  // =========================================================================
  describe("5. Security & RBAC Access Controls", () => {
    it("forbids students from accessing HOD Department Analytics with 403 FORBIDDEN", async () => {
      const studentCaller = appRouter.createCaller(studentCtx);

      await expect(studentCaller.dashboard.getHodAnalytics()).rejects.toThrow(/not authorized/i);
    });

    it("forbids unauthenticated users from querying dashboard procedures", async () => {
      const unauthCaller = appRouter.createCaller(unauthCtx);

      await expect(unauthCaller.dashboard.getStudentDashboard()).rejects.toThrow();
      await expect(unauthCaller.dashboard.getCareerPassport()).rejects.toThrow();
      await expect(unauthCaller.dashboard.getHodAnalytics()).rejects.toThrow();
    });
  });
});
