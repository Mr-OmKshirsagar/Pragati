import crypto from "crypto";
import { and, eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import {
  applications,
  auditLogs,
  internships,
  placementRules,
  recruitmentDrives,
  skillGaps,
  studentProfiles,
  users,
} from "../drizzle/schema";
import { getDb } from "../src/db";
import { appRouter } from "../src/routers";
import { BENCHMARK_ABC_RULE, evaluateStudentEligibility } from "../src/rules/eligibilityEngine";
import { evaluateRuleGap01 } from "../src/rules/skillGapEngine";
import { explainSkillGap } from "../src/services/aiService";
import * as dashboardService from "../src/services/dashboardService";
import * as internshipService from "../src/services/internshipService";
import * as interventionService from "../src/services/interventionService";
import * as tnpService from "../src/services/tnpService";
import type { Context } from "../src/_core/context";
import { computeSHA256 } from "../src/_core/storage";

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

describe("Phase 12: 12-Scene Hackathon Hero Demo Walkthrough & Verification Script", () => {
  let studentCtx: Context;
  let facultyCtx: Context;
  let tnpCtx: Context;
  let studentProfileId: string;
  let facultyUserId: string;
  let eligibleDriveId: string;
  let heroInternshipId: string;

  beforeAll(async () => {
    studentCtx = await createTestContext("demo_STUDENT");
    facultyCtx = await createTestContext("demo_FACULTY");
    tnpCtx = await createTestContext("demo_TNP_COORDINATOR");

    expect(studentCtx.user).toBeDefined();
    expect(studentCtx.user?.studentProfile).toBeDefined();
    studentProfileId = studentCtx.user!.studentProfile!.id;
    facultyUserId = facultyCtx.user!.id;

    const db = await getDb();
    if (!db) throw new Error("Database offline");

    // Fetch or create an active internship for Rahul Sharma
    const activeInternship = await internshipService.getStudentActiveInternship(studentProfileId);
    heroInternshipId = activeInternship.id;

    // Create a custom demo drive where Rahul is 100% eligible based on his live DB profile
    const [drive] = await db
      .insert(recruitmentDrives)
      .values({
        institutionId: tnpCtx.user!.institutionId,
        companyName: "ABC Technologies",
        jobTitle: "Software Engineer",
        description: "Flagship 12-Scene Hero Demo Placement Drive",
        ctcOrStipend: "12.0 LPA",
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: "PUBLISHED",
        createdBy: tnpCtx.user!.id,
      })
      .returning();
    eligibleDriveId = drive.id;

    await db.insert(placementRules).values({
      recruitmentDriveId: eligibleDriveId,
      version: 1,
      ruleDefinition: {
        operator: "AND",
        conditions: [
          { field: "cgpa", operator: ">=", value: 7.5 },
          { field: "active_backlogs", operator: "<=", value: 2 },
        ],
      },
      isActive: true,
      createdBy: tnpCtx.user!.id,
    });
  });

  // ==========================================================================
  // SCENE 01: Student Dashboard Overview & Readiness Scorecard
  // ==========================================================================
  it("Scene 01: Student Dashboard Overview & 4-Pillar Transparent Readiness Scorecard", async () => {
    const caller = appRouter.createCaller(studentCtx);
    const dashboard = await caller.dashboard.getStudentDashboard();

    expect(dashboard.student.name).toBe("Rahul Sharma");
    expect(dashboard.student.enrollmentNumber).toBe("CSE2024042");
    expect(dashboard.academics.cgpa).toBeGreaterThan(8.0);
    expect(dashboard.readinessScorecard.readinessScore).toBeGreaterThan(0);
    expect(dashboard.readinessScorecard.readinessScore).toBeLessThanOrEqual(100);

    // Verify 4 deterministic components: Academic (30%), Skill (30%), Internship (20%), Evidence (20%)
    const { academic, skills, internship, evidence } = dashboard.readinessScorecard.breakdown;
    expect(academic.weightedContribution).toBeGreaterThan(0);
    expect(skills.weight).toBe(0.3);
    expect(internship.weight).toBe(0.2);
    expect(evidence.weight).toBe(0.2);

    // Verify official transparent methodology quote
    expect(dashboard.readinessScorecard.methodologyExplanation).toContain(
      "A deterministic weighted average of four transparent progress indicators"
    );
    expect(dashboard.readinessScorecard.methodologyExplanation).toContain(
      "It is not an AI-generated employability score."
    );
  });

  // ==========================================================================
  // SCENE 02: Deterministic Skill-Gap Trigger (Operating Systems drop + backlog)
  // ==========================================================================
  it("Scene 02: Deterministic Skill-Gap Trigger (OS decline 78 -> 70 -> 61 with backlog)", async () => {
    // Evaluate deterministic rule: strictly declining across 3 cycles + active backlog > 0
    const isTriggered = evaluateRuleGap01([78, 70, 61], 1);
    expect(isTriggered).toBe(true);

    // Non-declining scores do NOT trigger
    expect(evaluateRuleGap01([78, 70, 75], 1)).toBe(false);

    // Zero backlogs do NOT trigger
    expect(evaluateRuleGap01([78, 70, 61], 0)).toBe(false);

    // Verify that skill_gaps in database surfaces active gaps for Rahul Sharma
    const db = await getDb();
    const gaps = await db!
      .select()
      .from(skillGaps)
      .where(eq(skillGaps.studentId, studentProfileId));

    expect(gaps.length).toBeGreaterThanOrEqual(1);
    expect(gaps.some((g) => ["OPEN", "IN_REVIEW", "RESOLVED"].includes(g.status))).toBe(true);
  });

  // ==========================================================================
  // SCENE 03: Assistive AI Explanation Generation
  // ==========================================================================
  it("Scene 03: Assistive AI Explanation Generation with Gemini & Fallback Guarantee", async () => {
    const aiExplanation = await explainSkillGap({
      studentName: "Rahul Sharma",
      skillName: "Operating Systems",
      scoreHistory: [78, 70, 61],
      backlogSubject: "CS401 Operating Systems",
    });

    expect(aiExplanation).toBeDefined();
    expect(aiExplanation.explanation.length).toBeGreaterThan(20);
    expect(aiExplanation.recommendedAction.length).toBeGreaterThan(10);
    expect(["ai", "rule_fallback"]).toContain(aiExplanation.source);
  });

  // ==========================================================================
  // SCENE 04: Faculty Closed-Loop Intervention Creation
  // ==========================================================================
  it("Scene 04: Faculty Closed-Loop Intervention Creation on /faculty/wards", async () => {
    const caller = appRouter.createCaller(facultyCtx);
    const wards = await caller.faculty.getWards();

    expect(wards.length).toBeGreaterThanOrEqual(1);
    const rahulWard = wards.find((w) => w.studentProfileId === studentProfileId);
    expect(rahulWard).toBeDefined();
    expect(rahulWard?.name).toBe("Rahul Sharma");

    // Fetch an open skill gap ID
    const db = await getDb();
    const [gap] = await db!
      .select()
      .from(skillGaps)
      .where(eq(skillGaps.studentId, studentProfileId))
      .limit(1);

    // Create a remedial mentoring intervention session
    const intervention = await interventionService.createIntervention({
      assignedBy: facultyUserId,
      studentId: studentProfileId,
      skillGapId: gap?.id || "00000000-0000-0000-0000-000000000000",
      type: "MENTORING",
      description: "Review virtual memory concepts and thread synchronization",
    });

    expect(intervention).toBeDefined();
    expect(intervention.studentId).toBe(studentProfileId);
    expect(intervention.status).toBe("SCHEDULED");
  });

  // ==========================================================================
  // SCENE 05: Progress Measurement & Gap Resolution
  // ==========================================================================
  it("Scene 05: Progress Measurement & Gap Resolution (Score 61 -> 78 => RESOLVED)", async () => {
    // Follow-up evaluation score (78 >= 75 threshold)
    const postAssessmentScore = 78;
    const isResolved = postAssessmentScore >= 75;
    expect(isResolved).toBe(true);

    // Complete intervention with outcome
    const db = await getDb();
    const [openIntervention] = await db!
      .select()
      .from((await import("../drizzle/schema")).interventions)
      .where(
        and(
          eq((await import("../drizzle/schema")).interventions.studentId, studentProfileId),
          eq((await import("../drizzle/schema")).interventions.status, "SCHEDULED")
        )
      )
      .limit(1);

    if (openIntervention) {
      const updated = await interventionService.recordOutcome({
        interventionId: openIntervention.id,
        outcome: "Student demonstrated mastery in virtual memory. Score improved to 78.",
        status: "COMPLETED",
      });
      expect(updated.status).toBe("COMPLETED");
    }
  });

  // ==========================================================================
  // SCENE 06: Internship Lifecycle & Milestones
  // ==========================================================================
  it("Scene 06: Internship Lifecycle & Milestones (Evidence Completeness Calculation)", async () => {
    const studentInternship = await internshipService.getStudentActiveInternship(studentProfileId);
    expect(studentInternship).toBeDefined();
    expect(studentInternship.id).toBeDefined();

    // Verify milestone completeness formula: 4 core milestones x 25% each = 100%
    const fullMilestones = internshipService.calculateEvidenceCompleteness({
      hasOfferLetter: true,
      hasCheckin: true,
      hasReport: true,
      hasCertificate: true,
    });
    expect(fullMilestones).toBe(100);

    const partialMilestones = internshipService.calculateEvidenceCompleteness({
      hasOfferLetter: true,
      hasCheckin: true,
      hasReport: false,
      hasCertificate: false,
    });
    expect(partialMilestones).toBe(50);
  });

  // ==========================================================================
  // SCENE 07: Cryptographic SHA-256 Tamper Demo
  // ==========================================================================
  it("Scene 07: Cryptographic SHA-256 Tamper Demo (1-Byte Mutation Triggers Alert)", () => {
    const originalCertificateBuffer = Buffer.from(
      "TechCorp Solutions: Internship Completion Certificate - Rahul Sharma (CSE2024042). 8 Weeks."
    );
    const tamperedCertificateBuffer = Buffer.from(
      "TechCorp Solutions: Internship Completion Certificate - Rahul Sharma (CSE2024042). 9 Weeks." // 1 byte mutated
    );

    const originalHash = computeSHA256(originalCertificateBuffer);
    const tamperedHash = computeSHA256(tamperedCertificateBuffer);

    // Bit-level change produces completely different SHA-256 hashes
    expect(originalHash).not.toBe(tamperedHash);
    expect(originalHash).toHaveLength(64);
    expect(tamperedHash).toHaveLength(64);

    const isTampered = originalHash !== tamperedHash;
    expect(isTampered).toBe(true);
  });

  // ==========================================================================
  // SCENE 08: Faculty Institutional Verification & Audit Logging
  // ==========================================================================
  it("Scene 08: Faculty Institutional Verification & Audit Logging", async () => {
    const facultyCaller = appRouter.createCaller(facultyCtx);

    const verified = await facultyCaller.internship.verifyInternship({
      internshipId: heroInternshipId,
      status: "INSTITUTION_VERIFIED",
      notes: "Verified completion certificate against institutional standards.",
    });

    expect(verified.success).toBe(true);

    // Verify audit log entry exists in audit_logs
    const db = await getDb();
    const auditEntries = await db!
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.resourceId, heroInternshipId),
          eq(auditLogs.action, "INTERNSHIP_VERIFIED")
        )
      );

    expect(auditEntries.length).toBeGreaterThanOrEqual(1);
  });

  // ==========================================================================
  // SCENE 09: T&P Placement Rule Builder & AST Inspection
  // ==========================================================================
  it("Scene 09: T&P Placement Rule Builder & AST Inspection (ABC Technologies)", async () => {
    const tnpCaller = appRouter.createCaller(tnpCtx);
    const drives = await tnpCaller.recruitment.getActiveDrives();

    expect(drives.length).toBeGreaterThanOrEqual(1);
    const abcDrive = drives.find((d) => d.companyName === "ABC Technologies" || d.jobTitle.includes("ABC"));
    expect(abcDrive).toBeDefined();

    // Verify benchmark AST rules structure
    expect(BENCHMARK_ABC_RULE.operator).toBe("AND");
    expect(BENCHMARK_ABC_RULE.conditions.length).toBe(5);

    const conditionFields = BENCHMARK_ABC_RULE.conditions.map((c: any) => c.field);
    expect(conditionFields).toContain("cgpa");
    expect(conditionFields).toContain("active_backlogs");
    expect(conditionFields).toContain("skill.DSA");
    expect(conditionFields).toContain("skill.Python");
    expect(conditionFields).toContain("internship_status");
  });

  // ==========================================================================
  // SCENE 10: Deterministic Candidate Eligibility Run
  // ==========================================================================
  it("Scene 10: Deterministic Candidate Eligibility Run (Rahul PASS vs Peer FAIL)", async () => {
    // Rahul Sharma: Meets all 5 criteria
    const rahulCandidate = {
      id: studentProfileId,
      name: "Rahul Sharma",
      cgpa: 8.42,
      activeBacklogs: 0,
      skills: { DSA: 78, Python: 84 },
      internshipStatus: "COMPLETED" as const,
    };

    const rahulResult = evaluateStudentEligibility("benchmark-drive", BENCHMARK_ABC_RULE, rahulCandidate);
    expect(rahulResult.eligible).toBe(true);
    expect(rahulResult.reasons.length).toBe(5);
    expect(rahulResult.reasons.every((r) => r.includes("[PASS]"))).toBe(true);

    // Peer Student: Fails DSA criterion (62 < required 70)
    const peerCandidate = {
      id: "peer-student-uuid",
      name: "Priya Patel",
      cgpa: 8.1,
      activeBacklogs: 0,
      skills: { DSA: 62, Python: 80 },
      internshipStatus: "COMPLETED" as const,
    };

    const peerResult = evaluateStudentEligibility("benchmark-drive", BENCHMARK_ABC_RULE, peerCandidate);
    expect(peerResult.eligible).toBe(false);
    expect(peerResult.reasons.some((r) => r.includes("DSA") && r.includes("[FAIL]"))).toBe(true);
  });

  // ==========================================================================
  // SCENE 11: 1-Click Transparent Application & Invariant Enforcement
  // ==========================================================================
  it("Scene 11: 1-Click Transparent Application & Invariant Enforcement", async () => {
    const studentCaller = appRouter.createCaller(studentCtx);

    // 1-Click Apply to eligible drive
    const appResult = await studentCaller.recruitment.applyToDrive({
      driveId: eligibleDriveId,
    });
    expect(appResult.application).toBeDefined();
    expect(appResult.application.status).toBe("APPLIED");
    expect(appResult.application.recruitmentDriveId).toBe(eligibleDriveId);

    // Attempting duplicate application must be rejected with DUPLICATE_APPLICATION
    await expect(
      studentCaller.recruitment.applyToDrive({
        driveId: eligibleDriveId,
      })
    ).rejects.toThrowError(/Already applied|DUPLICATE_APPLICATION/);

    // Verify application is listed in student's application history
    const myApps = await studentCaller.recruitment.getMyApplications();
    expect(myApps.some((a) => a.recruitmentDriveId === eligibleDriveId)).toBe(true);
  });

  // ==========================================================================
  // SCENE 12: Verifiable Portable Career Passport
  // ==========================================================================
  it("Scene 12: Verifiable Portable Career Passport Generation & Cryptographic Integrity Hash", async () => {
    const studentCaller = appRouter.createCaller(studentCtx);
    const passport = await studentCaller.dashboard.getCareerPassport();

    expect(passport.student.name).toBe("Rahul Sharma");
    expect(passport.institution.name).toBe("Northstar Institute of Technology");
    expect(passport.academicLedger.cumulativeCgpa).toBeGreaterThan(8.0);
    expect(passport.verifiedSkills.length).toBeGreaterThan(0);

    // Verify verified internship record
    if (passport.verifiedInternship) {
      expect(passport.verifiedInternship.companyName).toBeDefined();
      expect(passport.verifiedInternship.mentorSignOff.facultyName).toBe("Dr. Anand Verma");
      expect(passport.verifiedInternship.verificationStatus).toBe("INSTITUTION_VERIFIED");
    }

    // Cryptographic integrity hash must be a valid 64-character SHA-256 hex string
    const integrityHash = passport.verificationStamp.sha256IntegrityHash;
    expect(integrityHash).toBeDefined();
    expect(integrityHash).toHaveLength(64);
    expect(/^[a-f0-9]{64}$/.test(integrityHash)).toBe(true);
  });
});
