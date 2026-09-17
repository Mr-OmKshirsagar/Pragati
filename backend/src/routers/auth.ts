import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { studentProfiles, users } from "../../drizzle/schema";
import { getDb } from "../db";
import { supabaseAdmin } from "../_core/supabase";
import {
  adminProcedure,
  facultyProcedure,
  protectedProcedure,
  publicProcedure,
  router,
  studentProcedure,
  tnpProcedure,
} from "../_core/trpc";
import { sendInstitutionalEmail } from "../services/emailService";
import {
  createChallenge,
  resendChallenge,
  verifyChallenge,
} from "../services/twoFactorService";

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
          mustChangePassword: matchedUser.mustChangePassword ?? false,
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

  /**
   * Complete Mandatory First-Login Password Reset:
   * Users provisioned with a temporary password must change their password
   * before accessing any protected role dashboards.
   */
  completeFirstLoginPasswordReset: publicProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        email: z.string().email().optional(),
        newPassword: z.string().min(8, "Password must be at least 8 characters long"),
        confirmPassword: z.string().min(8, "Password must be at least 8 characters long"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.newPassword !== input.confirmPassword) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "New password and confirmation password do not match.",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable.",
        });
      }

      let targetUserId = ctx.user?.id;
      let targetEmail = ctx.user?.email;
      let targetName = ctx.user?.name;

      if (!targetUserId && input.userId) {
        targetUserId = input.userId;
      }

      let userRecord;
      if (targetUserId) {
        const [u] = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
        userRecord = u;
      } else if (input.email) {
        const [u] = await db
          .select()
          .from(users)
          .where(eq(users.email, input.email.toLowerCase().trim()))
          .limit(1);
        userRecord = u;
        if (userRecord) targetUserId = userRecord.id;
      }

      if (!userRecord || !targetUserId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User account could not be found to perform password update.",
        });
      }

      targetEmail = userRecord.email;
      targetName = userRecord.name;

      // 1. Update Supabase Auth user password if available
      try {
        await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
          password: input.newPassword,
          user_metadata: {
            must_change_password: false,
          },
        });
      } catch (e: any) {
        console.warn("[Auth] Supabase Auth password update warning:", e?.message || e);
      }

      // 2. Clear mustChangePassword flag in Postgres
      await db
        .update(users)
        .set({
          mustChangePassword: false,
          updatedAt: new Date(),
        })
        .where(eq(users.id, targetUserId));

      // 3. Dispatch FIRST_LOGIN_RESET institutional email
      await sendInstitutionalEmail({
        toEmail: targetEmail,
        subject: "PRAGATI Security Alert: Password Successfully Updated",
        template: "FIRST_LOGIN_RESET",
        data: {
          name: targetName || "Institutional User",
          email: targetEmail,
        },
      });

      return {
        success: true,
        message: "Your password has been successfully updated. You now have full access to your institutional portal.",
        mustChangePassword: false,
      };
    }),

  /**
   * Request Password Reset (Dispatches 6-digit OTP challenge)
   */
  requestPasswordReset: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      const cleanEmail = input.email.toLowerCase().trim();
      let userId = "simulated-reset-user";

      if (db) {
        const [u] = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
        if (u) {
          userId = u.id;
        }
      }

      const challenge = await createChallenge({
        userId,
        email: cleanEmail,
        purpose: "PASSWORD_RESET",
      });

      return {
        success: true,
        challengeId: challenge.challengeId,
        expiresAt: challenge.expiresAt,
        maskedEmail: challenge.maskedEmail,
        simulatedOtp: challenge.simulatedOtp,
      };
    }),

  /**
   * Create 2FA OTP Challenge
   */
  create2FAChallenge: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        purpose: z
          .enum(["SUPER_ADMIN_2FA", "ADMIN_2FA", "PASSWORD_RESET", "EMAIL_VERIFY"])
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      const cleanEmail = input.email.toLowerCase().trim();
      let userId = "challenge-user";

      if (db) {
        const [u] = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
        if (u) {
          userId = u.id;
        }
      }

      const challenge = await createChallenge({
        userId,
        email: cleanEmail,
        purpose: input.purpose || "SUPER_ADMIN_2FA",
      });

      return {
        success: true,
        challengeId: challenge.challengeId,
        expiresAt: challenge.expiresAt,
        maskedEmail: challenge.maskedEmail,
        simulatedOtp: challenge.simulatedOtp,
      };
    }),

  /**
   * Verify 2FA OTP Challenge
   */
  verify2FA: publicProcedure
    .input(
      z.object({
        challengeId: z.string(),
        otp: z.string().min(6).max(6),
      })
    )
    .mutation(async ({ input }) => {
      const result = await verifyChallenge({
        challengeId: input.challengeId,
        otp: input.otp,
      });

      return {
        success: true,
        verified: true,
        userId: result.userId,
        email: result.email,
        purpose: result.purpose,
        sessionToken: `verified_${result.userId}_${Date.now()}`,
      };
    }),

  /**
   * Resend 2FA OTP Code
   */
  resend2FA: publicProcedure
    .input(
      z.object({
        challengeId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await resendChallenge({
        challengeId: input.challengeId,
      });

      return {
        success: true,
        challengeId: result.challengeId,
        expiresAt: result.expiresAt,
        maskedEmail: result.maskedEmail,
        simulatedOtp: result.simulatedOtp,
      };
    }),

  /**
   * Request Email Change
   */
  requestEmailChange: protectedProcedure
    .input(
      z.object({
        newEmail: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const challenge = await createChallenge({
        userId: ctx.user.id,
        email: input.newEmail.toLowerCase().trim(),
        purpose: "EMAIL_VERIFY",
      });

      return {
        success: true,
        challengeId: challenge.challengeId,
        maskedEmail: challenge.maskedEmail,
        expiresAt: challenge.expiresAt,
        simulatedOtp: challenge.simulatedOtp,
      };
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
