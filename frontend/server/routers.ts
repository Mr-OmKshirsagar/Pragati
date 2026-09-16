import { COOKIE_NAME } from "@shared/const";
import { dashboardData, opportunitiesData, progressData, skillsData } from "@shared/pragati";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

import { z } from "zod";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    demoLogin: publicProcedure
      .input(z.object({ role: z.enum(["STUDENT", "FACULTY", "HOD", "TNP_COORDINATOR", "ADMIN"]) }))
      .mutation(({ input }) => {
        const personaNames: Record<string, string> = {
          STUDENT: "Rahul Sharma",
          FACULTY: "Dr. Anand Verma",
          HOD: "Prof. Sunita Rao",
          TNP_COORDINATOR: "Vikram Malhotra",
          ADMIN: "Platform Administrator",
        };
        return {
          success: true,
          token: `demo_${input.role}`,
          user: {
            id: "10000000-0000-0000-0000-000000000005",
            name: personaNames[input.role] || "Demo User",
            email: `${input.role.toLowerCase()}@northstar.edu`,
            role: input.role,
            institutionId: "NIT-001",
            departmentId: "CSE",
            studentProfile:
              input.role === "STUDENT"
                ? {
                    id: "student-rahul-sharma",
                    enrollmentNumber: "CSE2024042",
                    program: "B.Tech Computer Science and Engineering",
                    currentSemester: 6,
                  }
                : undefined,
          },
        };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  student: router({
    dashboard: publicProcedure.query(() => dashboardData),
    opportunities: publicProcedure.query(() => opportunitiesData),
    progress: publicProcedure.query(() => progressData),
    skills: publicProcedure.query(() => skillsData),
  }),
});

export type AppRouter = typeof appRouter;
