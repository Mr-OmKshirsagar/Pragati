import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Ensures request has an authenticated session. Throws 401 UNAUTHORIZED if missing.
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Session expired or missing authentication token.",
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

/**
 * Enforces server-side Role-Based Access Control (RBAC). Throws 403 FORBIDDEN if role is not allowed.
 */
export const requireRole = (
  allowedRoles: ("STUDENT" | "FACULTY" | "HOD" | "ADMIN")[]
) =>
  protectedProcedure.use(async ({ ctx, next }) => {
    if (!allowedRoles.includes(ctx.user.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Role '${ctx.user.role}' is not authorized to execute this procedure. Required: ${allowedRoles.join(", ")}`,
      });
    }
    return next({ ctx });
  });

// Role-Scoped Procedure Guards
export const studentProcedure = requireRole(["STUDENT"]).use(async ({ ctx, next }) => {
  if (!ctx.user.studentProfile) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Student profile not found for this user account.",
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: {
        ...ctx.user,
        studentProfile: ctx.user.studentProfile,
      },
    },
  });
});
export const facultyProcedure = requireRole(["FACULTY", "HOD", "ADMIN"]);
export const hodProcedure = requireRole(["HOD", "ADMIN"]);
export const tnpProcedure = requireRole(["HOD", "ADMIN"]);
export const adminProcedure = requireRole(["ADMIN"]);
