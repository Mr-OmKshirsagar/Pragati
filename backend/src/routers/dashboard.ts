import { router, studentProcedure, requireRole } from "../_core/trpc";
import * as dashboardService from "../services/dashboardService";

export const dashboardRouter = router({
  /**
   * 1. Student Operational Dashboard with Deterministic Career Readiness Scorecard
   */
  getStudentDashboard: studentProcedure.query(async ({ ctx }) => {
    return dashboardService.getAggregatedStudentDashboard(ctx.user.studentProfile.id);
  }),

  /**
   * 2. Verifiable Portable Career Passport Dossier
   */
  getCareerPassport: studentProcedure.query(async ({ ctx }) => {
    return dashboardService.generateCareerPassport(ctx.user.studentProfile.id);
  }),

  /**
   * 3. HOD Department Macro Analytics Hub
   */
  getHodAnalytics: requireRole(["HOD", "ADMIN"]).query(async ({ ctx }) => {
    return dashboardService.getDepartmentAnalytics(ctx.user.departmentId || "");
  }),
});
