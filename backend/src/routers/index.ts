import { router } from "../_core/trpc";
import { authRouter } from "./auth";

export const appRouter = router({
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
