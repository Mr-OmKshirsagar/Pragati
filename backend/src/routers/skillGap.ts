import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { facultyProcedure, router, studentProcedure } from "../_core/trpc";
import * as skillGapEngine from "../rules/skillGapEngine";
import * as aiService from "../services/aiService";
import * as assessmentService from "../services/assessmentService";

export const skillGapRouter = router({
  // 1. Get student's open skill gaps (evaluates and syncs with live database)
  getMyGaps: studentProcedure.query(async ({ ctx }) => {
    return skillGapEngine.evaluateAndSyncStudentGaps(
      ctx.user.studentProfile.id
    );
  }),

  // 2. Generate Assistive AI Explanation for a detected skill gap
  explainGap: studentProcedure
    .input(z.object({ skillGapId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const gap = await skillGapEngine.getGapById(input.skillGapId);

      // Anti-IDOR: ensure student can only request explanation for their own gap
      if (gap.studentId !== ctx.user.studentProfile.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to view this skill gap explanation.",
        });
      }

      return aiService.explainSkillGap({
        studentName: ctx.user.name,
        skillName: gap.skillName,
        scoreHistory: gap.reason.score_history,
        backlogSubject: gap.reason.backlog_subject,
      });
    }),

  // 3. Faculty endpoint: view active skill gaps across department
  getDepartmentGaps: facultyProcedure
    .input(z.object({ departmentId: z.string().uuid().optional() }).optional())
    .query(async ({ input, ctx }) => {
      const targetDeptId = input?.departmentId || ctx.user.departmentId;
      if (!targetDeptId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Department ID is required to query department skill gaps.",
        });
      }
      return skillGapEngine.getDepartmentGaps(targetDeptId);
    }),

  // 4. Faculty endpoint: create new assessment mapped to skills
  createAssessment: facultyProcedure
    .input(
      z.object({
        name: z.string().min(3),
        departmentId: z.string().uuid().optional(),
        skillIds: z.array(z.string().uuid()).min(1),
        maxScore: z.number().min(10).max(100).default(100),
        durationMinutes: z.number().min(10).max(240).default(60),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const deptId = input.departmentId || ctx.user.departmentId;
      return assessmentService.createAssessment({
        name: input.name,
        departmentId: deptId,
        skillIds: input.skillIds,
        maxScore: input.maxScore,
        durationMinutes: input.durationMinutes,
      });
    }),
});
