import { COOKIE_NAME } from "@shared/const";
import { dashboardData, opportunitiesData, progressData, skillsData } from "@shared/pragati";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

export type PragatiRole = "STUDENT" | "FACULTY" | "HOD" | "TNP_COORDINATOR" | "ADMIN";

export interface PragatiUser {
  id: string;
  name: string;
  email: string;
  role: PragatiRole;
  department: string;
  roleId: string;
  designation: string;
  avatar: string;
}

const DEMO_PERSONAS: Record<PragatiRole, PragatiUser & { demoPassword: string }> = {
  STUDENT: {
    id: "user-student-1",
    name: "Rahul Sharma",
    email: "rahul.sharma@northstar.edu",
    role: "STUDENT",
    department: "Computer Science & Engineering",
    roleId: "CS-2023-0842",
    designation: "B.Tech CSE · Sem 6",
    avatar: "RS",
    demoPassword: "password123",
  },
  FACULTY: {
    id: "user-faculty-1",
    name: "Dr. Meera Nair",
    email: "meera.nair@northstar.edu",
    role: "FACULTY",
    department: "Computer Science & Engineering",
    roleId: "FAC-CS-104",
    designation: "Associate Professor & Mentor",
    avatar: "MN",
    demoPassword: "password123",
  },
  HOD: {
    id: "user-hod-1",
    name: "Dr. Sunita Rao",
    email: "sunita.rao@northstar.edu",
    role: "HOD",
    department: "Computer Science & Engineering",
    roleId: "HOD-CSE-001",
    designation: "Head of Department (CSE)",
    avatar: "SR",
    demoPassword: "password123",
  },
  TNP_COORDINATOR: {
    id: "user-tnp-1",
    name: "Prof. Vikram Mehta",
    email: "vikram.mehta@northstar.edu",
    role: "TNP_COORDINATOR",
    department: "Training & Placement Cell",
    roleId: "TNP-ENG-042",
    designation: "Head of Training & Placement",
    avatar: "VM",
    demoPassword: "password123",
  },
  ADMIN: {
    id: "user-admin-1",
    name: "System Administrator",
    email: "admin@northstar.edu",
    role: "ADMIN",
    department: "Institutional Systems & Governance",
    roleId: "ADM-SYS-001",
    designation: "Platform Administrator",
    avatar: "SA",
    demoPassword: "password123",
  },
};

const usersStore: Map<string, PragatiUser & { passwordHash?: string }> = new Map(
  Object.values(DEMO_PERSONAS).map(user => [user.email.toLowerCase(), user])
);

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    demoAccounts: publicProcedure.query(() => {
      return Object.values(DEMO_PERSONAS).map(({ demoPassword, ...user }) => ({
        ...user,
        hintPassword: demoPassword,
      }));
    }),
    login: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(1),
          role: z.enum(["STUDENT", "FACULTY", "HOD", "TNP_COORDINATOR", "ADMIN"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const found = usersStore.get(input.email.toLowerCase());
        if (!found) {
          // Allow demo login fallback if demo user was requested
          const demoFallback = DEMO_PERSONAS[input.role];
          if (demoFallback && (input.email.toLowerCase() === demoFallback.email.toLowerCase() || input.password === "password123")) {
            return { success: true, user: demoFallback };
          }
          throw new Error("Invalid credentials or account not found. Use a Demo Persona or Register.");
        }

        if (found.role !== input.role) {
          throw new Error(`Account registered as ${found.role}, not ${input.role}. Please select the correct role tab.`);
        }

        return { success: true, user: found };
      }),
    register: publicProcedure
      .input(
        z.object({
          name: z.string().min(2),
          email: z.string().email(),
          password: z.string().min(6),
          role: z.enum(["STUDENT", "FACULTY", "HOD", "TNP_COORDINATOR", "ADMIN"]),
          department: z.string().default("Computer Science & Engineering"),
          roleId: z.string().min(2),
          designation: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const key = input.email.toLowerCase();
        if (usersStore.has(key)) {
          throw new Error("An account with this email already exists. Please sign in instead.");
        }

        const initials = input.name
          .split(" ")
          .map(part => part[0])
          .slice(0, 2)
          .join("")
          .toUpperCase() || "U";

        const newUser: PragatiUser = {
          id: `user-${Date.now()}`,
          name: input.name,
          email: input.email,
          role: input.role,
          department: input.department,
          roleId: input.roleId,
          designation: input.designation || `${input.role} (${input.department})`,
          avatar: initials,
        };

        usersStore.set(key, newUser);
        return { success: true, user: newUser };
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
