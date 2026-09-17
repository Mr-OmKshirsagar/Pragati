/**
 * Internship Router
 * Endpoints for students to manage internships and upload evidence
 * Faculty/HOD endpoints for verification and oversight
 */

import { z } from "zod";
import { router, studentProcedure, facultyProcedure, adminProcedure } from "../_core/trpc";
import * as internshipService from "../services/internshipService";

export const internshipRouter = router({
  /**
   * STUDENT ENDPOINTS
   */

  /**
   * Create new internship record
   */
  createInternship: studentProcedure
    .input(
      z.object({
        companyName: z.string().min(2).max(100),
        role: z.string().min(2).max(100),
        startDate: z.date(),
        endDate: z.date().optional(),
        stipend: z.number().positive().optional(),
        supervisorName: z.string().max(100).optional(),
        supervisorEmail: z.string().email().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const studentId = ctx.user.studentProfile?.id;
      if (!studentId) throw new Error("Student profile not found");

      return internshipService.createInternship({
        studentId,
        companyName: input.companyName,
        role: input.role,
        startDate: input.startDate,
        endDate: input.endDate,
        stipend: input.stipend,
        supervisorName: input.supervisorName,
        supervisorEmail: input.supervisorEmail,
      });
    }),

  /**
   * Get all internships for current student
   */
  getMyInternships: studentProcedure.query(async ({ ctx }) => {
    const studentId = ctx.user.studentProfile?.id;
    if (!studentId) throw new Error("Student profile not found");

    return internshipService.getStudentInternships(studentId);
  }),

  /**
   * Get specific internship details
   */
  getInternship: studentProcedure
    .input(z.object({ internshipId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const studentId = ctx.user.studentProfile?.id;
      if (!studentId) throw new Error("Student profile not found");

      const internship = await internshipService.getInternshipById(input.internshipId);
      if (!internship || internship.studentId !== studentId) {
        throw new Error("Internship not found or unauthorized access");
      }

      return internship;
    }),

  /**
   * Upload internship evidence (offer letter, completion cert, etc.)
   */
  uploadEvidence: studentProcedure
    .input(
      z.object({
        internshipId: z.string().uuid(),
        evidenceType: z.enum([
          "OFFER_LETTER",
          "CHECK_IN",
          "COMPLETION_CERTIFICATE",
          "INTERNSHIP_REPORT",
          "SUPERVISOR_CONFIRMATION",
          "SKILL_CERTIFICATE",
        ]),
        filename: z.string().min(1).max(255),
        fileBuffer: z.instanceof(Buffer),
        mimeType: z.enum(["application/pdf", "image/png", "image/jpeg"]),
        clientHash: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const studentId = ctx.user.studentProfile?.id;
      if (!studentId) throw new Error("Student profile not found");

      // Verify student owns this internship
      const internship = await internshipService.getInternshipById(input.internshipId);
      if (!internship || internship.studentId !== studentId) {
        throw new Error("Internship not found or unauthorized access");
      }

      const institutionId = ctx.user.institutionId;
      if (!institutionId) throw new Error("Institution ID not found");

      return internshipService.uploadInternshipEvidence({
        institutionId,
        studentId,
        internshipId: input.internshipId,
        evidenceType: input.evidenceType,
        filename: input.filename,
        fileBuffer: input.fileBuffer,
        mimeType: input.mimeType,
        clientHash: input.clientHash,
      });
    }),

  /**
   * Get all evidence uploaded for an internship
   */
  getInternshipEvidence: studentProcedure
    .input(z.object({ internshipId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const studentId = ctx.user.studentProfile?.id;
      if (!studentId) throw new Error("Student profile not found");

      // Verify student owns this internship
      const internship = await internshipService.getInternshipById(input.internshipId);
      if (!internship || internship.studentId !== studentId) {
        throw new Error("Internship not found or unauthorized access");
      }

      return internshipService.getInternshipEvidence(input.internshipId);
    }),

  /**
   * Get evidence by type (e.g., just OFFER_LETTER)
   */
  getEvidenceByType: studentProcedure
    .input(
      z.object({
        internshipId: z.string().uuid(),
        evidenceType: z.enum([
          "OFFER_LETTER",
          "CHECK_IN",
          "COMPLETION_CERTIFICATE",
          "INTERNSHIP_REPORT",
          "SUPERVISOR_CONFIRMATION",
          "SKILL_CERTIFICATE",
        ]),
      })
    )
    .query(async ({ input, ctx }) => {
      const studentId = ctx.user.studentProfile?.id;
      if (!studentId) throw new Error("Student profile not found");

      // Verify student owns this internship
      const internship = await internshipService.getInternshipById(input.internshipId);
      if (!internship || internship.studentId !== studentId) {
        throw new Error("Internship not found or unauthorized access");
      }

      return internshipService.getInternshipEvidenceByType(
        input.internshipId,
        input.evidenceType
      );
    }),

  /**
   * Delete evidence from internship
   */
  deleteEvidence: studentProcedure
    .input(
      z.object({
        internshipId: z.string().uuid(),
        evidenceId: z.string().uuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const studentId = ctx.user.studentProfile?.id;
      if (!studentId) throw new Error("Student profile not found");

      // Verify student owns this internship
      const internship = await internshipService.getInternshipById(input.internshipId);
      if (!internship || internship.studentId !== studentId) {
        throw new Error("Internship not found or unauthorized access");
      }

      return internshipService.deleteInternshipEvidence(input.evidenceId);
    }),

  /**
   * Record a check-in (milestone/weekly update)
   */
  recordCheckIn: studentProcedure
    .input(
      z.object({
        internshipId: z.string().uuid(),
        checkInDate: z.date(),
        summary: z.string().min(10).max(1000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const studentId = ctx.user.studentProfile?.id;
      if (!studentId) throw new Error("Student profile not found");

      // Verify student owns this internship
      const internship = await internshipService.getInternshipById(input.internshipId);
      if (!internship || internship.studentId !== studentId) {
        throw new Error("Internship not found or unauthorized access");
      }

      return internshipService.recordCheckIn({
        internshipId: input.internshipId,
        studentId,
        checkInDate: input.checkInDate,
        summary: input.summary,
      });
    }),

  /**
   * Get all check-ins for an internship
   */
  getCheckIns: studentProcedure
    .input(z.object({ internshipId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const studentId = ctx.user.studentProfile?.id;
      if (!studentId) throw new Error("Student profile not found");

      // Verify student owns this internship
      const internship = await internshipService.getInternshipById(input.internshipId);
      if (!internship || internship.studentId !== studentId) {
        throw new Error("Internship not found or unauthorized access");
      }

      return internshipService.getInternshipCheckIns(input.internshipId);
    }),

  /**
   * Update a check-in record
   */
  updateCheckIn: studentProcedure
    .input(
      z.object({
        internshipId: z.string().uuid(),
        checkInId: z.string().uuid(),
        summary: z.string().min(10).max(1000).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const studentId = ctx.user.studentProfile?.id;
      if (!studentId) throw new Error("Student profile not found");

      // Verify student owns this internship
      const internship = await internshipService.getInternshipById(input.internshipId);
      if (!internship || internship.studentId !== studentId) {
        throw new Error("Internship not found or unauthorized access");
      }

      return internshipService.updateCheckIn(input.checkInId, {
        summary: input.summary,
      });
    }),

  /**
   * Submit internship for faculty verification
   */
  submitForVerification: studentProcedure
    .input(z.object({ internshipId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const studentId = ctx.user.studentProfile?.id;
      if (!studentId) throw new Error("Student profile not found");

      // Verify student owns this internship
      const internship = await internshipService.getInternshipById(input.internshipId);
      if (!internship || internship.studentId !== studentId) {
        throw new Error("Internship not found or unauthorized access");
      }

      return internshipService.submitInternshipForVerification(input.internshipId);
    }),

  /**
   * Get internship summary for student
   */
  getMyInternshipSummary: studentProcedure.query(async ({ ctx }) => {
    const studentId = ctx.user.studentProfile?.id;
    if (!studentId) throw new Error("Student profile not found");

    return internshipService.getInternshipSummary(studentId);
  }),

  /**
   * FACULTY ENDPOINTS
   */

  /**
   * View all internships in assigned ward
   */
  getWardInternships: facultyProcedure
    .input(z.object({ studentId: z.string().uuid() }).optional())
    .query(async ({ input, ctx }) => {
      // For now, return department-wide internships
      // TODO: Implement assigned ward filtering when faculty-ward system is ready
      const departmentId = ctx.user.departmentId;
      if (!departmentId) throw new Error("Department not found");

      if (input?.studentId) {
        // Get specific student's internships
        return internshipService.getStudentInternships(input.studentId);
      }

      // Get all department internships
      return internshipService.getDepartmentInternships(departmentId);
    }),

  /**
   * Verify internship (faculty action)
   */
  verifyInternship: facultyProcedure
    .input(
      z.object({
        internshipId: z.string().uuid(),
        status: z.enum(["INSTITUTION_VERIFIED", "REJECTED"]),
        notes: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return internshipService.verifyInternship({
        internshipId: input.internshipId,
        verifierUserId: ctx.user.id,
        status: input.status,
        notes: input.notes,
      });
    }),

  /**
   * Get verification status of internship
   */
  getVerificationStatus: facultyProcedure
    .input(z.object({ internshipId: z.string().uuid() }))
    .query(async ({ input }) => {
      return internshipService.getInternshipVerification(input.internshipId);
    }),

  /**
   * ADMIN ENDPOINTS
   */

  /**
   * Get department internship statistics (HOD dashboard)
   */
  getDepartmentStats: adminProcedure
    .input(z.object({ departmentId: z.string().uuid() }))
    .query(async ({ input }) => {
      return internshipService.getDepartmentInternshipStats(input.departmentId);
    }),

  /**
   * Update internship status (admin)
   */
  updateInternshipStatus: adminProcedure
    .input(
      z.object({
        internshipId: z.string().uuid(),
        status: z.enum(["APPLIED", "OFFERED", "IN_PROGRESS", "COMPLETED", "TERMINATED"]),
      })
    )
    .mutation(async ({ input }) => {
      return internshipService.updateInternshipStatus(input.internshipId, input.status);
    }),
});
