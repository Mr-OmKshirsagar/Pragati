import { router } from "../_core/trpc";
import { authRouter } from "./auth";
import { studentRouter } from "./student";

export const appRouter = router({
  auth: authRouter,
  student: studentRouter,
});

export type AppRouter = typeof appRouter;

