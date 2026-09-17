import { router } from "../_core/trpc";
import { authRouter } from "./auth";
import { evidenceRouter } from "./evidence";
import { facultyRouter } from "./faculty";
import { skillGapRouter } from "./skillGap";
import { studentRouter } from "./student";
import { tnpRouter } from "./tnp";
import { subjectRouter } from "./subject";
import { internshipRouter } from "./internship";
import { placementRouter } from "./placement";
import { recruitmentRouter } from "./recruitment";
import { analyticsRouter } from "./analytics";
import { dashboardRouter } from "./dashboard";
import { searchRouter } from "./search";
import { superAdminRouter } from "./superAdmin";

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
});

export type AppRouter = typeof appRouter;



