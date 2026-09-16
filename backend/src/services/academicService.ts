import { asc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { academicRecords, backlogs, subjectResults, subjects } from "../../drizzle/schema";

export interface StudentAcademicsResponse {
  cgpa: number;
  totalCredits: number;
  activeBacklogsCount: number;
  semesters: {
    semester: number;
    academicYear: string;
    sgpa: number;
    cgpa: number;
    totalCredits: number;
    subjects: {
      code: string;
      name: string;
      marks: number;
      grade: string;
      status: string;
    }[];
  }[];
  backlogs: {
    id: string;
    subjectCode: string;
    subjectName: string;
    semester: number;
    status: "ACTIVE" | "CLEARED";
  }[];
}

export async function getStudentAcademics(studentId: string): Promise<StudentAcademicsResponse> {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");

  // 1. Fetch semester academic records ordered by semester ascending
  const records = await db
    .select()
    .from(academicRecords)
    .where(eq(academicRecords.studentId, studentId))
    .orderBy(asc(academicRecords.semester));

  // 2. Fetch subject results with subject details
  const results = await db
    .select({
      id: subjectResults.id,
      semester: subjectResults.semester,
      marks: subjectResults.marks,
      grade: subjectResults.grade,
      status: subjectResults.status,
      subjectCode: subjects.code,
      subjectName: subjects.name,
    })
    .from(subjectResults)
    .innerJoin(subjects, eq(subjectResults.subjectId, subjects.id))
    .where(eq(subjectResults.studentId, studentId));

  // 3. Fetch backlogs with subject details
  const backlogRows = await db
    .select({
      id: backlogs.id,
      semester: backlogs.semester,
      status: backlogs.status,
      subjectCode: subjects.code,
      subjectName: subjects.name,
    })
    .from(backlogs)
    .innerJoin(subjects, eq(backlogs.subjectId, subjects.id))
    .where(eq(backlogs.studentId, studentId));

  const activeBacklogsCount = backlogRows.filter((b) => b.status === "ACTIVE").length;

  const semesters = records.map((rec) => {
    const semSubjects = results
      .filter((r) => r.semester === rec.semester)
      .map((r) => ({
        code: r.subjectCode,
        name: r.subjectName,
        marks: parseFloat(r.marks),
        grade: r.grade,
        status: r.status,
      }));

    return {
      semester: rec.semester,
      academicYear: rec.academicYear,
      sgpa: parseFloat(rec.sgpa),
      cgpa: parseFloat(rec.cgpa),
      totalCredits: rec.totalCredits,
      subjects: semSubjects,
    };
  });

  const latestRecord = records[records.length - 1];
  const currentCgpa = latestRecord ? parseFloat(latestRecord.cgpa) : 0;
  const totalCredits = records.reduce((sum, r) => sum + r.totalCredits, 0);

  return {
    cgpa: currentCgpa,
    totalCredits,
    activeBacklogsCount,
    semesters,
    backlogs: backlogRows.map((b) => ({
      id: b.id,
      subjectCode: b.subjectCode,
      subjectName: b.subjectName,
      semester: b.semester,
      status: b.status as "ACTIVE" | "CLEARED",
    })),
  };
}
