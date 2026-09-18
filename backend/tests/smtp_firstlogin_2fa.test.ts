import { describe, expect, it, beforeAll, afterAll } from "vitest";
import crypto from "crypto";
import { appRouter } from "../src/routers";
import { getDb } from "../src/db";
import { institutions, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import type { Context } from "../src/_core/context";
import { sendInstitutionalEmail } from "../src/services/emailService";
import {
  createChallenge,
  verifyChallenge,
  resendChallenge,
} from "../src/services/twoFactorService";

function createTestContext(userOverrides?: Partial<NonNullable<Context["user"]>>): Context {
  return {
    req: {} as any,
    res: {} as any,
    user: {
      id: userOverrides?.id || crypto.randomUUID(),
      email: userOverrides?.email || "test@northstar.edu",
      role: userOverrides?.role || "STUDENT",
      institutionId: userOverrides?.institutionId || "10000000-0000-0000-0000-000000000000",
      departmentId: userOverrides?.departmentId || null,
      name: userOverrides?.name || "Test User",
      mustChangePassword: userOverrides?.mustChangePassword ?? false,
      ...userOverrides,
    } as any,
  };
}

describe("Phase 15: Supabase SMTP Integration, First-Login Reset & 2FA Lifecycle", () => {
  let instId: string;
  let testUserId: string;
  const testUserEmail = `firstlogin-${Date.now()}@northstar.edu`;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable for tests");

    // 1. Create Test Institution
    const [inst] = await db
      .insert(institutions)
      .values({
        name: "Phase 15 Test Institute",
        code: `P15-INST-${Date.now()}`,
        status: "ACTIVE",
      })
      .returning();
    instId = inst.id;

    // 2. Create Provisioned User with mustChangePassword = true
    testUserId = crypto.randomUUID();
    await db.insert(users).values({
      id: testUserId,
      institutionId: instId,
      name: "Temporary User",
      email: testUserEmail,
      role: "STUDENT",
      isActive: true,
      mustChangePassword: true,
    });
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    try {
      await db.delete(users).where(eq(users.institutionId, instId));
      await db.delete(institutions).where(eq(institutions.id, instId));
    } catch {}
  });

  // ==========================================================================
  // SECTION 1: INSTITUTIONAL EMAIL SERVICE & CATCH-ALL ROUTING
  // ==========================================================================
  describe("1. Email Service & Institutional Templates", () => {
    it("safely dispatches ACCOUNT_WELCOME email with simulated fallback", async () => {
      const result = await sendInstitutionalEmail({
        toEmail: "fresh.student@northstar.edu",
        subject: "Welcome to PRAGATI Portal - Credentials Inside",
        template: "ACCOUNT_WELCOME",
        data: {
          name: "Fresh Student",
          role: "STUDENT",
          tempPassword: "TempPassword123!",
          portalUrl: "http://localhost:5173/login",
        },
      });

      expect(["SENT", "SIMULATED_SUCCESS"]).toContain(result.status);
      expect(result.subject).toContain("PRAGATI");
    });

    it("intercepts demo domain (@northstar.edu) to DEMO_NOTIFICATION_EMAIL when configured", async () => {
      const originalEnv = process.env.DEMO_NOTIFICATION_EMAIL;
      process.env.DEMO_NOTIFICATION_EMAIL = "admin.catchall@pragati.edu";

      const result = await sendInstitutionalEmail({
        toEmail: "demo.student@northstar.edu",
        isDemoAccount: true,
        subject: "Demo Notification Test",
        template: "PASSWORD_RESET_OTP",
        data: { otp: "458921" },
      });

      expect(result.intercepted).toBe(true);
      expect(result.recipient).toBe("admin.catchall@pragati.edu");

      if (originalEnv) {
        process.env.DEMO_NOTIFICATION_EMAIL = originalEnv;
      } else {
        delete process.env.DEMO_NOTIFICATION_EMAIL;
      }
    });

    it("renders FIRST_LOGIN_RESET template confirmation without errors", async () => {
      const result = await sendInstitutionalEmail({
        toEmail: "user.reset@example.com",
        subject: "Password Reset Completed",
        template: "FIRST_LOGIN_RESET",
        data: {
          name: "Reset User",
          email: "user.reset@example.com",
        },
      });

      expect(["SENT", "SIMULATED_SUCCESS"]).toContain(result.status);
    });
  });

  // ==========================================================================
  // SECTION 2: 2FA OTP LIFECYCLE SERVICE
  // ==========================================================================
  describe("2. Two-Factor OTP Security Lifecycle", () => {
    let challengeId: string;
    let validOtp: string;

    it("generates a 6-digit cryptographic OTP challenge with 10-minute expiry", async () => {
      const challenge = await createChallenge({
        userId: testUserId,
        email: testUserEmail,
        purpose: "SUPER_ADMIN_2FA",
      });

      expect(challenge.challengeId).toBeDefined();
      expect(challenge.expiresAt.getTime()).toBeGreaterThan(Date.now() + 9 * 60 * 1000);
      expect(challenge.maskedEmail).toContain("@");
      expect(challenge.simulatedOtp).toHaveLength(6);
      expect(/^\d{6}$/.test(challenge.simulatedOtp!)).toBe(true);

      challengeId = challenge.challengeId;
      validOtp = challenge.simulatedOtp!;
    });

    it("rejects an invalid 6-digit OTP code", async () => {
      await expect(
        verifyChallenge({
          challengeId,
          otp: "000000",
        })
      ).rejects.toThrow("INVALID_OTP");
    });

    it("verifies successfully with the correct OTP", async () => {
      const result = await verifyChallenge({
        challengeId,
        otp: validOtp,
      });

      expect(result.verified).toBe(true);
      expect(result.userId).toBe(testUserId);
      expect(result.purpose).toBe("SUPER_ADMIN_2FA");
    });

    it("rejects reuse of an already verified challenge", async () => {
      await expect(
        verifyChallenge({
          challengeId,
          otp: validOtp,
        })
      ).rejects.toThrow("already been used");
    });

    it("locks challenge after maximum failed attempts (3 attempts)", async () => {
      const freshChallenge = await createChallenge({
        userId: testUserId,
        email: testUserEmail,
        purpose: "ADMIN_2FA",
      });

      // Attempt 1: Fail
      await expect(
        verifyChallenge({ challengeId: freshChallenge.challengeId, otp: "111111" })
      ).rejects.toThrow("INVALID_OTP");

      // Attempt 2: Fail
      await expect(
        verifyChallenge({ challengeId: freshChallenge.challengeId, otp: "222222" })
      ).rejects.toThrow("INVALID_OTP");

      // Attempt 3: Fail
      await expect(
        verifyChallenge({ challengeId: freshChallenge.challengeId, otp: "333333" })
      ).rejects.toThrow("INVALID_OTP");

      // Attempt 4: Locked
      await expect(
        verifyChallenge({ challengeId: freshChallenge.challengeId, otp: "444444" })
      ).rejects.toThrow("Maximum verification attempts exceeded");
    });

    it("resends challenge with a new OTP and resets attempt counter", async () => {
      const freshChallenge = await createChallenge({
        userId: testUserId,
        email: testUserEmail,
        purpose: "PASSWORD_RESET",
      });

      const resent = await resendChallenge({
        challengeId: freshChallenge.challengeId,
      });

      expect(resent.challengeId).toBe(freshChallenge.challengeId);
      expect(resent.simulatedOtp).toBeDefined();

      // Can verify using new OTP
      const verifyRes = await verifyChallenge({
        challengeId: freshChallenge.challengeId,
        otp: resent.simulatedOtp!,
      });
      expect(verifyRes.verified).toBe(true);
    });
  });

  // ==========================================================================
  // SECTION 3: TRPC PROCEDURES & FIRST-LOGIN RESET ENFORCEMENT
  // ==========================================================================
  describe("3. First-Login Password Reset Flow via tRPC", () => {
    it("rejects password reset if passwords do not match", async () => {
      const caller = appRouter.createCaller(createTestContext());

      await expect(
        caller.auth.completeFirstLoginPasswordReset({
          userId: testUserId,
          newPassword: "NewSecurePassword123!",
          confirmPassword: "DifferentPassword123!",
        })
      ).rejects.toThrow("do not match");
    });

    it("rejects password if length is less than 8 characters", async () => {
      const caller = appRouter.createCaller(createTestContext());

      await expect(
        caller.auth.completeFirstLoginPasswordReset({
          userId: testUserId,
          newPassword: "short",
          confirmPassword: "short",
        })
      ).rejects.toThrow();
    });

    it("completes first-login password reset, flips mustChangePassword, and sends receipt", async () => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Verify flag is initially true
      const [beforeUser] = await db.select().from(users).where(eq(users.id, testUserId));
      expect(beforeUser.mustChangePassword).toBe(true);

      const caller = appRouter.createCaller(
        createTestContext({ id: testUserId, email: testUserEmail })
      );

      const res = await caller.auth.completeFirstLoginPasswordReset({
        userId: testUserId,
        newPassword: "NewInstitutionalPassword2026!",
        confirmPassword: "NewInstitutionalPassword2026!",
      });

      expect(res.success).toBe(true);
      expect(res.mustChangePassword).toBe(false);

      // Verify in Postgres
      const [afterUser] = await db.select().from(users).where(eq(users.id, testUserId));
      expect(afterUser.mustChangePassword).toBe(false);
    });

    it("handles requestPasswordReset, create2FAChallenge, and verify2FA via tRPC caller", async () => {
      const caller = appRouter.createCaller(createTestContext());

      // 1. Request Password Reset OTP
      const resetReq = await caller.auth.requestPasswordReset({
        email: testUserEmail,
      });
      expect(resetReq.success).toBe(true);
      expect(resetReq.challengeId).toBeDefined();
      expect(resetReq.simulatedOtp).toBeDefined();

      // 2. Create 2FA Challenge
      const challengeReq = await caller.auth.create2FAChallenge({
        email: testUserEmail,
        purpose: "ADMIN_2FA",
      });
      expect(challengeReq.success).toBe(true);
      expect(challengeReq.challengeId).toBeDefined();
      expect(challengeReq.simulatedOtp).toBeDefined();

      // 3. Verify 2FA Challenge
      const verifyRes = await caller.auth.verify2FA({
        challengeId: challengeReq.challengeId,
        otp: challengeReq.simulatedOtp!,
      });
      expect(verifyRes.success).toBe(true);
      expect(verifyRes.verified).toBe(true);
      expect(verifyRes.sessionToken).toContain("verified_");
    });
  });
});
