import { router } from "../_core/trpc";
import { authRouter } from "./auth";
import { facultyRouter } from "./faculty";
import { skillGapRouter } from "./skillGap";
import { studentRouter } from "./student";

export const appRouter = router({
  auth: authRouter,
  student: studentRouter,
  skillGap: skillGapRouter,
  faculty: facultyRouter,
});

export type AppRouter = typeof appRouter;



