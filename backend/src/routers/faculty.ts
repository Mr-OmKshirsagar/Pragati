import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { facultyProcedure, router } from "../_core/trpc";
import * as interventionService from "../services/interventionService";

export const facultyRouter = router({
  // 1. Get assigned student wards (Teacher-Guardian scope: assignedFacultyId === ctx.user.id)
  getWards: facultyProcedure.query(async ({ ctx }) => {
    return interventionService.getAssignedWards(ctx.user.id);
  }),

  // 2. Schedule structured mentoring intervention for a ward's skill gap
  createIntervention: facultyProcedure
    .input(
      z.object({
        studentId: z.string().uuid(),
        skillGapId: z.string().uuid(),
        type: z
          .enum(["MENTORING", "REMEDIAL_CLASS", "ASSIGNMENT"])
          .default("MENTORING"),
        description: z.string().min(5),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return interventionService.createIntervention({
        assignedBy: ctx.user.id,
        studentId: input.studentId,
        skillGapId: input.skillGapId,
        type: input.type,
        description: input.description,
        startDate: input.startDate,
        endDate: input.endDate,
      });
    }),

  // 3. Log intervention outcome text and update status to COMPLETED or CANCELLED
  recordOutcome: facultyProcedure
    .input(
      z.object({
        interventionId: z.string().uuid(),
        outcome: z.string().min(5),
        status: z.enum(["COMPLETED", "CANCELLED"]),
      })
    )
    .mutation(async ({ input }) => {
      return interventionService.recordOutcome({
        interventionId: input.interventionId,
        outcome: input.outcome,
        status: input.status,
      });
    }),

  // 4. Fetch interventions for a specific student ward
  getWardInterventions: facultyProcedure
    .input(z.object({ studentId: z.string().uuid() }))
    .query(async ({ input }) => {
      return interventionService.getStudentInterventions(input.studentId);
    }),
});
