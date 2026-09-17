import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { departments, users } from "../../drizzle/schema";
import { getDb } from "../db";
import { adminProcedure, router } from "../_core/trpc";
import * as approvalWorkflowService from "../services/approvalWorkflowService";

export const adminRouter = router({
  // 1. List pending faculty onboarding & deletion requests for College Admin
  getPendingFacultyRequests: adminProcedure.query(async ({ ctx }) => {
    return approvalWorkflowService.getPendingFacultyRequests({
      institutionId: ctx.user.institutionId,
    });
  }),

  // 2. Single or Bulk approve/reject faculty requests
  processFacultyRequests: adminProcedure
    .input(
      z.object({
        requestIds: z.array(z.string().uuid()).min(1),
        action: z.enum(["APPROVE", "REJECT"]),
        rejectionReason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return approvalWorkflowService.processFacultyRequests({
        institutionId: ctx.user.institutionId,
        reviewedBy: ctx.user.id,
        requestIds: input.requestIds,
        action: input.action,
        reviewNotes: input.rejectionReason,
      });
    }),

  // 3. Reassign Faculty Designation (Promote to HOD, T&P Coordinator, or demote to Faculty)
  reassignFacultyDesignation: adminProcedure
    .input(
      z.object({
        facultyUserId: z.string().uuid(),
        newRole: z.enum(["FACULTY", "HOD", "TNP_COORDINATOR"]),
        departmentId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return approvalWorkflowService.reassignFacultyDesignation({
        institutionId: ctx.user.institutionId,
        facultyUserId: input.facultyUserId,
        newRole: input.newRole,
        departmentId: input.departmentId,
      });
    }),

  // 4. List all departments in the institution
  listDepartments: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });

    return db
      .select()
      .from(departments)
      .where(eq(departments.institutionId, ctx.user.institutionId));
  }),

  // 5. List all faculty and coordinators in the institution
  listFaculty: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });

    return db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        departmentId: users.departmentId,
        isActive: users.isActive,
        mustChangePassword: users.mustChangePassword,
        departmentName: departments.name,
      })
      .from(users)
      .leftJoin(departments, eq(users.departmentId, departments.id))
      .where(
        and(
          eq(users.institutionId, ctx.user.institutionId),
          eq(users.isActive, true)
        )
      );
  }),
});
