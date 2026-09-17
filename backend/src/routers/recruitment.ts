import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  protectedProcedure,
  publicProcedure,
  router,
  studentProcedure,
  tnpProcedure,
} from "../_core/trpc";
import * as applicationService from "../services/applicationService";

export const recruitmentRouter = router({
  // 1. Get all active published recruitment drives
  getActiveDrives: protectedProcedure.query(async () => {
    try {
      return await applicationService.getPublishedDrives();
    } catch (err: any) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: err.message || "Failed to retrieve published drives.",
      });
    }
  }),

  // 2. Student 1-Click Application with strict server-side eligibility re-evaluation
  applyToDrive: studentProcedure
    .input(z.object({ driveId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      try {
        return await applicationService.submitApplication({
          studentId: ctx.user.studentProfile.id,
          driveId: input.driveId,
          userId: ctx.user.id,
        });
      } catch (err: any) {
        const message = err.message || "Failed to submit application.";
        if (message.includes("RULE_VIOLATION")) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message,
          });
        }
        if (message.includes("DUPLICATE_APPLICATION")) {
          throw new TRPCError({
            code: "CONFLICT",
            message,
          });
        }
        throw new TRPCError({
          code: "BAD_REQUEST",
          message,
        });
      }
    }),

  // 3. Student query: view own submitted applications
  getMyApplications: studentProcedure.query(async ({ ctx }) => {
    try {
      return await applicationService.getStudentApplications(
        ctx.user.studentProfile.id
      );
    } catch (err: any) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: err.message || "Failed to fetch student applications.",
      });
    }
  }),

  // 4. T&P Coordinator query: view all applicants for a specific recruitment drive
  getDriveApplicants: tnpProcedure
    .input(z.object({ driveId: z.string().uuid() }))
    .query(async ({ input }) => {
      try {
        return await applicationService.getDriveApplicants(input.driveId);
      } catch (err: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err.message || "Failed to fetch drive applicants.",
        });
      }
    }),

  // 5. T&P Coordinator mutation: transition candidate recruitment stage
  updateApplicantStatus: tnpProcedure
    .input(
      z.object({
        applicationId: z.string().uuid(),
        status: z.enum([
          "APPLIED",
          "SHORTLISTED",
          "INTERVIEWING",
          "OFFERED",
          "REJECTED",
        ]),
        remarks: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await applicationService.updateApplicationStatus({
          applicationId: input.applicationId,
          status: input.status,
          remarks: input.remarks,
          updatedByUserId: ctx.user.id,
          institutionId: ctx.user.institutionId,
        });
      } catch (err: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err.message || "Failed to update application status.",
        });
      }
    }),
});
