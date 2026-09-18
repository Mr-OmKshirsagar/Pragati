import { and, desc, eq, inArray } from "drizzle-orm";
import {
  academicRecords,
  backlogs,
  departments,
  eligibilityEvaluations,
  institutions,
  internships,
  placementRules,
  recruitmentDrives,
  skillHistory,
  skills,
  studentProfiles,
  users,
} from "../../drizzle/schema";
import { getDb } from "../db";
import {
  BENCHMARK_ABC_RULE,
  evaluateStudentEligibility,
  type EligibilityResult,
  type RuleAST,
  type StudentCandidateSnapshot,
} from "../rules/eligibilityEngine";

/**
 * Extracts a live candidate snapshot from Supabase PostgreSQL tables:
 * - academic_records: latest cumulative GPA
 * - backlogs: active backlogs count
 * - skill_history: latest score for each skill
 * - internships: latest status ('COMPLETED', 'IN_PROGRESS', 'NOT_STARTED')
 */
export async function getStudentCandidateSnapshot(
  studentProfileId: string
): Promise<StudentCandidateSnapshot> {
  const db = await getDb();
  if (!db) throw new Error("Database offline");

  // 1. Fetch student and user profile
  const [student] = await db
    .select({
      id: studentProfiles.id,
      name: users.name,
      enrollmentNumber: studentProfiles.enrollmentNumber,
    })
    .from(studentProfiles)
    .innerJoin(users, eq(studentProfiles.userId, users.id))
    .where(eq(studentProfiles.id, studentProfileId))
    .limit(1);

  if (!student) {
    throw new Error(`Student profile '${studentProfileId}' not found.`);
  }

  // 2. Fetch latest academic record (CGPA)
  const [latestAcademic] = await db
    .select()
    .from(academicRecords)
    .where(eq(academicRecords.studentId, studentProfileId))
    .orderBy(desc(academicRecords.semester))
    .limit(1);

  const cgpa = latestAcademic ? Number(latestAcademic.cgpa) : 0;

  // 3. Fetch active backlogs count
  const activeBacklogRows = await db
    .select()
    .from(backlogs)
    .where(
      and(
        eq(backlogs.studentId, studentProfileId),
        eq(backlogs.status, "ACTIVE")
      )
    );

  const activeBacklogs = activeBacklogRows.length;

  // 4. Fetch latest skill assessment scores
  const historyRows = await db
    .select({
      skillName: skills.name,
      score: skillHistory.score,
      assessmentDate: skillHistory.assessmentDate,
    })
    .from(skillHistory)
    .innerJoin(skills, eq(skillHistory.skillId, skills.id))
    .where(eq(skillHistory.studentId, studentProfileId))
    .orderBy(desc(skillHistory.assessmentDate));

  const skillsMap: Record<string, number> = {};
  for (const row of historyRows) {
    if (skillsMap[row.skillName] === undefined) {
      skillsMap[row.skillName] = Number(row.score);
    }
  }

  // 5. Fetch latest internship status
  const [latestInternship] = await db
    .select()
    .from(internships)
    .where(eq(internships.studentId, studentProfileId))
    .orderBy(desc(internships.createdAt))
    .limit(1);

  let internshipStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" = "NOT_STARTED";
  if (latestInternship) {
    if (latestInternship.status === "COMPLETED" || latestInternship.verificationStatus === "INSTITUTION_VERIFIED") {
      internshipStatus = "COMPLETED";
    } else if (latestInternship.status === "IN_PROGRESS") {
      internshipStatus = "IN_PROGRESS";
    }
  }

  return {
    id: student.id,
    name: student.name,
    cgpa,
    activeBacklogs,
    skills: skillsMap,
    internshipStatus,
  };
}

/**
 * Retrieves or lazily initializes the standard benchmark ABC Technologies drive
 */
export async function getOrCreateBenchmarkDrive(
  institutionId?: string,
  createdByUserId?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database offline");

  // Check if benchmark drive exists
  const [existing] = await db
    .select()
    .from(recruitmentDrives)
    .where(eq(recruitmentDrives.companyName, "ABC Technologies"))
    .limit(1);

  if (existing) {
    // Check if active rule exists for this drive
    const [existingRule] = await db
      .select()
      .from(placementRules)
      .where(
        and(
          eq(placementRules.recruitmentDriveId, existing.id),
          eq(placementRules.isActive, true)
        )
      )
      .limit(1);

    if (!existingRule) {
      const [anyUser] = await db.select().from(users).limit(1);
      await db.insert(placementRules).values({
        recruitmentDriveId: existing.id,
        version: 1,
        ruleDefinition: BENCHMARK_ABC_RULE,
        isActive: true,
        createdBy: createdByUserId || existing.createdBy || anyUser.id,
      });
    }
    return existing;
  }

  // Look up default institution & admin user if not provided
  let instId = institutionId;
  let userId = createdByUserId;

  if (!instId || !userId) {
    const [foundUser] = await db
      .select()
      .from(users)
      .where(eq(users.role, "ADMIN"))
      .limit(1);

    if (foundUser) {
      instId = instId || foundUser.institutionId;
      userId = userId || foundUser.id;
    } else {
      const [anyInst] = await db.select().from(institutions).limit(1);
      const [anyUser] = await db.select().from(users).limit(1);
      instId = instId || anyInst.id;
      userId = userId || anyUser.id;
    }
  }

  // Create standard benchmark drive
  const [drive] = await db
    .insert(recruitmentDrives)
    .values({
      institutionId: instId!,
      companyName: "ABC Technologies",
      jobTitle: "Associate Software Engineer",
      description:
        "Flagship campus recruitment drive for ABC Technologies. Candidates must meet verified standards in cumulative CGPA, clean backlog record, core algorithmic proficiency (DSA and Python), and completed internship training.",
      ctcOrStipend: "14.5 LPA",
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "PUBLISHED",
      createdBy: userId!,
    })
    .returning();

  // Attach benchmark rule AST
  await db.insert(placementRules).values({
    recruitmentDriveId: drive.id,
    version: 1,
    ruleDefinition: BENCHMARK_ABC_RULE,
    isActive: true,
    createdBy: userId!,
  });

  return drive;
}

/**
 * Retrieves a recruitment drive along with its active placement rule AST
 */
export async function getDriveWithRule(driveId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database offline");

  const [drive] = await db
    .select()
    .from(recruitmentDrives)
    .where(eq(recruitmentDrives.id, driveId))
    .limit(1);

  if (!drive) {
    throw new Error(`Recruitment drive '${driveId}' not found.`);
  }

  const [activeRule] = await db
    .select()
    .from(placementRules)
    .where(
      and(
        eq(placementRules.recruitmentDriveId, driveId),
        eq(placementRules.isActive, true)
      )
    )
    .orderBy(desc(placementRules.version))
    .limit(1);

  let rawRule: any = activeRule?.ruleDefinition || BENCHMARK_ABC_RULE;
  const operator = (rawRule.operator || rawRule.type || "AND").toUpperCase() as "AND" | "OR";
  const ruleAst: RuleAST = {
    operator,
    conditions: Array.isArray(rawRule.conditions) ? rawRule.conditions : BENCHMARK_ABC_RULE.conditions,
  };

  return {
    drive,
    rule: ruleAst,
    ruleRecord: activeRule,
  };
}

/**
 * Evaluates student eligibility for a recruitment drive, persists the result in
 * eligibility_evaluations, and returns full transparency criteria.
 */
export async function checkStudentEligibility(
  studentProfileId: string,
  driveId: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database offline");

  // 1. Fetch student snapshot & drive with rule
  const snapshot = await getStudentCandidateSnapshot(studentProfileId);
  const { drive, rule } = await getDriveWithRule(driveId);

  // 2. Evaluate eligibility deterministically
  const result: EligibilityResult = evaluateStudentEligibility(
    driveId,
    rule,
    snapshot
  );

  // 3. Upsert into eligibility_evaluations for audit trail
  await db
    .insert(eligibilityEvaluations)
    .values({
      studentId: studentProfileId,
      recruitmentDriveId: driveId,
      eligible: result.eligible,
      reasons: result.reasons,
      evaluatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [
        eligibilityEvaluations.studentId,
        eligibilityEvaluations.recruitmentDriveId,
      ],
      set: {
        eligible: result.eligible,
        reasons: result.reasons,
        evaluatedAt: new Date(),
      },
    });

  return {
    ...result,
    companyName: drive.companyName,
    jobTitle: drive.jobTitle,
    ctcOrStipend: drive.ctcOrStipend,
    snapshot,
    candidateSnapshot: snapshot,
  };
}

/**
 * Evaluates all student candidates in the institution for a given recruitment drive in bulk.
 */
export async function evaluateAllCandidatesForDrive(driveId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database offline");

  const { drive, rule } = await getDriveWithRule(driveId);

  // Query all students
  const students = await db
    .select({
      id: studentProfiles.id,
      name: users.name,
      email: users.email,
      enrollmentNumber: studentProfiles.enrollmentNumber,
    })
    .from(studentProfiles)
    .innerJoin(users, eq(studentProfiles.userId, users.id));

  const results = [];
  let eligibleCount = 0;
  let ineligibleCount = 0;

  for (const student of students) {
    const snapshot = await getStudentCandidateSnapshot(student.id);
    const evalResult = evaluateStudentEligibility(driveId, rule, snapshot);

    if (evalResult.eligible) {
      eligibleCount++;
    } else {
      ineligibleCount++;
    }

    // Persist evaluation
    await db
      .insert(eligibilityEvaluations)
      .values({
        studentId: student.id,
        recruitmentDriveId: driveId,
        eligible: evalResult.eligible,
        reasons: evalResult.reasons,
        evaluatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [
          eligibilityEvaluations.studentId,
          eligibilityEvaluations.recruitmentDriveId,
        ],
        set: {
          eligible: evalResult.eligible,
          reasons: evalResult.reasons,
          evaluatedAt: new Date(),
        },
      });

    results.push({
      studentId: student.id,
      studentName: student.name,
      enrollmentNumber: student.enrollmentNumber,
      eligible: evalResult.eligible,
      reasons: evalResult.reasons,
      criteriaResults: evalResult.criteriaResults,
      snapshot,
    });
  }

  return {
    driveId,
    companyName: drive.companyName,
    jobTitle: drive.jobTitle,
    totalEvaluated: students.length,
    eligibleCount,
    ineligibleCount,
    results,
  };
}

/**
 * Saves or updates a Placement Rule AST for a recruitment drive.
 */
export async function savePlacementRule(
  driveId: string,
  ruleDefinition: RuleAST,
  userId: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database offline");

  // Determine latest version
  const [latestRule] = await db
    .select({ version: placementRules.version })
    .from(placementRules)
    .where(eq(placementRules.recruitmentDriveId, driveId))
    .orderBy(desc(placementRules.version))
    .limit(1);

  const nextVersion = (latestRule?.version ?? 0) + 1;

  // Deactivate existing rules
  await db
    .update(placementRules)
    .set({ isActive: false })
    .where(eq(placementRules.recruitmentDriveId, driveId));

  // Insert new active version
  const [newRule] = await db
    .insert(placementRules)
    .values({
      recruitmentDriveId: driveId,
      version: nextVersion,
      ruleDefinition,
      isActive: true,
      createdBy: userId,
    })
    .returning();

  return newRule;
}

/**
 * Lists all recruitment drives along with their active rule definitions
 */
export async function listRecruitmentDrives() {
  const db = await getDb();
  if (!db) throw new Error("Database offline");

  // Ensure benchmark ABC Technologies drive exists
  await getOrCreateBenchmarkDrive();

  const drives = await db
    .select({
      id: recruitmentDrives.id,
      companyName: recruitmentDrives.companyName,
      jobTitle: recruitmentDrives.jobTitle,
      description: recruitmentDrives.description,
      ctcOrStipend: recruitmentDrives.ctcOrStipend,
      applicationDeadline: recruitmentDrives.applicationDeadline,
      status: recruitmentDrives.status,
      createdAt: recruitmentDrives.createdAt,
    })
    .from(recruitmentDrives)
    .orderBy(desc(recruitmentDrives.createdAt));

  return Promise.all(
    drives.map(async (drive) => {
      const [rule] = await db
        .select()
        .from(placementRules)
        .where(
          and(
            eq(placementRules.recruitmentDriveId, drive.id),
            eq(placementRules.isActive, true)
          )
        )
        .orderBy(desc(placementRules.version))
        .limit(1);

      const evaluations = await db
        .select({ eligible: eligibilityEvaluations.eligible })
        .from(eligibilityEvaluations)
        .where(eq(eligibilityEvaluations.recruitmentDriveId, drive.id));

      const eligibleCount = evaluations.filter((e) => e.eligible).length;
      const totalEvaluated = evaluations.length;

      let rawRule: any = rule?.ruleDefinition || BENCHMARK_ABC_RULE;
      const operator = (rawRule.operator || rawRule.type || "AND").toUpperCase() as "AND" | "OR";
      const ruleAst: RuleAST = {
        operator,
        conditions: Array.isArray(rawRule.conditions) ? rawRule.conditions : BENCHMARK_ABC_RULE.conditions,
      };

      return {
        ...drive,
        rule: ruleAst,
        ruleDefinition: ruleAst,
        ruleVersion: rule?.version || 1,
        eligibleCount,
        totalEvaluated,
      };
    })
  );
}
