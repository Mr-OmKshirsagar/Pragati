import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router, studentProcedure } from "../_core/trpc";
import * as evidenceService from "../services/evidenceService";

export const evidenceRouter = router({
  // 1. Register evidence metadata for a file already staged or uploaded
  registerEvidence: studentProcedure
    .input(
      z.object({
        filename: z.string().min(1),
        storagePath: z.string().min(1),
        mimeType: z.enum(["application/pdf", "image/png", "image/jpeg"]),
        fileSize: z.number().min(1).max(10 * 1024 * 1024), // 10MB limit
        sha256Hash: z.string().length(64),
        achievementId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await evidenceService.registerEvidenceDocument({
          studentId: ctx.user.studentProfile.id,
          achievementId: input.achievementId,
          filename: input.filename,
          storagePath: input.storagePath,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
          sha256Hash: input.sha256Hash,
        });
      } catch (err: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err.message || "Failed to register evidence document.",
        });
      }
    }),

  // 2. Upload file payload with dual-layer SHA-256 validation and register in vault
  uploadAndRegister: studentProcedure
    .input(
      z.object({
        filename: z.string().min(1),
        mimeType: z.enum(["application/pdf", "image/png", "image/jpeg"]),
        base64Data: z.string().min(1),
        clientHash: z.string().length(64).optional(),
        achievementId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const fileBuffer = Buffer.from(input.base64Data, "base64");

        return await evidenceService.uploadAndRegisterEvidence({
          institutionId: ctx.user.institutionId || "NIT-001",
          studentId: ctx.user.studentProfile.id,
          achievementId: input.achievementId,
          filename: input.filename,
          fileBuffer,
          mimeType: input.mimeType,
          clientHash: input.clientHash,
        });
      } catch (err: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err.message || "Failed to upload and register evidence.",
        });
      }
    }),

  // 3. Retrieve student's evidence documents with download URLs (Anti-IDOR)
  getMyEvidence: studentProcedure.query(async ({ ctx }) => {
    return evidenceService.getStudentEvidence(ctx.user.studentProfile.id);
  }),

  // 4. Verify integrity of an existing evidence document
  verifyIntegrity: studentProcedure
    .input(
      z.object({
        evidenceId: z.string().uuid(),
        base64Data: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // Verify document belongs to student (Anti-IDOR)
        const doc = await evidenceService.getEvidenceById(input.evidenceId);
        if (doc.studentId !== ctx.user.studentProfile.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not authorized to verify this evidence document.",
          });
        }

        const buffer = input.base64Data
          ? Buffer.from(input.base64Data, "base64")
          : undefined;

        return await evidenceService.verifyEvidenceIntegrity(
          input.evidenceId,
          buffer
        );
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err.message || "Integrity verification failed.",
        });
      }
    }),

  // 5. Interactive Tamper Demonstration for hackathon judges & evaluators
  simulateTamper: publicProcedure
    .input(
      z
        .object({
          originalText: z.string().optional(),
          tamperedText: z.string().optional(),
        })
        .optional()
    )
    .mutation(async ({ input }) => {
      return evidenceService.simulateTamperDemo(input);
    }),
});
