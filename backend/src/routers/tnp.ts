/**
 * TNP (Training & Placement) Officer Router
 * Handles placement drive creation, management, and publishing
 */

import { z } from "zod";
import { router, tnpProcedure } from "../_core/trpc";
import * as placementService from "../services/placementService";

export const tnpRouter = router({
  /**
   * Get all placement drives (for TNP dashboard)
   */
  getPlacements: tnpProcedure.query(async () => {
    return placementService.getTnpPlacements();
  }),

  /**
   * Get single placement drive
   */
  getPlacement: tnpProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const placement = await placementService.getOpportunityById(input.id);
      if (!placement) {
        throw new Error("Placement not found");
      }
      return placement;
    }),

  /**
   * Create new placement drive
   */
  createPlacement: tnpProcedure
    .input(
      z.object({
        company: z.string().min(1, "Company name required").max(100),
        role: z.string().min(1, "Role required").max(100),
        type: z.enum(["Internship", "Placement"]),
        location: z.string().min(1, "Location required").max(100),
        deadline: z.string().refine(d => !isNaN(Date.parse(d)), "Invalid deadline date"),
        description: z.string().min(10, "Description too short").max(1000),
        skills: z.array(z.string()).min(1, "At least one skill required").max(10),
        criteria: z.array(
          z.object({
            label: z.string().min(1).max(50),
            expected: z.string().min(1).max(50),
          })
        ).min(1, "At least one eligibility criterion required"),
        verificationRequirements: z.array(z.string()).min(1).max(5),
      })
    )
    .mutation(async ({ input, ctx }) => {
      console.log(`[TNP] ${ctx.user.name} creating placement:`, input.company, input.role);
      
      const placement = await placementService.createPlacement({
        company: input.company,
        role: input.role,
        type: input.type,
        location: input.location,
        deadline: input.deadline,
        description: input.description,
        skills: input.skills,
        criteria: input.criteria,
        verificationRequirements: input.verificationRequirements,
      });

      return {
        success: true,
        placement,
        message: `Placement drive for ${input.role} at ${input.company} created successfully`,
      };
    }),

  /**
   * Update placement drive
   */
  updatePlacement: tnpProcedure
    .input(
      z.object({
        id: z.string(),
        company: z.string().min(1).max(100),
        role: z.string().min(1).max(100),
        type: z.enum(["Internship", "Placement"]),
        location: z.string().min(1).max(100),
        deadline: z.string().refine(d => !isNaN(Date.parse(d)), "Invalid deadline"),
        description: z.string().min(10).max(1000),
        skills: z.array(z.string()).min(1).max(10),
        criteria: z.array(
          z.object({
            label: z.string().min(1).max(50),
            expected: z.string().min(1).max(50),
          })
        ).min(1),
        verificationRequirements: z.array(z.string()).min(1).max(5),
      })
    )
    .mutation(async ({ input, ctx }) => {
      console.log(`[TNP] ${ctx.user.name} updating placement ${input.id}`);
      
      const placement = await placementService.updatePlacement({
        id: input.id,
        company: input.company,
        role: input.role,
        type: input.type,
        location: input.location,
        deadline: input.deadline,
        description: input.description,
        skills: input.skills,
        criteria: input.criteria,
        verificationRequirements: input.verificationRequirements,
      });

      return {
        success: true,
        placement,
        message: "Placement drive updated successfully",
      };
    }),

  /**
   * Delete placement drive
   */
  deletePlacement: tnpProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      console.log(`[TNP] ${ctx.user.name} deleting placement ${input.id}`);
      
      const deleted = await placementService.deletePlacement(input.id);
      if (!deleted) {
        throw new Error("Placement not found");
      }

      return {
        success: true,
        message: "Placement drive deleted successfully",
      };
    }),

  /**
   * Publish/unpublish placement (make visible to students)
   */
  togglePublish: tnpProcedure
    .input(z.object({ id: z.string(), published: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      console.log(`[TNP] ${ctx.user.name} publishing placement ${input.id}: ${input.published}`);
      
      const placement = await placementService.togglePublishPlacement(input.id, input.published);

      return {
        success: true,
        placement,
        message: input.published ? "Placement published" : "Placement unpublished",
      };
    }),
});
