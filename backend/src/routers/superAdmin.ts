import { z } from "zod";
import { router, superAdminProcedure } from "../_core/trpc";
import * as institutionService from "../services/institutionService";

export const superAdminRouter = router({
  /**
   * 1. Global Platform Analytics & Health
   */
  getPlatformStats: superAdminProcedure.query(async () => {
    return institutionService.getPlatformStats();
  }),

  /**
   * 2. List All Institutions (with status, demo, and search filters)
   */
  listInstitutions: superAdminProcedure
    .input(
      z
        .object({
          status: z.enum(["ACTIVE", "SUSPENDED", "ALL"]).optional(),
          includeDemo: z.boolean().default(true),
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      return institutionService.listInstitutions(input);
    }),

  /**
   * 3. Get Single Institution Details
   */
  getInstitution: superAdminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const inst = await institutionService.getInstitutionById(input.id);
      if (!inst) {
        throw new Error("Institution not found");
      }
      return inst;
    }),

  /**
   * 4. Provision New Institution & College Admin
   */
  provisionInstitution: superAdminProcedure
    .input(
      z.object({
        name: z.string().min(3, "Institution name required").max(255),
        code: z.string().min(2, "AISHE / College Code required").max(50),
        domain: z.string().min(3, "Official domain required").max(150),
        universityBoard: z.string().min(2, "Affiliated board required").max(255),
        address: z.string().min(5, "Official address required"),
        city: z.string().min(2).max(100),
        state: z.string().min(2).max(100),
        contactPhone: z.string().min(8).max(30),
        contactEmail: z.string().email("Invalid official contact email"),
        adminName: z.string().min(2, "Administrator name required").max(150),
        adminEmail: z.string().email("Invalid administrator email"),
        adminPhone: z.string().min(8).max(30),
        adminDesignation: z.string().min(2).max(100),
        adminEmployeeId: z.string().min(2).max(50),
      })
    )
    .mutation(async ({ input, ctx }) => {
      console.log(`[SuperAdmin] ${ctx.user.name} provisioning institution: ${input.name} (${input.code})`);
      const result = await institutionService.provisionInstitution(input);
      return {
        success: true,
        institution: result.institution,
        admin: result.admin,
        message: `Institution '${input.name}' and administrator '${input.adminName}' provisioned successfully.`,
      };
    }),

  /**
   * 5. Suspend Institution (Cascading Lockout with Reason)
   */
  suspendInstitution: superAdminProcedure
    .input(
      z.object({
        institutionId: z.string().uuid(),
        reason: z.string().min(5, "A clear suspension reason must be provided"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      console.log(`[SuperAdmin] ${ctx.user.name} suspending institution ${input.institutionId}: "${input.reason}"`);
      const updated = await institutionService.suspendInstitution(input.institutionId, input.reason);
      return {
        success: true,
        institution: updated,
        message: `Institution '${updated.name}' suspended. All tenant sessions have been locked out.`,
      };
    }),

  /**
   * 6. Revive Suspended Institution
   */
  reviveInstitution: superAdminProcedure
    .input(z.object({ institutionId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      console.log(`[SuperAdmin] ${ctx.user.name} reviving institution ${input.institutionId}`);
      const updated = await institutionService.reviveInstitution(input.institutionId);
      return {
        success: true,
        institution: updated,
        message: `Institution '${updated.name}' revived. Access restored for all users.`,
      };
    }),

  /**
   * 7. Soft Delete Institution (Starts 30-day recovery pool countdown)
   */
  softDeleteInstitution: superAdminProcedure
    .input(z.object({ institutionId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      console.log(`[SuperAdmin] ${ctx.user.name} soft-deleting institution ${input.institutionId}`);
      await institutionService.softDeleteInstitution(input.institutionId, ctx.user.id);
      return {
        success: true,
        message: "Institution soft-deleted. Retained in 30-day trash recovery pool.",
      };
    }),

  /**
   * 8. List 30-Day Trash Items
   */
  listTrash: superAdminProcedure.query(async () => {
    return institutionService.listTrashItems();
  }),

  /**
   * 9. Restore Entity from 30-Day Trash Pool
   */
  restoreFromTrash: superAdminProcedure
    .input(
      z.object({
        resourceType: z.enum(["INSTITUTION", "USER", "DEPARTMENT"]),
        resourceId: z.string().uuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      console.log(`[SuperAdmin] ${ctx.user.name} restoring ${input.resourceType} ${input.resourceId}`);
      const result = await institutionService.restoreFromTrash(input.resourceType, input.resourceId);
      return {
        success: true,
        message: `${input.resourceType} restored successfully from trash.`,
        item: result.item,
      };
    }),

  /**
   * 10. List Institution Change Requests
   */
  listChangeRequests: superAdminProcedure
    .input(
      z
        .object({
          status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      return institutionService.listChangeRequests(input?.status);
    }),

  /**
   * 11. Review Change Request (Approve or Reject)
   */
  reviewChangeRequest: superAdminProcedure
    .input(
      z.object({
        requestId: z.string().uuid(),
        action: z.enum(["APPROVE", "REJECT"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      console.log(`[SuperAdmin] ${ctx.user.name} reviewing change request ${input.requestId}: ${input.action}`);
      const updated = await institutionService.reviewChangeRequest({
        requestId: input.requestId,
        action: input.action,
        notes: input.notes,
        reviewedBy: ctx.user.id,
      });
      return {
        success: true,
        request: updated,
        message: `Change request marked as ${input.action}.`,
      };
    }),
});
