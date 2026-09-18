import crypto from "crypto";
import { TRPCError } from "@trpc/server";
import { sendInstitutionalEmail, type EmailTemplate } from "./emailService";

export interface TwoFactorChallenge {
  id: string;
  userId: string;
  email: string;
  otpHash: string;
  purpose: "SUPER_ADMIN_2FA" | "ADMIN_2FA" | "PASSWORD_RESET" | "EMAIL_VERIFY";
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  verified: boolean;
  createdAt: Date;
  lastSentAt: Date;
}

// In-memory high-speed challenge cache
const challengesStore = new Map<string, TwoFactorChallenge>();

function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp.trim()).digest("hex");
}

function maskEmail(email: string): string {
  const parts = email.split("@");
  if (parts.length !== 2) return email;
  const user = parts[0];
  const domain = parts[1];
  const maskedUser =
    user.length <= 2
      ? `${user[0]}*`
      : `${user.slice(0, 2)}${"*".repeat(Math.min(user.length - 2, 5))}${user.slice(-1)}`;
  return `${maskedUser}@${domain}`;
}

export async function createChallenge(params: {
  userId: string;
  email: string;
  purpose?: TwoFactorChallenge["purpose"];
}): Promise<{ challengeId: string; expiresAt: Date; maskedEmail: string; simulatedOtp?: string }> {
  const purpose = params.purpose || "SUPER_ADMIN_2FA";
  const challengeId = crypto.randomUUID();

  // Generate cryptographic 6-digit numeric OTP (100000 - 999999)
  const numericOtp = crypto.randomInt(100000, 1000000).toString();
  const otpHash = hashOtp(numericOtp);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

  const challenge: TwoFactorChallenge = {
    id: challengeId,
    userId: params.userId,
    email: params.email,
    otpHash,
    purpose,
    expiresAt,
    attempts: 0,
    maxAttempts: 3,
    verified: false,
    createdAt: now,
    lastSentAt: now,
  };

  challengesStore.set(challengeId, challenge);

  // Determine email template
  const template: EmailTemplate =
    purpose === "PASSWORD_RESET" ? "PASSWORD_RESET_OTP" : "TWO_FACTOR_OTP";

  // Dispatch email
  await sendInstitutionalEmail({
    toEmail: params.email,
    subject: purpose === "PASSWORD_RESET" ? "PRAGATI Password Reset Code" : "PRAGATI 2FA Security Code",
    template,
    data: { otp: numericOtp },
  });

  return {
    challengeId,
    expiresAt,
    maskedEmail: maskEmail(params.email),
    // Expose simulated OTP in test environment only
    simulatedOtp: process.env.NODE_ENV === "test" ? numericOtp : undefined,
  };
}

export async function verifyChallenge(params: {
  challengeId: string;
  otp: string;
}): Promise<{ verified: true; userId: string; email: string; purpose: string }> {
  const challenge = challengesStore.get(params.challengeId);
  if (!challenge) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Invalid or expired challenge ID.",
    });
  }

  if (challenge.verified) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Challenge has already been used.",
    });
  }

  if (new Date() > challenge.expiresAt) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "EXPIRED_OTP: Verification code has expired. Please request a new one.",
    });
  }

  if (challenge.attempts >= challenge.maxAttempts) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Maximum verification attempts exceeded. Please request a new code.",
    });
  }

  const suppliedHash = hashOtp(params.otp);
  if (suppliedHash !== challenge.otpHash) {
    challenge.attempts += 1;
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "INVALID_OTP: Incorrect 6-digit verification code.",
    });
  }

  challenge.verified = true;

  return {
    verified: true,
    userId: challenge.userId,
    email: challenge.email,
    purpose: challenge.purpose,
  };
}

export async function resendChallenge(params: {
  challengeId: string;
}): Promise<{ challengeId: string; expiresAt: Date; maskedEmail: string; simulatedOtp?: string }> {
  const challenge = challengesStore.get(params.challengeId);
  if (!challenge) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Challenge not found.",
    });
  }

  const now = new Date();
  const timeSinceLastSent = now.getTime() - challenge.lastSentAt.getTime();
  if (timeSinceLastSent < 60 * 1000 && process.env.NODE_ENV !== "test") {
    const remainingSeconds = Math.ceil((60 * 1000 - timeSinceLastSent) / 1000);
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Please wait ${remainingSeconds} seconds before requesting a new code.`,
    });
  }

  const newOtp = crypto.randomInt(100000, 1000000).toString();
  challenge.otpHash = hashOtp(newOtp);
  challenge.attempts = 0;
  challenge.expiresAt = new Date(now.getTime() + 10 * 60 * 1000);
  challenge.lastSentAt = now;

  const template: EmailTemplate =
    challenge.purpose === "PASSWORD_RESET" ? "PASSWORD_RESET_OTP" : "TWO_FACTOR_OTP";

  await sendInstitutionalEmail({
    toEmail: challenge.email,
    subject: challenge.purpose === "PASSWORD_RESET" ? "PRAGATI Password Reset Code" : "PRAGATI 2FA Security Code",
    template,
    data: { otp: newOtp },
  });

  return {
    challengeId: challenge.id,
    expiresAt: challenge.expiresAt,
    maskedEmail: maskEmail(challenge.email),
    simulatedOtp: process.env.NODE_ENV === "test" ? newOtp : undefined,
  };
}
