import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { studentProfiles, users } from "../../drizzle/schema";
import { getDb } from "../db";
import {
  adminProcedure,
  facultyProcedure,
  protectedProcedure,
  publicProcedure,
  router,
  studentProcedure,
  tnpProcedure,
} from "../_core/trpc";

export const authRouter = router({
  /**
   * Returns current authenticated user and institutional profile
   */
  me: protectedProcedure.query(({ ctx }) => {
    return {
      user: ctx.user,
    };
  }),

  /**
   * Fast-switch demo authentication for evaluators, judges, and testing
   */
  demoLogin: publicProcedure
    .input(
      z.object({
        role: z.enum(["STUDENT", "FACULTY", "HOD", "TNP_COORDINATOR", "ADMIN"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable.",
        });
      }

      const [matchedUser] = await db
        .select()
        .from(users)
        .where(eq(users.role, input.role))
        .limit(1);

      if (!matchedUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No seed user found with role ${input.role}. Please run seed script first.`,
        });
      }

      let studentProfile;
      if (matchedUser.role === "STUDENT") {
        const [sp] = await db
          .select()
          .from(studentProfiles)
          .where(eq(studentProfiles.userId, matchedUser.id))
          .limit(1);
        studentProfile = sp;
      }

      const demoToken = `demo_${matchedUser.role}`;

      return {
        success: true,
        token: demoToken,
        user: {
          id: matchedUser.id,
          name: matchedUser.name,
          email: matchedUser.email,
          role: matchedUser.role,
          institutionId: matchedUser.institutionId,
          departmentId: matchedUser.departmentId,
          studentProfile: studentProfile
            ? {
                id: studentProfile.id,
                enrollmentNumber: studentProfile.enrollmentNumber,
                program: studentProfile.program,
                currentSemester: studentProfile.currentSemester,
              }
            : undefined,
        },
      };
    }),

  /**
   * Logout helper
   */
  logout: protectedProcedure.mutation(() => {
    return { success: true, message: "Logged out successfully" };
  }),

  /**
   * Public Self-Registration Lockout:
   * PRAGATI strictly enforces two-tier hierarchical provisioning.
   * Public registration attempts are rejected with 403 Forbidden.
   */
  register: publicProcedure
    .input(z.record(z.string(), z.unknown()).optional())
    .mutation(() => {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Public self-registration is strictly disabled. Student accounts must be provisioned through hierarchical Class Teacher / HOD approval.",
      });
    }),

  selfRegister: publicProcedure
    .input(z.record(z.string(), z.unknown()).optional())
    .mutation(() => {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Public self-registration is strictly disabled. Student accounts must be provisioned through hierarchical Class Teacher / HOD approval.",
      });
    }),

  // ==========================================================================
  // ROLE VERIFICATION TEST ENDPOINTS (Used by automated tests and RBAC verification)
  // ==========================================================================
  testStudentAccess: studentProcedure.query(({ ctx }) => {
    return {
      authorized: true,
      role: ctx.user.role,
      studentProfileId: ctx.user.studentProfile?.id,
    };
  }),

  testFacultyAccess: facultyProcedure.query(({ ctx }) => {
    return {
      authorized: true,
      role: ctx.user.role,
      facultyUserId: ctx.user.id,
    };
  }),

  testTnpAccess: tnpProcedure.query(({ ctx }) => {
    return {
      authorized: true,
      role: ctx.user.role,
      tnpUserId: ctx.user.id,
    };
  }),

  testAdminAccess: adminProcedure.query(({ ctx }) => {
    return {
      authorized: true,
      role: ctx.user.role,
      adminUserId: ctx.user.id,
    };
  }),
});
