import { asc, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../db";
import {
  assessments,
  assessmentSubmissions,
  skillHistory,
  skills,
} from "../../drizzle/schema";

export interface SkillItem {
  id: string;
  name: string;
  category: string;
  latestScore: number;
  delta: number;
  scoreHistory: number[];
  verified: boolean;
}

export interface SkillProfileResponse {
  skills: SkillItem[];
}

export async function getStudentSkillProfile(studentId: string): Promise<SkillProfileResponse> {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");

  // 1. Fetch active skills and student skill history in parallel
  const [allSkills, historyRecords] = await Promise.all([
    db
      .select()
      .from(skills)
      .where(eq(skills.isActive, true))
      .orderBy(asc(skills.name)),
    db
      .select()
      .from(skillHistory)
      .where(eq(skillHistory.studentId, studentId))
      .orderBy(asc(skillHistory.assessmentDate)),
  ]);

  // 3. Group history by skillId
  const historyBySkill = new Map<string, typeof historyRecords>();
  for (const record of historyRecords) {
    const list = historyBySkill.get(record.skillId) || [];
    list.push(record);
    historyBySkill.set(record.skillId, list);
  }

  const items: SkillItem[] = allSkills.map((s) => {
    const hList = historyBySkill.get(s.id) || [];
    const scoreHistory = hList.map((h) => Math.round(parseFloat(h.score)));

    if (scoreHistory.length === 0) {
      return {
        id: s.id,
        name: s.name,
        category: s.category,
        latestScore: 0,
        delta: 0,
        scoreHistory: [],
        verified: false,
      };
    }

    const latestScore = scoreHistory[scoreHistory.length - 1];
    const previousScore =
      scoreHistory.length > 1
        ? scoreHistory[scoreHistory.length - 2]
        : latestScore;
    const delta = latestScore - previousScore;

    return {
      id: s.id,
      name: s.name,
      category: s.category,
      latestScore,
      delta,
      scoreHistory,
      verified: true,
    };
  });

  return { skills: items };
}

export async function getAssessments() {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");

  return db
    .select()
    .from(assessments)
    .where(eq(assessments.status, "PUBLISHED"))
    .orderBy(asc(assessments.name));
}

export interface SubmitAssessmentInput {
  studentId: string;
  assessmentId: string;
  answers?: Record<string, any>;
  score?: number;
}

export async function submitAssessment({
  studentId,
  assessmentId,
  answers,
  score: manualScore,
}: SubmitAssessmentInput) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");

  // 1. Validate assessment exists and is PUBLISHED
  const [assessment] = await db
    .select()
    .from(assessments)
    .where(eq(assessments.id, assessmentId))
    .limit(1);

  if (!assessment) {
    throw new Error(`Assessment not found: ${assessmentId}`);
  }

  if (assessment.status !== "PUBLISHED") {
    throw new Error(`Assessment is not published: ${assessmentId}`);
  }

  // 2. Deterministic score calculation
  let finalScore: number;
  if (typeof manualScore === "number") {
    finalScore = Math.max(0, Math.min(assessment.maxScore, manualScore));
  } else if (answers && Object.keys(answers).length > 0) {
    // Scoring based on answers submitted
    const count = Object.keys(answers).length;
    finalScore = Math.min(assessment.maxScore, Math.round(70 + count * 5));
  } else {
    finalScore = 80;
  }

  // 3. Determine attempt number
  const previousSubmissions = await db
    .select()
    .from(assessmentSubmissions)
    .where(
      eq(assessmentSubmissions.studentId, studentId)
    );
  const attemptsForThis = previousSubmissions.filter(
    (s) => s.assessmentId === assessmentId
  );
  const attemptNumber = attemptsForThis.length + 1;

  const now = new Date();

  // 4. Insert into assessmentSubmissions
  const [submission] = await db
    .insert(assessmentSubmissions)
    .values({
      assessmentId,
      studentId,
      score: finalScore.toFixed(2),
      maxScore: assessment.maxScore.toString(),
      attemptNumber,
      submittedAt: now,
    })
    .returning();

  // 5. Append time-series history into skillHistory for each associated skill
  const skillIds = assessment.skillIds as string[];
  if (Array.isArray(skillIds) && skillIds.length > 0) {
    for (const sId of skillIds) {
      await db.insert(skillHistory).values({
        studentId,
        skillId: sId,
        assessmentId,
        score: finalScore.toFixed(2),
        maxScore: assessment.maxScore.toString(),
        assessmentDate: now,
      });
    }
  }

  // 6. Trigger skill gap evaluation hook (Phase 04)
  try {
    const { evaluateAndSyncStudentGaps } = await import("../rules/skillGapEngine");
    await evaluateAndSyncStudentGaps(studentId);
  } catch (err) {
    console.warn("[SkillService] Skill gap evaluation error:", err);
  }

  // 7. Trigger closed-loop intervention resolution hook (Phase 05)
  try {
    const { checkInterventionResolution } = await import("./interventionService");
    if (Array.isArray(skillIds)) {
      for (const sId of skillIds) {
        await checkInterventionResolution(studentId, sId, finalScore);
      }
    }
  } catch (err) {
    console.warn("[SkillService] Closed-loop resolution hook error:", err);
  }

  return {
    success: true,
    submissionId: submission.id,
    assessmentName: assessment.name,
    score: finalScore,
    attemptNumber,
    submittedAt: now.toISOString(),
  };
}
