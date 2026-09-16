import { asc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { assessments, skills } from "../../drizzle/schema";

export interface CreateAssessmentInput {
  name: string;
  departmentId?: string | null;
  skillIds: string[];
  maxScore?: number;
  durationMinutes?: number;
  status?: string;
}

export async function createAssessment(input: CreateAssessmentInput) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");

  const [assessment] = await db
    .insert(assessments)
    .values({
      name: input.name,
      departmentId: input.departmentId || null,
      skillIds: input.skillIds,
      maxScore: input.maxScore ?? 100,
      durationMinutes: input.durationMinutes ?? 60,
      status: input.status ?? "PUBLISHED",
    })
    .returning();

  return assessment;
}

export async function getAssessments(departmentId?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");

  if (departmentId) {
    return db
      .select()
      .from(assessments)
      .where(eq(assessments.departmentId, departmentId))
      .orderBy(asc(assessments.name));
  }

  return db.select().from(assessments).orderBy(asc(assessments.name));
}

export async function getAssessmentById(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");

  const [assessment] = await db
    .select()
    .from(assessments)
    .where(eq(assessments.id, id))
    .limit(1);

  return assessment || null;
}
