import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb } from "../db";
import {
  backlogs,
  skillGaps,
  skillHistory,
  skills,
  studentProfiles,
  subjects,
  users,
} from "../../drizzle/schema";

/**
 * Deterministic Skill-Gap Rule (RULE_GAP_01)
 *
 * SkillGapCondition = (S_t < S_{t-1} && S_{t-1} < S_{t-2}) && (ActiveBacklogs > 0)
 *
 * Evaluates whether the last 3 assessment scores are strictly declining
 * AND the student has at least one active backlog.
 */
export function evaluateRuleGap01(
  scoreHistory: number[],
  activeBacklogsCount: number
): boolean {
  if (activeBacklogsCount <= 0) return false;
  if (!scoreHistory || scoreHistory.length < 3) return false;

  const len = scoreHistory.length;
  const sT = scoreHistory[len - 1]; // Most recent score
  const sTMinus1 = scoreHistory[len - 2]; // Previous score
  const sTMinus2 = scoreHistory[len - 3]; // Two cycles ago

  return sT < sTMinus1 && sTMinus1 < sTMinus2;
}

export interface SkillGapDetail {
  id: string;
  studentId: string;
  skillId: string;
  skillName: string;
  ruleId: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "IN_REVIEW" | "RESOLVED" | "REOPENED";
  reason: {
    score_history: number[];
    active_backlogs: number;
    backlog_subject?: string;
    trigger_text: string;
  };
  createdAt: Date;
  resolvedAt: Date | null;
}

/**
 * Evaluates all skills for a student against RULE_GAP_01 and synchronizes with skill_gaps table.
 * Idempotent: avoids inserting duplicate open gaps.
 */
export async function evaluateAndSyncStudentGaps(
  studentId: string
): Promise<SkillGapDetail[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");

  // 1. Fetch active backlogs for student
  const activeBacklogs = await db
    .select({
      id: backlogs.id,
      subjectName: subjects.name,
      subjectCode: subjects.code,
    })
    .from(backlogs)
    .innerJoin(subjects, eq(backlogs.subjectId, subjects.id))
    .where(
      and(
        eq(backlogs.studentId, studentId),
        eq(backlogs.status, "ACTIVE")
      )
    );

  const activeBacklogsCount = activeBacklogs.length;
  const primaryBacklogSubject =
    activeBacklogs.length > 0 ? activeBacklogs[0].subjectName : undefined;

  // 2. Fetch all skills
  const allSkills = await db
    .select()
    .from(skills)
    .where(eq(skills.isActive, true));

  // 3. Fetch skill history for student ordered by date
  const historyRecords = await db
    .select()
    .from(skillHistory)
    .where(eq(skillHistory.studentId, studentId))
    .orderBy(asc(skillHistory.assessmentDate));

  // Group history by skillId
  const historyBySkill = new Map<string, number[]>();
  for (const h of historyRecords) {
    const list = historyBySkill.get(h.skillId) || [];
    list.push(Math.round(parseFloat(h.score)));
    historyBySkill.set(h.skillId, list);
  }

  // 4. Fetch existing open or in-review gaps for student
  const existingGaps = await db
    .select()
    .from(skillGaps)
    .where(
      and(
        eq(skillGaps.studentId, studentId),
        inArray(skillGaps.status, ["OPEN", "IN_REVIEW"])
      )
    );

  const existingGapBySkill = new Map<string, typeof existingGaps[0]>();
  for (const g of existingGaps) {
    existingGapBySkill.set(g.skillId, g);
  }

  // 5. Evaluate RULE_GAP_01 for each skill
  for (const skill of allSkills) {
    const scores = historyBySkill.get(skill.id) || [];
    const meetsRule = evaluateRuleGap01(scores, activeBacklogsCount);

    if (meetsRule) {
      // Check if already open
      const existing = existingGapBySkill.get(skill.id);
      if (!existing) {
        // Insert new skill gap
        await db.insert(skillGaps).values({
          studentId,
          skillId: skill.id,
          ruleId: "RULE_GAP_01",
          severity: "HIGH",
          status: "OPEN",
          reason: {
            score_history: scores.slice(-3),
            active_backlogs: activeBacklogsCount,
            backlog_subject: primaryBacklogSubject,
            trigger_text:
              "Two consecutive score drops accompanied by an active backlog.",
          },
          createdAt: new Date(),
        });
      }
    }
  }

  // 6. Return current open / in-review gaps for the student with joined skill names
  return getStudentSkillGaps(studentId);
}

/**
 * Returns all open or in-review skill gaps for a student with joined skill names.
 */
export async function getStudentSkillGaps(
  studentId: string
): Promise<SkillGapDetail[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");

  const rows = await db
    .select({
      id: skillGaps.id,
      studentId: skillGaps.studentId,
      skillId: skillGaps.skillId,
      skillName: skills.name,
      ruleId: skillGaps.ruleId,
      severity: skillGaps.severity,
      status: skillGaps.status,
      reason: skillGaps.reason,
      createdAt: skillGaps.createdAt,
      resolvedAt: skillGaps.resolvedAt,
    })
    .from(skillGaps)
    .innerJoin(skills, eq(skillGaps.skillId, skills.id))
    .where(
      and(
        eq(skillGaps.studentId, studentId),
        inArray(skillGaps.status, ["OPEN", "IN_REVIEW"])
      )
    )
    .orderBy(asc(skillGaps.createdAt));

  return rows.map((r) => ({
    id: r.id,
    studentId: r.studentId,
    skillId: r.skillId,
    skillName: r.skillName,
    ruleId: r.ruleId,
    severity: r.severity as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    status: r.status as "OPEN" | "IN_REVIEW" | "RESOLVED" | "REOPENED",
    reason: r.reason as SkillGapDetail["reason"],
    createdAt: r.createdAt,
    resolvedAt: r.resolvedAt,
  }));
}

/**
 * Fetch a single gap by ID with joined skill details.
 */
export async function getGapById(gapId: string): Promise<SkillGapDetail> {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");

  const [row] = await db
    .select({
      id: skillGaps.id,
      studentId: skillGaps.studentId,
      skillId: skillGaps.skillId,
      skillName: skills.name,
      ruleId: skillGaps.ruleId,
      severity: skillGaps.severity,
      status: skillGaps.status,
      reason: skillGaps.reason,
      createdAt: skillGaps.createdAt,
      resolvedAt: skillGaps.resolvedAt,
    })
    .from(skillGaps)
    .innerJoin(skills, eq(skillGaps.skillId, skills.id))
    .where(eq(skillGaps.id, gapId))
    .limit(1);

  if (!row) {
    throw new Error(`Skill gap not found for ID: ${gapId}`);
  }

  return {
    id: row.id,
    studentId: row.studentId,
    skillId: row.skillId,
    skillName: row.skillName,
    ruleId: row.ruleId,
    severity: row.severity as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    status: row.status as "OPEN" | "IN_REVIEW" | "RESOLVED" | "REOPENED",
    reason: row.reason as SkillGapDetail["reason"],
    createdAt: row.createdAt,
    resolvedAt: row.resolvedAt,
  };
}

/**
 * Returns all active skill gaps across a department for faculty review.
 */
export async function getDepartmentGaps(departmentId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");

  return db
    .select({
      id: skillGaps.id,
      studentId: skillGaps.studentId,
      studentName: users.name,
      enrollmentNumber: studentProfiles.enrollmentNumber,
      skillId: skillGaps.skillId,
      skillName: skills.name,
      ruleId: skillGaps.ruleId,
      severity: skillGaps.severity,
      status: skillGaps.status,
      reason: skillGaps.reason,
      createdAt: skillGaps.createdAt,
    })
    .from(skillGaps)
    .innerJoin(studentProfiles, eq(skillGaps.studentId, studentProfiles.id))
    .innerJoin(users, eq(studentProfiles.userId, users.id))
    .innerJoin(skills, eq(skillGaps.skillId, skills.id))
    .where(
      and(
        eq(studentProfiles.departmentId, departmentId),
        inArray(skillGaps.status, ["OPEN", "IN_REVIEW"])
      )
    )
    .orderBy(asc(skillGaps.createdAt));
}
