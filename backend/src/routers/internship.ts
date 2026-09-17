import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { facultyProcedure, router, studentProcedure } from "../_core/trpc";
import * as internshipService from "../services/internshipService";

export const internshipRouter = router({
  // 1. Student query: active internship with evidence milestones and check-ins
  getMyInternship: studentProcedure.query(async ({ ctx }) => {
    return internshipService.getStudentActiveInternship(
      ctx.user.studentProfile.id
    );
  }),

  // 2. Student mutation: register new internship
  createInternship: studentProcedure
    .input(
      z.object({
        companyName: z.string().min(2),
        role: z.string().min(2),
        startDate: z.string(),
        endDate: z.string().optional(),
        stipend: z.number().optional(),
        supervisorName: z.string().optional(),
        supervisorEmail: z.string().email().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await internshipService.createInternship(
          ctx.user.studentProfile.id,
          input
        );
      } catch (err: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err.message || "Failed to create internship.",
        });
      }
    }),

  // 3. Student mutation: submit bi-weekly progress check-in
  submitCheckin: studentProcedure
    .input(
      z.object({
        internshipId: z.string().uuid(),
        summary: z.string().min(5),
        checkInDate: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await internshipService.addCheckin(
          ctx.user.studentProfile.id,
          input
        );
      } catch (err: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err.message || "Failed to submit check-in.",
        });
      }
    }),

  // 4. Student mutation: link cryptographic evidence document to internship milestone
  linkEvidence: studentProcedure
    .input(
      z.object({
        internshipId: z.string().uuid(),
        evidenceDocumentId: z.string().uuid(),
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
    .mutation(async ({ input, ctx }) => {
      try {
        return await internshipService.linkEvidenceToInternship(
          ctx.user.studentProfile.id,
          input
        );
      } catch (err: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err.message || "Failed to link evidence to internship.",
        });
      }
    }),

  // 5. Faculty query: pending internships awaiting sign-off
  getReviewQueue: facultyProcedure.query(async ({ ctx }) => {
    return internshipService.getFacultyReviewQueue(ctx.user.id);
  }),

  // 6. Faculty mutation: approve or reject internship with audit entry
  verifyInternship: facultyProcedure
    .input(
      z.object({
        internshipId: z.string().uuid(),
        status: z.enum(["INSTITUTION_VERIFIED", "REJECTED"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await internshipService.verifyInternship({
          verifierId: ctx.user.id,
          internshipId: input.internshipId,
          status: input.status,
          notes: input.notes,
        });
      } catch (err: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err.message || "Failed to verify internship.",
        });
      }
    }),
});
