import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { hodProcedure, router } from "../_core/trpc";
import * as approvalWorkflowService from "../services/approvalWorkflowService";

export const hodRouter = router({
  // 1. List pending student enrollment requests for HOD's department
  getPendingStudentRequests: hodProcedure
    .input(
      z
        .object({
          departmentId: z.string().uuid().optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const deptId = input?.departmentId || ctx.user.departmentId;
      if (!deptId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Department ID is required to fetch pending student requests.",
        });
      }

      return approvalWorkflowService.getPendingStudentRequests({
        institutionId: ctx.user.institutionId,
        departmentId: deptId,
      });
    }),

  // 2. Single or Bulk approve/reject student enrollments
  processStudentEnrollments: hodProcedure
    .input(
      z.object({
        requestIds: z.array(z.string().uuid()).min(1),
        action: z.enum(["APPROVE", "REJECT"]),
        rejectionReason: z.string().optional(),
        departmentId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const deptId = input.departmentId || ctx.user.departmentId;
      if (!deptId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Department ID is required to process student requests.",
        });
      }

      return approvalWorkflowService.processStudentEnrollments({
        institutionId: ctx.user.institutionId,
        departmentId: deptId,
        reviewedBy: ctx.user.id,
        requestIds: input.requestIds,
        action: input.action,
        reviewNotes: input.rejectionReason,
      });
    }),

  // 3. Request Faculty Account Creation or Deletion (HOD -> Admin)
  requestFaculty: hodProcedure
    .input(
      z.object({
        requestType: z.enum(["CREATE", "DELETE"]),
        targetUserId: z.string().uuid().optional(),
        departmentId: z.string().uuid().optional(),
        facultyData: z
          .object({
            name: z.string().min(2),
            email: z.string().email(),
            phone: z.string().optional(),
            facultyId: z.string().optional(),
            designation: z.string().min(2),
            specialization: z.string().optional(),
            highestQualification: z.string().optional(),
            classTeacherAllocation: z.string().optional(),
            subjectAssignments: z.array(z.string()).optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const deptId = input.departmentId || ctx.user.departmentId;
      if (!deptId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Department ID is required to request faculty accounts.",
        });
      }

      if (input.requestType === "CREATE" && !input.facultyData) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "facultyData is required for CREATE request type.",
        });
      }

      if (input.requestType === "DELETE" && !input.targetUserId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "targetUserId is required for DELETE request type.",
        });
      }

      return approvalWorkflowService.submitFacultyRequest({
        institutionId: ctx.user.institutionId,
        departmentId: deptId,
        submittedBy: ctx.user.id,
        requestType: input.requestType,
        targetUserId: input.targetUserId,
        facultyData: input.facultyData,
      });
    }),

  // 4. Assign Class Teacher to class
  assignClassTeacher: hodProcedure
    .input(
      z.object({
        classId: z.string().uuid(),
        facultyId: z.string().uuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return approvalWorkflowService.assignClassTeacher({
        institutionId: ctx.user.institutionId,
        classId: input.classId,
        facultyId: input.facultyId,
      });
    }),

  // 5. Assign Subject Teacher to class & subject
  assignSubjectTeacher: hodProcedure
    .input(
      z.object({
        subjectId: z.string().uuid(),
        facultyId: z.string().uuid(),
        classId: z.string().uuid().optional(),
        departmentId: z.string().uuid().optional(),
        semester: z.number().int().optional(),
        academicYear: z.string().optional(),
        role: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const deptId = input.departmentId || ctx.user.departmentId;
      if (!deptId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Department ID is required.",
        });
      }

      return approvalWorkflowService.assignSubjectTeacher({
        institutionId: ctx.user.institutionId,
        departmentId: deptId,
        subjectId: input.subjectId,
        facultyId: input.facultyId,
        classId: input.classId,
        semester: input.semester,
        academicYear: input.academicYear,
        role: input.role,
      });
    }),

  // 6. List classes for department
  listClasses: hodProcedure
    .input(
      z
        .object({
          departmentId: z.string().uuid().optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const deptId = input?.departmentId || ctx.user.departmentId;
      if (!deptId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Department ID is required.",
        });
      }

      return approvalWorkflowService.listClasses({
        institutionId: ctx.user.institutionId,
        departmentId: deptId,
      });
    }),

  // 7. Create class allocation
  createClass: hodProcedure
    .input(
      z.object({
        className: z.string().min(2),
        academicYear: z.string().min(4),
        semester: z.number().int().min(1).max(10),
        departmentId: z.string().uuid().optional(),
        classTeacherId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const deptId = input.departmentId || ctx.user.departmentId;
      if (!deptId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Department ID is required.",
        });
      }

      return approvalWorkflowService.createClassAllocation({
        institutionId: ctx.user.institutionId,
        departmentId: deptId,
        className: input.className,
        academicYear: input.academicYear,
        semester: input.semester,
        classTeacherId: input.classTeacherId,
      });
    }),
});
