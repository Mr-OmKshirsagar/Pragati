import { initTRPC, TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import superjson from "superjson";
import { institutions } from "../../drizzle/schema";
import { getDb } from "../db";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// In-memory cache for suspended institutions: institutionId -> suspensionReason
export const suspendedInstitutionsCache = new Map<string, string>();

export async function checkInstitutionSuspension(institutionId: string): Promise<string | null> {
  if (suspendedInstitutionsCache.has(institutionId)) {
    return suspendedInstitutionsCache.get(institutionId) || null;
  }
  try {
    const db = await getDb();
    if (!db) return null;
    const [inst] = await db
      .select({ status: institutions.status, suspensionReason: institutions.suspensionReason })
      .from(institutions)
      .where(eq(institutions.id, institutionId))
      .limit(1);

    if (inst && inst.status === "SUSPENDED") {
      const reason = inst.suspensionReason || "Access suspended by platform governance.";
      suspendedInstitutionsCache.set(institutionId, reason);
      return reason;
    }
  } catch {
    // Database check failed, proceed
  }
  return null;
}

/**
 * Ensures request has an authenticated session. Throws 401 UNAUTHORIZED if missing.
 * Intercepts calls if institution is SUSPENDED.
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Session expired or missing authentication token.",
    });
  }

  // Suspension Cascade Check (Super Admin is platform-wide and exempt)
  if (ctx.user.role !== "SUPER_ADMIN" && ctx.user.institutionId) {
    const reason = await checkInstitutionSuspension(ctx.user.institutionId);
    if (reason) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `INSTITUTION_SUSPENDED: ${reason}`,
      });
    }
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
  allowedRoles: ("STUDENT" | "FACULTY" | "HOD" | "TNP_COORDINATOR" | "ADMIN" | "SUPER_ADMIN")[]
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
export const tnpProcedure = requireRole(["TNP_COORDINATOR", "ADMIN"]);
export const adminProcedure = requireRole(["ADMIN"]);

/**
 * Super Admin Procedure Guard:
 * Dual-Lock check:
 * 1. Runtime SUPER_ADMIN_MASTER_KEY check (returns 404 for cloners in production)
 * 2. Role check for SUPER_ADMIN
 */
export const superAdminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const masterKey = process.env.SUPER_ADMIN_MASTER_KEY;
  if (process.env.NODE_ENV !== "test" && !masterKey && process.env.NODE_ENV === "production") {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Portal route not found.",
    });
  }

  if (ctx.user.role !== "SUPER_ADMIN" && !ctx.user.isSuperAdmin) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Access restricted: Platform Owner (Super Admin) privileges required.",
    });
  }

  return next({ ctx });
});
