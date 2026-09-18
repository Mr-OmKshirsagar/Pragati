import { describe, expect, it } from "vitest";
import type { Request } from "express";
import { appRouter } from "./routers";
import { sdk } from "./_core/sdk";

describe("Super Admin SMTP authentication lifecycle", () => {
  const context = {
    req: {} as Request,
    res: {} as any,
    user: null,
  };

  it("requires credentials, verifies the emailed OTP, and gates governance access", async () => {
    const caller = appRouter.createCaller(context);
    const email = process.env.SUPER_ADMIN_EMAIL || "omkshirsagar.login@gmail.com";
    const password = process.env.SUPER_ADMIN_PASSWORD || process.env.SUPER_ADMIN_MASTER_KEY;

    await expect(
      caller.auth.superAdminLogin({ email, password: "incorrect" })
    ).rejects.toThrow("Invalid Platform Owner credentials");

    if (!password) throw new Error("Super Admin test credentials are not configured");

    const challenge = await caller.auth.superAdminLogin({ email, password });
    expect(challenge.challengeId).toBeDefined();
    expect(challenge.simulatedOtp).toMatch(/^\d{6}$/);

    await expect(
      caller.auth.verifySuperAdmin2FA({
        challengeId: challenge.challengeId,
        otp: "000000",
      })
    ).rejects.toThrow("Incorrect verification code");

    const verified = await caller.auth.verifySuperAdmin2FA({
      challengeId: challenge.challengeId,
      otp: challenge.simulatedOtp!,
    });
    expect(verified.verified).toBe(true);

    await expect(caller.superAdmin.getPlatformStats()).rejects.toThrow("login");

    const authenticatedUser = await sdk.authenticateRequest({
      headers: { authorization: `Bearer ${verified.sessionToken}` },
    } as Request);
    const authenticatedCaller = appRouter.createCaller({
      ...context,
      user: authenticatedUser,
    });
    const stats = await authenticatedCaller.superAdmin.getPlatformStats();
    expect(stats.totalInstitutions).toBeGreaterThan(0);
  });
});
