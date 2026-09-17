import { router } from "../_core/trpc";
import { adminRouter } from "./admin";
import { analyticsRouter } from "./analytics";
import { authRouter } from "./auth";
import { dashboardRouter } from "./dashboard";
import { evidenceRouter } from "./evidence";
import { facultyRouter } from "./faculty";
import { hodRouter } from "./hod";
import { internshipRouter } from "./internship";
import { placementRouter } from "./placement";
import { recruitmentRouter } from "./recruitment";
import { searchRouter } from "./search";
import { skillGapRouter } from "./skillGap";
import { studentRouter } from "./student";
import { subjectRouter } from "./subject";
import { superAdminRouter } from "./superAdmin";
import { tnpRouter } from "./tnp";

export const appRouter = router({
  auth: authRouter,
  student: studentRouter,
  skillGap: skillGapRouter,
  faculty: facultyRouter,
  evidence: evidenceRouter,
  tnp: tnpRouter,
  subject: subjectRouter,
  internship: internshipRouter,
  placement: placementRouter,
  recruitment: recruitmentRouter,
  analytics: analyticsRouter,
  dashboard: dashboardRouter,
  search: searchRouter,
  superAdmin: superAdminRouter,
  hod: hodRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;



