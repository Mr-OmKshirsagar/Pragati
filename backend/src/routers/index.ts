import { router } from "../_core/trpc";
import { authRouter } from "./auth";
import { skillGapRouter } from "./skillGap";
import { studentRouter } from "./student";

export const appRouter = router({
  auth: authRouter,
  student: studentRouter,
  skillGap: skillGapRouter,
});

export type AppRouter = typeof appRouter;


