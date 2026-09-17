/**
 * Subject Service - Simplified for initial implementation
 * Handles subject enrollment, teacher assignment, attendance tracking
 */

import { getDb } from "../db";
import {
  facultySubjectAssignments,
  subjectEnrollments,
  subjectAttendance,
  assignments,
  assignmentSubmissions,
  subjectAnnouncements,
  subjects,
  studentProfiles,
  users,
} from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

const getDatabase = async () => {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return db;
};

// ============================================================================
// FACULTY SUBJECT ASSIGNMENT
// ============================================================================

/**
 * Get all subjects assigned to a faculty member
 */
export async function getFacultySubjects(
  facultyId: string,
  semester?: number,
  academicYear?: string
) {
  const db = await getDatabase();
  return db
    .select({
      assignment: facultySubjectAssignments,
      subject: subjects,
    })
    .from(facultySubjectAssignments)
    .innerJoin(subjects, eq(facultySubjectAssignments.subjectId, subjects.id))
    .where(eq(facultySubjectAssignments.facultyId, facultyId));
}

/**
 * Assign faculty to a subject
 */
export async function assignFacultyToSubject(data: {
  facultyId: string;
  subjectId: string;
  semester: number;
  academicYear: string;
  role?: string;
}) {
  const db = await getDatabase();
  return db.insert(facultySubjectAssignments).values({
    id: nanoid(),
    facultyId: data.facultyId,
    subjectId: data.subjectId,
    semester: data.semester,
    academicYear: data.academicYear,
    role: data.role || "INSTRUCTOR",
    createdAt: new Date(),
  }).returning();
}

// ============================================================================
// STUDENT SUBJECT ENROLLMENT
// ============================================================================

/**
 * Get all students enrolled in a subject
 */
export async function getSubjectEnrolledStudents(
  subjectId: string,
  semester: number,
  academicYear: string
) {
  const db = await getDatabase();
  return db
    .select({
      enrollment: subjectEnrollments,
      student: studentProfiles,
      user: users,
    })
    .from(subjectEnrollments)
    .innerJoin(studentProfiles, eq(subjectEnrollments.studentId, studentProfiles.id))
    .innerJoin(users, eq(studentProfiles.userId, users.id))
    .where(
      and(
        eq(subjectEnrollments.subjectId, subjectId),
        eq(subjectEnrollments.semester, semester),
        eq(subjectEnrollments.academicYear, academicYear),
        eq(subjectEnrollments.enrollmentStatus, "REGISTERED")
      )
    );
}

/**
 * Enroll student in subject
 */
export async function enrollStudentInSubject(data: {
  studentId: string;
  subjectId: string;
  semester: number;
  academicYear: string;
}) {
  const db = await getDatabase();
  const dateStr = new Date().toISOString().split("T")[0]; // Convert to YYYY-MM-DD format
  
  return db.insert(subjectEnrollments).values({
    studentId: data.studentId,
    subjectId: data.subjectId,
    semester: data.semester,
    academicYear: data.academicYear,
    enrollmentStatus: "REGISTERED",
    enrollmentDate: dateStr,
    createdAt: new Date(),
  }).returning();
}

// ============================================================================
// ATTENDANCE TRACKING
// ============================================================================

/**
 * Record attendance for a student in a subject
 */
export async function recordAttendance(data: {
  studentId: string;
  subjectId: string;
  date: Date;
  status: "PRESENT" | "ABSENT" | "LATE";
  recordedBy: string;
  notes?: string;
}) {
  const db = await getDatabase();
  const dateStr = data.date.toISOString().split("T")[0];

  return db.insert(subjectAttendance).values({
    id: nanoid(),
    studentId: data.studentId,
    subjectId: data.subjectId,
    date: dateStr,
    status: data.status,
    recordedBy: data.recordedBy,
    notes: data.notes,
    createdAt: new Date(),
  }).returning();
}

/**
 * Get attendance records for a student in a subject
 */
export async function getStudentAttendance(
  studentId: string,
  subjectId: string
) {
  const db = await getDatabase();
  return db
    .select()
    .from(subjectAttendance)
    .where(
      and(
        eq(subjectAttendance.studentId, studentId),
        eq(subjectAttendance.subjectId, subjectId)
      )
    );
}

/**
 * Calculate attendance percentage for a student in a subject
 */
export async function getAttendancePercentage(
  studentId: string,
  subjectId: string
): Promise<number> {
  const records = await getStudentAttendance(studentId, subjectId);

  if (records.length === 0) return 0;

  const presentCount = records.filter((record: any) => record.status === "PRESENT").length;
  return (presentCount / records.length) * 100;
}

// ============================================================================
// ASSIGNMENT MANAGEMENT
// ============================================================================

/**
 * Create assignment for a subject
 */
export async function createAssignment(data: {
  subjectId: string;
  facultyId: string;
  title: string;
  description: string;
  maxMarks?: number;
  dueDate: Date;
}) {
  const db = await getDatabase();
  return db.insert(assignments).values({
    id: nanoid(),
    subjectId: data.subjectId,
    facultyId: data.facultyId,
    title: data.title,
    description: data.description,
    maxMarks: data.maxMarks || 100,
    dueDate: data.dueDate,
    status: "ACTIVE",
    createdAt: new Date(),
  }).returning();
}

/**
 * Get assignments for a subject
 */
export async function getSubjectAssignments(subjectId: string) {
  const db = await getDatabase();
  return db
    .select()
    .from(assignments)
    .where(eq(assignments.subjectId, subjectId));
}

/**
 * Submit assignment by student
 */
export async function submitAssignment(data: {
  assignmentId: string;
  studentId: string;
  submissionText?: string;
  filePath?: string;
}) {
  const db = await getDatabase();
  return db.insert(assignmentSubmissions).values({
    id: nanoid(),
    assignmentId: data.assignmentId,
    studentId: data.studentId,
    submissionText: data.submissionText,
    filePath: data.filePath,
    submittedAt: new Date(),
    status: "SUBMITTED",
  }).returning();
}

/**
 * Grade assignment submission
 */
export async function gradeAssignmentSubmission(
  submissionId: string,
  marks: number,
  feedback?: string
) {
  const db = await getDatabase();
  return db
    .update(assignmentSubmissions)
    .set({
      marks: marks.toString(),
      feedback: feedback,
      status: "GRADED",
      gradedAt: new Date(),
    })
    .where(eq(assignmentSubmissions.id, submissionId))
    .returning();
}

// ============================================================================
// SUBJECT ANNOUNCEMENTS
// ============================================================================

/**
 * Post announcement to subject
 */
export async function postAnnouncement(data: {
  subjectId: string;
  facultyId: string;
  title: string;
  content: string;
  priority?: string;
}) {
  const db = await getDatabase();
  return db.insert(subjectAnnouncements).values({
    id: nanoid(),
    subjectId: data.subjectId,
    facultyId: data.facultyId,
    title: data.title,
    content: data.content,
    priority: data.priority || "NORMAL",
    createdAt: new Date(),
  }).returning();
}

/**
 * Get announcements for a subject
 */
export async function getSubjectAnnouncements(subjectId: string) {
  const db = await getDatabase();
  return db
    .select()
    .from(subjectAnnouncements)
    .where(eq(subjectAnnouncements.subjectId, subjectId))
    .limit(10);
}

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Get subject analytics - student performance summary
 */
export async function getSubjectAnalytics(subjectId: string, semester: number) {
  const currentYear = new Date().getFullYear();
  const academicYear = `${currentYear}-${currentYear + 1}`;
  
  const enrollments = await getSubjectEnrolledStudents(
    subjectId,
    semester,
    academicYear
  );

  const analytics = await Promise.all(
    enrollments.map(async (enrollment: any) => {
      const attendance = await getAttendancePercentage(
        enrollment.student.id,
        subjectId
      );

      return {
        studentId: enrollment.student.id,
        studentName: enrollment.user.name,
        enrollmentNumber: enrollment.student.enrollmentNumber,
        attendance: Math.round(attendance),
        avgMarks: 0,
        submissionsCount: 0,
      };
    })
  );

  return analytics;
}

/**
 * Identify at-risk students (low attendance or poor grades)
 */
export async function getAtRiskStudents(
  subjectId: string,
  semester: number,
  attendanceThreshold: number = 75,
  gradeThreshold: number = 50
) {
  const analytics = await getSubjectAnalytics(subjectId, semester);

  return analytics.filter(
    (a: any) => a.attendance < attendanceThreshold || a.avgMarks < gradeThreshold
  );
}

// ============================================================================
// ADDITIONAL STUDENT & MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Get all subjects enrolled by a student
 */
export async function getStudentEnrolledSubjects(
  studentId: string,
  semester?: number,
  academicYear?: string
) {
  const db = await getDatabase();

  const conditions = [
    eq(subjectEnrollments.studentId, studentId),
    eq(subjectEnrollments.enrollmentStatus, "REGISTERED"),
  ];

  if (semester !== undefined) {
    conditions.push(eq(subjectEnrollments.semester, semester));
  }

  if (academicYear !== undefined) {
    conditions.push(eq(subjectEnrollments.academicYear, academicYear));
  }

  return db
    .select({
      enrollment: subjectEnrollments,
      subject: subjects,
    })
    .from(subjectEnrollments)
    .innerJoin(subjects, eq(subjectEnrollments.subjectId, subjects.id))
    .where(and(...conditions));
}

/**
 * Get student's assignment submissions
 */
export async function getStudentAssignmentSubmissions(
  studentId: string,
  assignmentId?: string
) {
  const db = await getDatabase();

  const conditions = [eq(assignmentSubmissions.studentId, studentId)];

  if (assignmentId) {
    conditions.push(eq(assignmentSubmissions.assignmentId, assignmentId));
  }

  return db
    .select({
      submission: assignmentSubmissions,
      assignment: assignments,
    })
    .from(assignmentSubmissions)
    .innerJoin(assignments, eq(assignmentSubmissions.assignmentId, assignments.id))
    .where(and(...conditions));
}

/**
 * Remove faculty from subject
 */
export async function removeFacultyFromSubject(
  facultyId: string,
  subjectId: string,
  semester: number
) {
  const db = await getDatabase();

  // Delete using Drizzle delete syntax
  return db
    .delete(facultySubjectAssignments)
    .where(
      and(
        eq(facultySubjectAssignments.facultyId, facultyId),
        eq(facultySubjectAssignments.subjectId, subjectId),
        eq(facultySubjectAssignments.semester, semester)
      )
    )
    .returning();
}

/**
 * Drop student from subject
 */
export async function dropStudentFromSubject(
  studentId: string,
  subjectId: string,
  semester: number
) {
  const db = await getDatabase();

  return db
    .update(subjectEnrollments)
    .set({
      enrollmentStatus: "DROPPED",
    })
    .where(
      and(
        eq(subjectEnrollments.studentId, studentId),
        eq(subjectEnrollments.subjectId, subjectId),
        eq(subjectEnrollments.semester, semester)
      )
    )
    .returning();
}
