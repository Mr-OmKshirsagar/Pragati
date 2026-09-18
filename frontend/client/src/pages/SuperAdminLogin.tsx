import React, { useState } from "react";
import { ShieldCheck, Lock, Mail, KeyRound, ArrowRight, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface SuperAdminLoginProps {
  onAuthenticated: (token: string) => void;
}

export default function SuperAdminLogin({ onAuthenticated }: SuperAdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState<"CREDENTIALS" | "2FA_OTP">("CREDENTIALS");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpSentNotice, setOtpSentNotice] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const credentialsMutation = trpc.auth.superAdminLogin.useMutation();
  const verifyMutation = trpc.auth.verifySuperAdmin2FA.useMutation();
  const resendMutation = trpc.auth.resendSuperAdmin2FA.useMutation();

  // Step 1: Verify Password and Request 2FA OTP
  const handleVerifyCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!email.trim() || !password.trim()) {
        throw new Error("Please enter both email and password.");
      }

      const result = await credentialsMutation.mutateAsync({ email, password });
      setChallengeId(result.challengeId);
      setMaskedEmail(result.maskedEmail);
      setStep("2FA_OTP");
      setOtpSentNotice(true);
    } catch (err: any) {
      setError(err.message || "Invalid authentication credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);

    // Auto-advance to next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  // Step 2: Verify 2FA OTP and Grant Session
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const fullOtp = otp.join("");
      if (fullOtp.length < 6) {
        throw new Error("Please enter the complete 6-digit OTP sent to your registered Gmail.");
      }

      if (!challengeId) {
        throw new Error("Your verification challenge is missing. Please start again.");
      }

      const result = await verifyMutation.mutateAsync({
        challengeId,
        otp: fullOtp,
      });
      const token = result.sessionToken;
      localStorage.setItem("pragati_token", token);
      localStorage.setItem("pragati_role", "SUPER_ADMIN");
      sessionStorage.setItem("pragati_token", token);

      onAuthenticated(token);
    } catch (err: any) {
      setError(err.message || "Failed to verify 2FA OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!challengeId) return;
    setError(null);
    setIsLoading(true);
    try {
      const result = await resendMutation.mutateAsync({ challengeId });
      setChallengeId(result.challengeId);
      setMaskedEmail(result.maskedEmail);
      setOtp(["", "", "", "", "", ""]);
      setOtpSentNotice(true);
    } catch (err: any) {
      setError(err.message || "Unable to resend the verification code.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden text-slate-100">
      {/* Background ambient lighting */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 text-indigo-400 mb-4 shadow-xl shadow-indigo-950/40">
            <ShieldCheck className="h-9 w-9" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            PRAGATI Platform Owner
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 flex items-center justify-center gap-1.5 font-mono">
            <Lock className="h-3.5 w-3.5 text-indigo-400" />
            SECURE GOVERNANCE PORTAL
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-black/60">
          {error && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {step === "CREDENTIALS" ? (
            <form onSubmit={handleVerifyCredentials} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Platform Owner Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@organization.com"
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Master Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Verify Credentials & Dispatch OTP <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              {otpSentNotice && (
                <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>2FA code dispatched to {maskedEmail || "your registered email"}.</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 text-center">
                  Enter 6-Digit 2FA Verification Code
                </label>
                <div className="flex justify-between gap-2">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-${idx}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(idx, e.target.value)}
                      onKeyDown={e => handleKeyDown(idx, e)}
                      className="w-12 h-14 text-center text-xl font-bold rounded-xl border border-slate-700 bg-slate-950 text-indigo-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 outline-none transition"
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <button
                  type="submit"
                  disabled={isLoading || otp.join("").length < 6}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Verify OTP & Enter Console <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isLoading}
                  className="text-xs text-slate-400 hover:text-slate-200 transition text-center py-1 cursor-pointer disabled:opacity-50"
                >
                  Resend verification code
                </button>

                <button
                  type="button"
                  onClick={() => setStep("CREDENTIALS")}
                  className="text-xs text-slate-400 hover:text-slate-200 transition text-center py-1 cursor-pointer"
                >
                  Back to credentials
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Security Footer */}
        <div className="mt-6 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5 font-mono">
          <span>Dual-Lock Encrypted Session</span> • <span>Bcrypt & 2FA Protected</span>
        </div>
      </div>
    </div>
  );
}
