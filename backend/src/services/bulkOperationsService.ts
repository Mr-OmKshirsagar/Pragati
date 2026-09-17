/**
 * Bulk Operations Service
 * Efficient batch operations for attendance marking, grading, and enrollment
 */

import { eq, and, inArray } from "drizzle-orm";
import {
  subjectAttendance,
  assignmentSubmissions,
  subjectEnrollments,
  assignments,
  studentProfiles,
  users,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { nanoid } from "nanoid";

const getDatabase = async () => {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return db;
};

// ============================================================================
// BULK ATTENDANCE OPERATIONS
// ============================================================================

/**
 * Bulk import attendance from CSV data
 */
export async function bulkImportAttendance(data: {
  subjectId: string;
  recordedBy: string;
  attendanceRecords: Array<{
    studentId: string;
    date: string; // YYYY-MM-DD
    status: "PRESENT" | "ABSENT" | "LATE";
    notes?: string;
  }>;
}) {
  const db = await getDatabase();

  const results = {
    successful: 0,
    failed: 0,
    errors: [] as string[],
    duplicates: 0,
  };

  for (const record of data.attendanceRecords) {
    try {
      // Check for duplicates
      const existing = await db
        .select()
        .from(subjectAttendance)
        .where(
          and(
            eq(subjectAttendance.studentId, record.studentId),
            eq(subjectAttendance.subjectId, data.subjectId),
            eq(subjectAttendance.date, record.date)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        results.duplicates++;
        continue;
      }

      // Insert attendance
      await db.insert(subjectAttendance).values({
        studentId: record.studentId,
        subjectId: data.subjectId,
        date: record.date,
        status: record.status,
        recordedBy: data.recordedBy,
        notes: record.notes,
        createdAt: new Date(),
      });

      results.successful++;
    } catch (error) {
      results.failed++;
      results.errors.push(
        `Failed for ${record.studentId} on ${record.date}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return results;
}

/**
 * Bulk mark attendance for multiple students on same day
 */
export async function bulkMarkAttendance(data: {
  subjectId: string;
  date: string; // YYYY-MM-DD
  recordedBy: string;
  markAll: {
    status: "PRESENT" | "ABSENT" | "LATE";
    studentIds: string[];
  }[];
}) {
  const db = await getDatabase();

  const results = {
    successful: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const mark of data.markAll) {
    for (const studentId of mark.studentIds) {
      try {
        await db.insert(subjectAttendance).values({
          studentId,
          subjectId: data.subjectId,
          date: data.date,
          status: mark.status,
          recordedBy: data.recordedBy,
          createdAt: new Date(),
        });

        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push(
          `Failed for student ${studentId}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }

  return results;
}

/**
 * Generate attendance report for subject
 */
export async function generateAttendanceReport(params: {
  subjectId: string;
  semester: number;
}) {
  const db = await getDatabase();

  // Get all students in subject
  const enrollments = await db
    .select({
      student: studentProfiles,
      user: users,
    })
    .from(subjectEnrollments)
    .innerJoin(studentProfiles, eq(subjectEnrollments.studentId, studentProfiles.id))
    .innerJoin(users, eq(studentProfiles.userId, users.id))
    .where(
      and(
        eq(subjectEnrollments.subjectId, params.subjectId),
        eq(subjectEnrollments.semester, params.semester)
      )
    );

  const report = [];

  for (const enrollment of enrollments) {
    const attendance = await db
      .select()
      .from(subjectAttendance)
      .where(
        and(
          eq(subjectAttendance.studentId, enrollment.student.id),
          eq(subjectAttendance.subjectId, params.subjectId)
        )
      );

    const totalClasses = attendance.length;
    const presentCount = attendance.filter((a) => a.status === "PRESENT").length;
    const absentCount = attendance.filter((a) => a.status === "ABSENT").length;
    const lateCount = attendance.filter((a) => a.status === "LATE").length;

    report.push({
      studentId: enrollment.student.id,
      studentName: enrollment.user.name,
      enrollmentNumber: enrollment.student.enrollmentNumber,
      totalClasses,
      present: presentCount,
      absent: absentCount,
      late: lateCount,
      attendancePercentage:
        totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(2) : 0,
      status:
        totalClasses > 0 && (presentCount / totalClasses) * 100 >= 75
          ? "✅ Good"
          : "⚠️ At Risk",
    });
  }

  return report.sort(
    (a, b) => parseFloat(String(b.attendancePercentage)) - parseFloat(String(a.attendancePercentage))
  );
}

// ============================================================================
// BULK GRADING OPERATIONS
// ============================================================================

/**
 * Bulk grade assignments
 */
export async function bulkGradeAssignments(data: {
  assignmentId: string;
  grades: Array<{
    submissionId: string;
    marks: number;
    feedback?: string;
  }>;
}) {
  const db = await getDatabase();

  const results = {
    successful: 0,
    failed: 0,
    errors: [] as string[],
    stats: {
      averageMarks: 0,
      highestMarks: 0,
      lowestMarks: 100,
      totalGraded: 0,
    },
  };

  let totalMarks = 0;

  for (const grade of data.grades) {
    try {
      await db
        .update(assignmentSubmissions)
        .set({
          marks: grade.marks.toString(),
          feedback: grade.feedback,
          status: "GRADED",
          gradedAt: new Date(),
        })
        .where(eq(assignmentSubmissions.id, grade.submissionId));

      results.successful++;
      totalMarks += grade.marks;
      results.stats.highestMarks = Math.max(results.stats.highestMarks, grade.marks);
      results.stats.lowestMarks = Math.min(results.stats.lowestMarks, grade.marks);
    } catch (error) {
      results.failed++;
      results.errors.push(
        `Failed for submission ${grade.submissionId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  results.stats.totalGraded = results.successful;
  results.stats.averageMarks =
    results.successful > 0 ? parseFloat((totalMarks / results.successful).toFixed(2)) : 0;

  return results;
}

/**
 * Bulk provide feedback on assignments
 */
export async function bulkProvideFeedback(data: {
  submissionIds: string[];
  feedbackTemplate: string;
  includeMarks?: boolean;
}) {
  const db = await getDatabase();

  const results = {
    successful: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const submissionId of data.submissionIds) {
    try {
      const submission = await db
        .select()
        .from(assignmentSubmissions)
        .where(eq(assignmentSubmissions.id, submissionId))
        .limit(1)
        .then(([result]) => result);

      if (!submission) {
        results.failed++;
        results.errors.push(`Submission ${submissionId} not found`);
        continue;
      }

      const feedback = data.feedbackTemplate.replace(
        "{marks}",
        submission.marks?.toString() || "0"
      );

      await db
        .update(assignmentSubmissions)
        .set({
          feedback,
        })
        .where(eq(assignmentSubmissions.id, submissionId));

      results.successful++;
    } catch (error) {
      results.failed++;
      results.errors.push(
        `Failed for submission ${submissionId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return results;
}

/**
 * Generate grading analytics for assignment
 */
export async function generateGradingAnalytics(assignmentId: string) {
  const db = await getDatabase();

  const submissions = await db
    .select()
    .from(assignmentSubmissions)
    .where(eq(assignmentSubmissions.assignmentId, assignmentId));

  const graded = submissions.filter((s) => s.status === "GRADED");
  const marks = graded.map((s) => parseInt(s.marks || "0", 10));

  const analytics = {
    assignmentId,
    totalSubmissions: submissions.length,
    graded: graded.length,
    pending: submissions.filter((s) => s.status === "SUBMITTED").length,

    statistics: {
      averageMarks:
        marks.length > 0 ? (marks.reduce((a, b) => a + b, 0) / marks.length).toFixed(2) : 0,
      highestMarks: marks.length > 0 ? Math.max(...marks) : 0,
      lowestMarks: marks.length > 0 ? Math.min(...marks) : 0,
      median:
        marks.length > 0
          ? marks.length % 2 === 0
            ? ((marks[marks.length / 2 - 1] + marks[marks.length / 2]) / 2).toFixed(2)
            : marks[Math.floor(marks.length / 2)]
          : 0,
    },

    distribution: {
      excellent: graded.filter((s) => parseInt(s.marks || "0", 10) >= 90).length, // 90-100
      veryGood: graded.filter((s) => parseInt(s.marks || "0", 10) >= 80 && parseInt(s.marks || "0", 10) < 90).length, // 80-89
      good: graded.filter((s) => parseInt(s.marks || "0", 10) >= 70 && parseInt(s.marks || "0", 10) < 80).length, // 70-79
      satisfactory: graded.filter((s) => parseInt(s.marks || "0", 10) >= 60 && parseInt(s.marks || "0", 10) < 70).length, // 60-69
      needsImprovement: graded.filter((s) => parseInt(s.marks || "0", 10) < 60).length, // <60
    },

    submissionQuality: {
      onTime: graded.filter((s) => s.submittedAt && new Date(s.submittedAt) <= new Date()).length,
      late: graded.filter((s) => s.submittedAt && new Date(s.submittedAt) > new Date()).length,
    },
  };

  return analytics;
}

// ============================================================================
// BULK ENROLLMENT OPERATIONS
// ============================================================================

/**
 * Bulk enroll students in subject
 */
export async function bulkEnrollStudents(data: {
  studentIds: string[];
  subjectId: string;
  semester: number;
  academicYear: string;
}) {
  const db = await getDatabase();

  const results = {
    successful: 0,
    failed: 0,
    duplicates: 0,
    errors: [] as string[],
  };

  const dateStr = new Date().toISOString().split("T")[0];

  for (const studentId of data.studentIds) {
    try {
      // Check for existing enrollment
      const existing = await db
        .select()
        .from(subjectEnrollments)
        .where(
          and(
            eq(subjectEnrollments.studentId, studentId),
            eq(subjectEnrollments.subjectId, data.subjectId),
            eq(subjectEnrollments.semester, data.semester)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        results.duplicates++;
        continue;
      }

      await db.insert(subjectEnrollments).values({
        studentId,
        subjectId: data.subjectId,
        semester: data.semester,
        academicYear: data.academicYear,
        enrollmentStatus: "REGISTERED",
        enrollmentDate: dateStr,
        createdAt: new Date(),
      });

      results.successful++;
    } catch (error) {
      results.failed++;
      results.errors.push(
        `Failed to enroll student ${studentId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return results;
}

/**
 * Bulk drop students from subject
 */
export async function bulkDropStudents(data: {
  studentIds: string[];
  subjectId: string;
  semester: number;
  reason?: string;
}) {
  const db = await getDatabase();

  const results = {
    successful: 0,
    failed: 0,
    notFound: 0,
    errors: [] as string[],
  };

  for (const studentId of data.studentIds) {
    try {
      const updated = await db
        .update(subjectEnrollments)
        .set({
          enrollmentStatus: "DROPPED",
        })
        .where(
          and(
            eq(subjectEnrollments.studentId, studentId),
            eq(subjectEnrollments.subjectId, data.subjectId),
            eq(subjectEnrollments.semester, data.semester)
          )
        )
        .returning();

      if (updated.length === 0) {
        results.notFound++;
      } else {
        results.successful++;
      }
    } catch (error) {
      results.failed++;
      results.errors.push(
        `Failed to drop student ${studentId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return results;
}

/**
 * Generate enrollment report for subject
 */
export async function generateEnrollmentReport(params: {
  subjectId: string;
  semester: number;
  academicYear: string;
}) {
  const db = await getDatabase();

  const enrollments = await db
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
        eq(subjectEnrollments.subjectId, params.subjectId),
        eq(subjectEnrollments.semester, params.semester),
        eq(subjectEnrollments.academicYear, params.academicYear)
      )
    );

  return {
    subjectId: params.subjectId,
    semester: params.semester,
    academicYear: params.academicYear,
    statistics: {
      totalEnrolled: enrollments.filter((e) => e.enrollment.enrollmentStatus === "REGISTERED").length,
      dropped: enrollments.filter((e) => e.enrollment.enrollmentStatus === "DROPPED").length,
      total: enrollments.length,
    },
    enrolledStudents: enrollments
      .filter((e) => e.enrollment.enrollmentStatus === "REGISTERED")
      .map((e) => ({
        studentId: e.student.id,
        name: e.user.name,
        enrollmentNumber: e.student.enrollmentNumber,
        program: e.student.program,
        section: e.student.section,
        enrollmentDate: e.enrollment.enrollmentDate,
      })),
    droppedStudents: enrollments
      .filter((e) => e.enrollment.enrollmentStatus === "DROPPED")
      .map((e) => ({
        studentId: e.student.id,
        name: e.user.name,
        enrollmentNumber: e.student.enrollmentNumber,
      })),
  };
}

// ============================================================================
// BULK PERFORMANCE OPERATIONS
// ============================================================================

/**
 * Generate class performance report
 */
export async function generateClassPerformanceReport(params: {
  subjectId: string;
  semester: number;
}) {
  const db = await getDatabase();

  const enrollments = await db
    .select({ studentId: subjectEnrollments.studentId })
    .from(subjectEnrollments)
    .where(
      and(
        eq(subjectEnrollments.subjectId, params.subjectId),
        eq(subjectEnrollments.semester, params.semester),
        eq(subjectEnrollments.enrollmentStatus, "REGISTERED")
      )
    );

  const report = [];

  for (const enrollment of enrollments) {
    // Get attendance
    const attendance = await db
      .select()
      .from(subjectAttendance)
      .where(
        and(
          eq(subjectAttendance.studentId, enrollment.studentId),
          eq(subjectAttendance.subjectId, params.subjectId)
        )
      );

    const attendancePercentage =
      attendance.length > 0
        ? (
            (attendance.filter((a) => a.status === "PRESENT").length / attendance.length) *
            100
          ).toFixed(2)
        : 0;

    // Get assignment submissions
    const submissions = await db
      .select()
      .from(assignmentSubmissions)
      .innerJoin(assignments, eq(assignmentSubmissions.assignmentId, assignments.id))
      .where(
        and(
          eq(assignmentSubmissions.studentId, enrollment.studentId),
          eq(assignments.subjectId, params.subjectId)
        )
      );

    const avgMarks =
      submissions.filter((s) => s.assignment_submissions.marks).length > 0
        ? (
            submissions
              .filter((s) => s.assignment_submissions.marks)
              .reduce((sum, s) => sum + parseInt(s.assignment_submissions.marks || "0"), 0) /
            submissions.filter((s) => s.assignment_submissions.marks).length
          ).toFixed(2)
        : "N/A";

    report.push({
      studentId: enrollment.studentId,
      attendance: attendancePercentage,
      submittedAssignments: submissions.length,
      averageMarks: avgMarks,
      overallStatus:
        parseFloat(attendancePercentage as string) < 75 || (typeof avgMarks === "string" && avgMarks !== "N/A" && parseFloat(avgMarks) < 50)
          ? "⚠️ At Risk"
          : "✅ Good",
    });
  }

  return report;
}
