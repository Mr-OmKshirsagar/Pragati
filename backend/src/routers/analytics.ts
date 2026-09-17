/**
 * Analytics Router
 * Comprehensive dashboards and reporting endpoints
 */

import { z } from "zod";
import { router, facultyProcedure, adminProcedure } from "../_core/trpc";
import * as internshipAnalytics from "../services/internshipAnalyticsService";
import * as bulkOps from "../services/bulkOperationsService";

export const analyticsRouter = router({
  /**
   * FACULTY/MENTOR ANALYTICS
   */

  /**
   * Get student internship profile
   */
  getStudentInternshipProfile: facultyProcedure
    .input(z.object({ studentId: z.string().uuid() }))
    .query(async ({ input }) => {
      return internshipAnalytics.getStudentInternshipProfile(input.studentId);
    }),

  /**
   * Get internship performance metrics
   */
  getInternshipPerformanceMetrics: facultyProcedure
    .input(z.object({ internshipId: z.string().uuid() }))
    .query(async ({ input }) => {
      return internshipAnalytics.getInternshipPerformanceMetrics(input.internshipId);
    }),

  /**
   * Get internship quality scorecard
   */
  getInternshipQualityScorecard: facultyProcedure
    .input(z.object({ internshipId: z.string().uuid() }))
    .query(async ({ input }) => {
      return internshipAnalytics.getInternshipQualityScorecard(input.internshipId);
    }),

  /**
   * Generate class attendance report
   */
  generateAttendanceReport: facultyProcedure
    .input(
      z.object({
        subjectId: z.string().uuid(),
        semester: z.number(),
      })
    )
    .query(async ({ input }) => {
      return bulkOps.generateAttendanceReport(input);
    }),

  /**
   * Generate assignment grading analytics
   */
  generateGradingAnalytics: facultyProcedure
    .input(z.object({ assignmentId: z.string().uuid() }))
    .query(async ({ input }) => {
      return bulkOps.generateGradingAnalytics(input.assignmentId);
    }),

  /**
   * Generate class performance report
   */
  generateClassPerformanceReport: facultyProcedure
    .input(
      z.object({
        subjectId: z.string().uuid(),
        semester: z.number(),
      })
    )
    .query(async ({ input }) => {
      return bulkOps.generateClassPerformanceReport(input);
    }),

  /**
   * ADMIN ANALYTICS & DASHBOARDS
   */

  /**
   * Get department internship analytics (HOD Dashboard)
   */
  getDepartmentInternshipAnalytics: adminProcedure
    .input(z.object({ departmentId: z.string().uuid() }))
    .query(async ({ input }) => {
      return internshipAnalytics.getDepartmentInternshipAnalytics(input.departmentId);
    }),

  /**
   * Get semester-wise internship trends
   */
  getSemesterInternshipTrends: adminProcedure
    .input(z.object({ departmentId: z.string().uuid() }))
    .query(async ({ input }) => {
      return internshipAnalytics.getSemesterInternshipTrends(input.departmentId);
    }),

  /**
   * Get cohort internship analysis
   */
  getCohortInternshipAnalysis: adminProcedure
    .input(
      z.object({
        departmentId: z.string().uuid(),
        admissionYear: z.number(),
      })
    )
    .query(async ({ input }) => {
      return internshipAnalytics.getCohortInternshipAnalysis(
        input.departmentId,
        input.admissionYear
      );
    }),

  /**
   * Get internship trends over time
   */
  getInternshipTrendsOverTime: adminProcedure
    .input(
      z.object({
        departmentId: z.string().uuid(),
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ input }) => {
      return internshipAnalytics.getInternshipTrendsOverTime(
        input.departmentId,
        input.startDate,
        input.endDate
      );
    }),

  /**
   * Generate enrollment report for subject
   */
  generateEnrollmentReport: adminProcedure
    .input(
      z.object({
        subjectId: z.string().uuid(),
        semester: z.number(),
        academicYear: z.string(),
      })
    )
    .query(async ({ input }) => {
      return bulkOps.generateEnrollmentReport(input);
    }),

  /**
   * BULK OPERATIONS
   */

  /**
   * Bulk import attendance from CSV
   */
  bulkImportAttendance: adminProcedure
    .input(
      z.object({
        subjectId: z.string().uuid(),
        recordedBy: z.string().uuid(),
        attendanceRecords: z.array(
          z.object({
            studentId: z.string().uuid(),
            date: z.string(),
            status: z.enum(["PRESENT", "ABSENT", "LATE"]),
            notes: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      return bulkOps.bulkImportAttendance(input);
    }),

  /**
   * Bulk mark attendance
   */
  bulkMarkAttendance: adminProcedure
    .input(
      z.object({
        subjectId: z.string().uuid(),
        date: z.string(),
        recordedBy: z.string().uuid(),
        markAll: z.array(
          z.object({
            status: z.enum(["PRESENT", "ABSENT", "LATE"]),
            studentIds: z.array(z.string().uuid()),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      return bulkOps.bulkMarkAttendance(input);
    }),

  /**
   * Bulk grade assignments
   */
  bulkGradeAssignments: adminProcedure
    .input(
      z.object({
        assignmentId: z.string().uuid(),
        grades: z.array(
          z.object({
            submissionId: z.string().uuid(),
            marks: z.number().min(0).max(100),
            feedback: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      return bulkOps.bulkGradeAssignments(input);
    }),

  /**
   * Bulk provide feedback
   */
  bulkProvideFeedback: adminProcedure
    .input(
      z.object({
        submissionIds: z.array(z.string().uuid()),
        feedbackTemplate: z.string(),
        includeMarks: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return bulkOps.bulkProvideFeedback(input);
    }),

  /**
   * Bulk enroll students
   */
  bulkEnrollStudents: adminProcedure
    .input(
      z.object({
        studentIds: z.array(z.string().uuid()),
        subjectId: z.string().uuid(),
        semester: z.number(),
        academicYear: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return bulkOps.bulkEnrollStudents(input);
    }),

  /**
   * Bulk drop students
   */
  bulkDropStudents: adminProcedure
    .input(
      z.object({
        studentIds: z.array(z.string().uuid()),
        subjectId: z.string().uuid(),
        semester: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return bulkOps.bulkDropStudents(input);
    }),
});
