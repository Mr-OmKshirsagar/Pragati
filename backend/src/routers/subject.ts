/**
 * Subject Router
 * Endpoints for teachers to track students in their subjects
 * Includes attendance, assignments, grades, and announcements
 */

import { z } from "zod";
import { router, facultyProcedure, studentProcedure, adminProcedure } from "../_core/trpc";
import * as subjectService from "../services/subjectService";

export const subjectRouter = router({
  /**
   * FACULTY ENDPOINTS
   */

  /**
   * Get all subjects assigned to current faculty member
   */
  getMySubjects: facultyProcedure
    .input(
      z.object({
        semester: z.number().optional(),
        academicYear: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      return subjectService.getFacultySubjects(
        ctx.user.id,
        input.semester,
        input.academicYear
      );
    }),

  /**
   * Get all students enrolled in a subject (for faculty)
   */
  getSubjectStudents: facultyProcedure
    .input(
      z.object({
        subjectId: z.string().uuid(),
        semester: z.number(),
        academicYear: z.string(),
      })
    )
    .query(async ({ input }) => {
      // TODO: Validate faculty teaches this subject
      return subjectService.getSubjectEnrolledStudents(
        input.subjectId,
        input.semester,
        input.academicYear
      );
    }),

  /**
   * Record attendance for a student
   */
  recordAttendance: facultyProcedure
    .input(
      z.object({
        studentId: z.string().uuid(),
        subjectId: z.string().uuid(),
        date: z.date(),
        status: z.enum(["PRESENT", "ABSENT", "LATE"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: Validate faculty teaches this subject
      return subjectService.recordAttendance({
        studentId: input.studentId,
        subjectId: input.subjectId,
        date: input.date,
        status: input.status,
        recordedBy: ctx.user.id,
        notes: input.notes,
      });
    }),

  /**
   * Bulk record attendance for multiple students
   */
  recordBulkAttendance: facultyProcedure
    .input(
      z.object({
        subjectId: z.string().uuid(),
        date: z.date(),
        records: z.array(
          z.object({
            studentId: z.string().uuid(),
            status: z.enum(["PRESENT", "ABSENT", "LATE"]),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: Validate faculty teaches this subject
      const results = await Promise.all(
        input.records.map((record) =>
          subjectService.recordAttendance({
            studentId: record.studentId,
            subjectId: input.subjectId,
            date: input.date,
            status: record.status,
            recordedBy: ctx.user.id,
          })
        )
      );

      return {
        success: true,
        count: results.length,
        message: `Attendance recorded for ${results.length} students`,
      };
    }),

  /**
   * Create assignment for a subject
   */
  createAssignment: facultyProcedure
    .input(
      z.object({
        subjectId: z.string().uuid(),
        title: z.string().min(5).max(200),
        description: z.string().min(10).max(2000),
        maxMarks: z.number().default(100),
        dueDate: z.date(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: Validate faculty teaches this subject
      return subjectService.createAssignment({
        subjectId: input.subjectId,
        facultyId: ctx.user.id,
        title: input.title,
        description: input.description,
        maxMarks: input.maxMarks,
        dueDate: input.dueDate,
      });
    }),

  /**
   * Get assignments for a subject
   */
  getSubjectAssignments: facultyProcedure
    .input(z.object({ subjectId: z.string().uuid() }))
    .query(async ({ input }) => {
      return subjectService.getSubjectAssignments(input.subjectId);
    }),

  /**
   * Grade assignment submission
   */
  gradeAssignment: facultyProcedure
    .input(
      z.object({
        submissionId: z.string(),
        marks: z.number().min(0).max(100),
        feedback: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return subjectService.gradeAssignmentSubmission(
        input.submissionId,
        input.marks,
        input.feedback
      );
    }),

  /**
   * Post announcement to subject
   */
  postAnnouncement: facultyProcedure
    .input(
      z.object({
        subjectId: z.string().uuid(),
        title: z.string().min(5).max(200),
        content: z.string().min(10).max(2000),
        priority: z.enum(["LOW", "NORMAL", "HIGH"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return subjectService.postAnnouncement({
        subjectId: input.subjectId,
        facultyId: ctx.user.id,
        title: input.title,
        content: input.content,
        priority: input.priority || "NORMAL",
      });
    }),

  /**
   * Get subject announcements
   */
  getAnnouncements: facultyProcedure
    .input(z.object({ subjectId: z.string().uuid() }))
    .query(async ({ input }) => {
      return subjectService.getSubjectAnnouncements(input.subjectId);
    }),

  /**
   * Get subject analytics (student performance)
   */
  getSubjectAnalytics: facultyProcedure
    .input(
      z.object({
        subjectId: z.string().uuid(),
        semester: z.number(),
      })
    )
    .query(async ({ input }) => {
      return subjectService.getSubjectAnalytics(input.subjectId, input.semester);
    }),

  /**
   * Get at-risk students in subject
   */
  getAtRiskStudents: facultyProcedure
    .input(
      z.object({
        subjectId: z.string().uuid(),
        semester: z.number(),
        attendanceThreshold: z.number().default(75),
        gradeThreshold: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      return subjectService.getAtRiskStudents(
        input.subjectId,
        input.semester,
        input.attendanceThreshold,
        input.gradeThreshold
      );
    }),

  /**
   * Get all subjects enrolled by current student
   */
  getMySubjectsForStudent: studentProcedure
    .input(
      z.object({
        semester: z.number().optional(),
        academicYear: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Get student profile ID from user context
      const studentId = ctx.user.studentProfile?.id;
      if (!studentId) throw new Error("Student profile not found");

      return subjectService.getStudentEnrolledSubjects(
        studentId,
        input.semester,
        input.academicYear
      );
    }),

  /**
   * Submit assignment (student)
   */
  submitAssignment: studentProcedure
    .input(
      z.object({
        assignmentId: z.string().uuid(),
        submissionText: z.string().optional(),
        filePath: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const studentId = ctx.user.studentProfile?.id;
      if (!studentId) throw new Error("Student profile not found");

      return subjectService.submitAssignment({
        assignmentId: input.assignmentId,
        studentId: studentId,
        submissionText: input.submissionText,
        filePath: input.filePath,
      });
    }),

  /**
   * Get student's assignment submissions
   */
  getMyAssignmentSubmissions: studentProcedure
    .input(z.object({ assignmentId: z.string().uuid().optional() }))
    .query(async ({ input, ctx }) => {
      const studentId = ctx.user.studentProfile?.id;
      if (!studentId) throw new Error("Student profile not found");

      return subjectService.getStudentAssignmentSubmissions(
        studentId,
        input.assignmentId
      );
    }),

  /**
   * Get student's attendance records
   */
  getMyAttendance: studentProcedure
    .input(
      z.object({
        subjectId: z.string().uuid(),
      })
    )
    .query(async ({ input, ctx }) => {
      const studentId = ctx.user.studentProfile?.id;
      if (!studentId) throw new Error("Student profile not found");

      return subjectService.getStudentAttendance(
        studentId,
        input.subjectId
      );
    }),

  /**
   * Get student's attendance percentage
   */
  getMyAttendancePercentage: studentProcedure
    .input(z.object({ subjectId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const studentId = ctx.user.studentProfile?.id;
      if (!studentId) throw new Error("Student profile not found");

      const percentage = await subjectService.getAttendancePercentage(
        studentId,
        input.subjectId
      );

      return { subjectId: input.subjectId, attendancePercentage: percentage };
    }),

  /**
   * ADMIN ENDPOINTS
   */

  /**
   * Assign faculty to subject (admin)
   */
  assignFacultyToSubject: adminProcedure
    .input(
      z.object({
        facultyId: z.string().uuid(),
        subjectId: z.string().uuid(),
        semester: z.number(),
        academicYear: z.string(),
        role: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return subjectService.assignFacultyToSubject({
        facultyId: input.facultyId,
        subjectId: input.subjectId,
        semester: input.semester,
        academicYear: input.academicYear,
        role: input.role,
      });
    }),

  /**
   * Enroll student in subject (admin)
   */
  enrollStudentInSubject: adminProcedure
    .input(
      z.object({
        studentId: z.string().uuid(),
        subjectId: z.string().uuid(),
        semester: z.number(),
        academicYear: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return subjectService.enrollStudentInSubject({
        studentId: input.studentId,
        subjectId: input.subjectId,
        semester: input.semester,
        academicYear: input.academicYear,
      });
    }),

  /**
   * Remove faculty from subject (admin)
   */
  removeFacultyFromSubject: adminProcedure
    .input(
      z.object({
        facultyId: z.string().uuid(),
        subjectId: z.string().uuid(),
        semester: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      return subjectService.removeFacultyFromSubject(
        input.facultyId,
        input.subjectId,
        input.semester
      );
    }),

  /**
   * Drop student from subject (admin)
   */
  dropStudentFromSubject: adminProcedure
    .input(
      z.object({
        studentId: z.string().uuid(),
        subjectId: z.string().uuid(),
        semester: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      return subjectService.dropStudentFromSubject(
        input.studentId,
        input.subjectId,
        input.semester
      );
    }),
});
