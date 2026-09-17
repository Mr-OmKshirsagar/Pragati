import { router } from "../_core/trpc";
import { authRouter } from "./auth";
import { evidenceRouter } from "./evidence";
import { facultyRouter } from "./faculty";
import { skillGapRouter } from "./skillGap";
import { studentRouter } from "./student";
import { tnpRouter } from "./tnp";
import { subjectRouter } from "./subject";
import { internshipRouter } from "./internship";
import { analyticsRouter } from "./analytics";
import { searchRouter } from "./search";

export const appRouter = router({
  auth: authRouter,
  student: studentRouter,
  skillGap: skillGapRouter,
  faculty: facultyRouter,
  evidence: evidenceRouter,
  tnp: tnpRouter,
  subject: subjectRouter,
  internship: internshipRouter,
  analytics: analyticsRouter,
  search: searchRouter,
});

export type AppRouter = typeof appRouter;



