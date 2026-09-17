import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { facultyProcedure, router } from "../_core/trpc";
import * as approvalWorkflowService from "../services/approvalWorkflowService";
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

  // 5. Tier 1 Student Enrollment: Class Teacher submits student enrollment request to HOD
  submitStudentEnrollment: facultyProcedure
    .input(
      z.object({
        classId: z.string().min(1),
        departmentId: z.string().uuid().optional(),
        studentData: z.object({
          name: z.string().min(2),
          collegeEmail: z.string().email(),
          personalEmail: z.string().email().optional(),
          mobilePhone: z.string().optional(),
          parentPhone: z.string().optional(),
          enrollmentNumber: z.string().min(2),
          program: z.string().min(2),
          batch: z.string().min(2),
          currentSemester: z.number().int().min(1).max(10),
          sectionDivision: z.string().optional(),
          admissionYear: z.number().int().optional(),
          graduationYear: z.number().int().optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const deptId = input.departmentId || ctx.user.departmentId;
      if (!deptId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Department ID is required to submit student enrollment.",
        });
      }

      return approvalWorkflowService.submitStudentEnrollment({
        institutionId: ctx.user.institutionId,
        departmentId: deptId,
        classId: input.classId,
        submittedBy: ctx.user.id,
        studentData: input.studentData,
      });
    }),
});
