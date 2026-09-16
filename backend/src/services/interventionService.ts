import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../db";
import {
  academicRecords,
  interventions,
  skillGaps,
  skills,
  studentProfiles,
  users,
} from "../../drizzle/schema";

export interface WardSummary {
  studentProfileId: string;
  userId: string;
  name: string;
  email: string;
  enrollmentNumber: string;
  program: string;
  currentSemester: number;
  cgpa: number;
  status: "NEEDS_ATTENTION" | "ON_TRACK";
  activeGaps: {
    id: string;
    skillId: string;
    skillName: string;
    severity: string;
    status: string;
    reason: any;
  }[];
  activeInterventionsCount: number;
}

export interface CreateInterventionInput {
  assignedBy: string; // Faculty userId
  studentId: string; // studentProfile.id
  skillGapId: string;
  type: "MENTORING" | "REMEDIAL_CLASS" | "ASSIGNMENT";
  description: string;
  startDate?: string;
  endDate?: string;
}

export interface RecordOutcomeInput {
  interventionId: string;
  outcome: string;
  status: "COMPLETED" | "CANCELLED";
}

/**
 * 1. Fetch assigned student wards for a faculty mentor (Teacher-Guardian scope).
 */
export async function getAssignedWards(
  facultyUserId: string
): Promise<WardSummary[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");

  // Query student profiles assigned to this faculty member
  const students = await db
    .select({
      id: studentProfiles.id,
      userId: studentProfiles.userId,
      enrollmentNumber: studentProfiles.enrollmentNumber,
      program: studentProfiles.program,
      currentSemester: studentProfiles.currentSemester,
      name: users.name,
      email: users.email,
    })
    .from(studentProfiles)
    .innerJoin(users, eq(studentProfiles.userId, users.id))
    .where(eq(studentProfiles.assignedFacultyId, facultyUserId));

  if (students.length === 0) {
    return [];
  }

  const studentIds = students.map((s) => s.id);

  // Query academic records for CGPA
  const records = await db
    .select()
    .from(academicRecords)
    .where(inArray(academicRecords.studentId, studentIds))
    .orderBy(desc(academicRecords.semester));

  const cgpaMap = new Map<string, number>();
  for (const r of records) {
    if (!cgpaMap.has(r.studentId)) {
      cgpaMap.set(r.studentId, parseFloat(r.cgpa));
    }
  }

  // Query active skill gaps
  const gaps = await db
    .select({
      id: skillGaps.id,
      studentId: skillGaps.studentId,
      skillId: skillGaps.skillId,
      skillName: skills.name,
      severity: skillGaps.severity,
      status: skillGaps.status,
      reason: skillGaps.reason,
    })
    .from(skillGaps)
    .innerJoin(skills, eq(skillGaps.skillId, skills.id))
    .where(
      and(
        inArray(skillGaps.studentId, studentIds),
        inArray(skillGaps.status, ["OPEN", "IN_REVIEW"])
      )
    );

  const gapsMap = new Map<string, typeof gaps>();
  for (const g of gaps) {
    const list = gapsMap.get(g.studentId) || [];
    list.push(g);
    gapsMap.set(g.studentId, list);
  }

  // Query active interventions
  const activeInterventions = await db
    .select()
    .from(interventions)
    .where(
      and(
        inArray(interventions.studentId, studentIds),
        inArray(interventions.status, ["PENDING", "SCHEDULED", "IN_PROGRESS"])
      )
    );

  const interventionCountMap = new Map<string, number>();
  for (const inv of activeInterventions) {
    interventionCountMap.set(
      inv.studentId,
      (interventionCountMap.get(inv.studentId) || 0) + 1
    );
  }

  return students.map((s) => {
    const sGaps = gapsMap.get(s.id) || [];
    const activeCount = interventionCountMap.get(s.id) || 0;
    const cgpa = cgpaMap.get(s.id) ?? 8.42;

    return {
      studentProfileId: s.id,
      userId: s.userId,
      name: s.name,
      email: s.email,
      enrollmentNumber: s.enrollmentNumber,
      program: s.program,
      currentSemester: s.currentSemester,
      cgpa,
      status: sGaps.length > 0 ? "NEEDS_ATTENTION" : "ON_TRACK",
      activeGaps: sGaps,
      activeInterventionsCount: activeCount,
    };
  });
}

/**
 * 2. Create a new mentoring intervention and update gap status to IN_REVIEW.
 */
export async function createIntervention(input: CreateInterventionInput) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");

  // Verify student profile exists
  const [student] = await db
    .select()
    .from(studentProfiles)
    .where(eq(studentProfiles.id, input.studentId))
    .limit(1);

  if (!student) {
    throw new Error(`Student profile not found: ${input.studentId}`);
  }

  // Verify skill gap exists
  const [gap] = await db
    .select()
    .from(skillGaps)
    .where(eq(skillGaps.id, input.skillGapId))
    .limit(1);

  if (!gap) {
    throw new Error(`Skill gap not found: ${input.skillGapId}`);
  }

  const now = new Date();
  const startDate = input.startDate ? new Date(input.startDate).toISOString().split("T")[0] : now.toISOString().split("T")[0];

  // Insert intervention
  const [intervention] = await db
    .insert(interventions)
    .values({
      studentId: input.studentId,
      skillGapId: input.skillGapId,
      assignedTo: input.assignedBy,
      type: input.type,
      description: input.description,
      status: "SCHEDULED",
      startDate: startDate,
      endDate: input.endDate ? new Date(input.endDate).toISOString().split("T")[0] : null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  // Transition skill gap status from OPEN to IN_REVIEW
  await db
    .update(skillGaps)
    .set({
      status: "IN_REVIEW",
    })
    .where(eq(skillGaps.id, input.skillGapId));

  return intervention;
}

/**
 * 3. Log session outcome and mark intervention as COMPLETED or CANCELLED.
 */
export async function recordOutcome(input: RecordOutcomeInput) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");

  const [intervention] = await db
    .select()
    .from(interventions)
    .where(eq(interventions.id, input.interventionId))
    .limit(1);

  if (!intervention) {
    throw new Error(`Intervention not found: ${input.interventionId}`);
  }

  const [updated] = await db
    .update(interventions)
    .set({
      outcome: input.outcome,
      status: input.status,
      updatedAt: new Date(),
    })
    .where(eq(interventions.id, input.interventionId))
    .returning();

  return updated;
}

/**
 * 4. Fetch all interventions for a student.
 */
export async function getStudentInterventions(studentId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");

  const rows = await db
    .select({
      id: interventions.id,
      studentId: interventions.studentId,
      skillGapId: interventions.skillGapId,
      type: interventions.type,
      description: interventions.description,
      status: interventions.status,
      startDate: interventions.startDate,
      endDate: interventions.endDate,
      outcome: interventions.outcome,
      createdAt: interventions.createdAt,
      mentorName: users.name,
      mentorEmail: users.email,
      skillName: skills.name,
      gapSeverity: skillGaps.severity,
      gapStatus: skillGaps.status,
    })
    .from(interventions)
    .innerJoin(users, eq(interventions.assignedTo, users.id))
    .innerJoin(skillGaps, eq(interventions.skillGapId, skillGaps.id))
    .innerJoin(skills, eq(skillGaps.skillId, skills.id))
    .where(eq(interventions.studentId, studentId))
    .orderBy(desc(interventions.createdAt));

  return rows;
}

/**
 * 5. Automated Closed-Loop Resolution Hook.
 * When a student re-assesses in an intervened skill and hits score >= 75:
 * Transitions open/in-review skill gaps to RESOLVED and active interventions to COMPLETED.
 */
export async function checkInterventionResolution(
  studentId: string,
  skillId: string,
  newScore: number
): Promise<{ resolvedGapsCount: number; completedInterventionsCount: number }> {
  const db = await getDb();
  if (!db) return { resolvedGapsCount: 0, completedInterventionsCount: 0 };

  if (newScore < 75) {
    return { resolvedGapsCount: 0, completedInterventionsCount: 0 };
  }

  // Find any OPEN or IN_REVIEW gaps for this student and skill
  const gapsToResolve = await db
    .select()
    .from(skillGaps)
    .where(
      and(
        eq(skillGaps.studentId, studentId),
        eq(skillGaps.skillId, skillId),
        inArray(skillGaps.status, ["OPEN", "IN_REVIEW"])
      )
    );

  if (gapsToResolve.length === 0) {
    return { resolvedGapsCount: 0, completedInterventionsCount: 0 };
  }

  const gapIds = gapsToResolve.map((g) => g.id);
  const now = new Date();

  // 1. Mark skill gaps as RESOLVED
  await db
    .update(skillGaps)
    .set({
      status: "RESOLVED",
      resolvedAt: now,
    })
    .where(inArray(skillGaps.id, gapIds));

  // 2. Mark linked active interventions as COMPLETED with automated outcome
  const updatedInterventions = await db
    .update(interventions)
    .set({
      status: "COMPLETED",
      outcome: `Automatically resolved: Follow-up continuous assessment score improved to ${newScore}%.`,
      updatedAt: now,
    })
    .where(
      and(
        inArray(interventions.skillGapId, gapIds),
        inArray(interventions.status, ["PENDING", "SCHEDULED", "IN_PROGRESS"])
      )
    )
    .returning();

  return {
    resolvedGapsCount: gapIds.length,
    completedInterventionsCount: updatedInterventions.length,
  };
}
