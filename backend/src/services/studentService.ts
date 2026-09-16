import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { departments, institutions, studentProfiles, users } from "../../drizzle/schema";

export interface StudentProfileDetail {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  enrollmentNumber: string;
  program: string;
  section: string | null;
  currentSemester: number;
  admissionYear: number;
  graduationYear: number;
  institution: {
    id: string;
    name: string;
    code: string;
  };
  department: {
    id: string;
    name: string;
    code: string;
  };
  mentor: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export async function getStudentProfile(studentId: string): Promise<StudentProfileDetail> {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");

  const [record] = await db
    .select({
      id: studentProfiles.id,
      userId: studentProfiles.userId,
      enrollmentNumber: studentProfiles.enrollmentNumber,
      program: studentProfiles.program,
      section: studentProfiles.section,
      currentSemester: studentProfiles.currentSemester,
      admissionYear: studentProfiles.admissionYear,
      graduationYear: studentProfiles.graduationYear,
      studentName: users.name,
      studentEmail: users.email,
      studentAvatar: users.avatarUrl,
      deptId: departments.id,
      deptName: departments.name,
      deptCode: departments.code,
      instId: institutions.id,
      instName: institutions.name,
      instCode: institutions.code,
      mentorId: studentProfiles.assignedFacultyId,
    })
    .from(studentProfiles)
    .innerJoin(users, eq(studentProfiles.userId, users.id))
    .innerJoin(departments, eq(studentProfiles.departmentId, departments.id))
    .innerJoin(institutions, eq(studentProfiles.institutionId, institutions.id))
    .where(eq(studentProfiles.id, studentId))
    .limit(1);

  if (!record) {
    throw new Error(`Student profile not found for ID: ${studentId}`);
  }

  let mentor: { id: string; name: string; email: string } | null = null;
  if (record.mentorId) {
    const [faculty] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, record.mentorId))
      .limit(1);

    if (faculty) {
      mentor = faculty;
    }
  }

  return {
    id: record.id,
    userId: record.userId,
    name: record.studentName,
    email: record.studentEmail,
    avatarUrl: record.studentAvatar,
    enrollmentNumber: record.enrollmentNumber,
    program: record.program,
    section: record.section,
    currentSemester: record.currentSemester,
    admissionYear: record.admissionYear,
    graduationYear: record.graduationYear,
    institution: {
      id: record.instId,
      name: record.instName,
      code: record.instCode,
    },
    department: {
      id: record.deptId,
      name: record.deptName,
      code: record.deptCode,
    },
    mentor,
  };
}
