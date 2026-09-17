import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router, studentProcedure, tnpProcedure } from "../_core/trpc";
import * as tnpService from "../services/tnpService";

export const placementRouter = router({
  // 1. Student query: Check own eligibility for a specific drive with transparent reasons
  checkMyEligibility: studentProcedure
    .input(z.object({ driveId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      try {
        return await tnpService.checkStudentEligibility(
          ctx.user.studentProfile.id,
          input.driveId
        );
      } catch (err: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err.message || "Failed to evaluate eligibility.",
        });
      }
    }),

  // 2. Protected query: List all recruitment drives with active rules and evaluation summaries
  getDrives: protectedProcedure.query(async () => {
    try {
      return await tnpService.listRecruitmentDrives();
    } catch (err: any) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: err.message || "Failed to retrieve recruitment drives.",
      });
    }
  }),

  // 3. Protected query: Get single recruitment drive by ID
  getDriveById: protectedProcedure
    .input(z.object({ driveId: z.string().uuid() }))
    .query(async ({ input }) => {
      try {
        return await tnpService.getDriveWithRule(input.driveId);
      } catch (err: any) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: err.message || "Recruitment drive not found.",
        });
      }
    }),

  // 4. Protected query: Get or lazily initialize the standard ABC Technologies benchmark drive
  getBenchmarkDrive: protectedProcedure.query(async ({ ctx }) => {
    try {
      const drive = await tnpService.getOrCreateBenchmarkDrive(
        ctx.user.institutionId,
        ctx.user.id
      );
      return await tnpService.getDriveWithRule(drive.id);
    } catch (err: any) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: err.message || "Failed to retrieve benchmark drive.",
      });
    }
  }),

  // 5. TNP Procedure: Evaluate all student candidates for a drive in bulk
  evaluateRoster: tnpProcedure
    .input(z.object({ driveId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      try {
        return await tnpService.evaluateAllCandidatesForDrive(input.driveId);
      } catch (err: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err.message || "Failed to evaluate candidate roster.",
        });
      }
    }),

  // 6. TNP Procedure: Save or update Placement Rule AST for a drive
  saveRule: tnpProcedure
    .input(
      z.object({
        driveId: z.string().uuid(),
        rule: z.object({
          operator: z.enum(["AND", "OR"]),
          conditions: z.array(z.any()),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await tnpService.savePlacementRule(
          input.driveId,
          input.rule as any,
          ctx.user.id
        );
      } catch (err: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err.message || "Failed to save placement rule.",
        });
      }
    }),
});
