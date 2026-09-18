import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ShieldCheck, AlertCircle, RefreshCw, KeyRound, Loader2, CheckCircle2 } from "lucide-react";

interface TwoFactorModalProps {
  open: boolean;
  challengeId: string;
  maskedEmail: string;
  title?: string;
  description?: string;
  onSuccess: (result: { verified: boolean; sessionToken?: string; userId?: string }) => void;
  onCancel: () => void;
}

export function TwoFactorModal({
  open,
  challengeId: initialChallengeId,
  maskedEmail: initialMaskedEmail,
  title = "Two-Factor Authentication",
  description = "A 6-digit security code has been dispatched to your institutional email.",
  onSuccess,
  onCancel,
}: TwoFactorModalProps) {
  const [currentChallengeId, setCurrentChallengeId] = useState(initialChallengeId);
  const [currentMaskedEmail, setCurrentMaskedEmail] = useState(initialMaskedEmail);
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(600); // 10 minutes
  const [resendCooldown, setResendCooldown] = useState(60); // 60 seconds
  const [isSuccess, setIsSuccess] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const verifyMutation = trpc.auth.verify2FA.useMutation();
  const resendMutation = trpc.auth.resend2FA.useMutation();

  // Keep challenge info up to date if props change
  useEffect(() => {
    setCurrentChallengeId(initialChallengeId);
    setCurrentMaskedEmail(initialMaskedEmail);
    setDigits(["", "", "", "", "", ""]);
    setErrorMsg(null);
    setSecondsRemaining(600);
    setResendCooldown(60);
    setIsSuccess(false);
  }, [initialChallengeId, initialMaskedEmail, open]);

  // Focus the first input upon opening
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    }
  }, [open]);

  // 10-minute expiry countdown & 60s resend countdown
  useEffect(() => {
    if (!open || isSuccess) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [open, isSuccess]);

  const handleDigitChange = (index: number, value: string) => {
    setErrorMsg(null);
    const cleaned = value.replace(/\D/g, "");

    // Single digit input
    if (cleaned.length <= 1) {
      const newDigits = [...digits];
      newDigits[index] = cleaned;
      setDigits(newDigits);

      // Auto-advance to next input
      if (cleaned && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }

      // If full 6 digits filled, trigger auto-submit
      if (cleaned && index === 5 && newDigits.every((d) => d.length === 1)) {
        handleVerify(newDigits.join(""));
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      // Move to previous input on backspace
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedText) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pastedText[i] || "";
    }
    setDigits(newDigits);

    const focusIdx = Math.min(pastedText.length, 5);
    inputRefs.current[focusIdx]?.focus();

    if (pastedText.length === 6) {
      handleVerify(pastedText);
    }
  };

  const handleVerify = async (codeToVerify?: string) => {
    const fullOtp = codeToVerify || digits.join("");
    if (fullOtp.length !== 6) {
      setErrorMsg("Please enter the complete 6-digit verification code.");
      return;
    }

    if (secondsRemaining <= 0) {
      setErrorMsg("Verification code has expired. Please click Resend Code.");
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);

    try {
      const result = await verifyMutation.mutateAsync({
        challengeId: currentChallengeId,
        otp: fullOtp,
      });

      setIsSuccess(true);
      setTimeout(() => {
        onSuccess({
          verified: true,
          sessionToken: result.sessionToken,
          userId: result.userId,
        });
      }, 600);
    } catch (err: any) {
      setErrorMsg(err?.message || "Invalid or expired code. Please try again.");
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    setErrorMsg(null);

    try {
      const result = await resendMutation.mutateAsync({
        challengeId: currentChallengeId,
      });

      setCurrentChallengeId(result.challengeId);
      setResendCooldown(60);
      setSecondsRemaining(600);
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setErrorMsg(err?.message || "Unable to resend verification code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="sm:max-w-[440px] p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl">
        <DialogHeader className="flex flex-col items-center text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-1">
            {isSuccess ? (
              <CheckCircle2 className="w-7 h-7 text-emerald-500 animate-in zoom-in-50 duration-300" />
            ) : (
              <ShieldCheck className="w-7 h-7" />
            )}
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 dark:text-slate-400 max-w-[340px]">
            {description}
          </DialogDescription>
          {currentMaskedEmail && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
              <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
              <span>{currentMaskedEmail}</span>
            </div>
          )}
        </DialogHeader>

        {errorMsg && (
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 6 Digit Numeric OTP Inputs */}
        <div className="flex justify-center gap-2.5 my-3">
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => {
                inputRefs.current[idx] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              disabled={isVerifying || isSuccess}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              onPaste={idx === 0 ? handlePaste : undefined}
              className={`w-12 h-13 text-center text-xl font-mono font-bold rounded-xl border bg-slate-50/50 dark:bg-slate-800/50 transition-all outline-none focus:ring-2 focus:ring-indigo-500 ${
                digit
                  ? "border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-sm"
                  : "border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              }`}
            />
          ))}
        </div>

        {/* Expiry & Resend Controls */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
          <div className="flex items-center gap-1">
            <span>Code expires in:</span>
            <span
              className={`font-semibold font-mono ${
                secondsRemaining < 60 ? "text-red-500 animate-pulse" : "text-slate-700 dark:text-slate-300"
              }`}
            >
              {formatTime(secondsRemaining)}
            </span>
          </div>

          <button
            type="button"
            disabled={resendCooldown > 0 || isResending || isSuccess}
            onClick={handleResend}
            className={`inline-flex items-center gap-1 font-medium transition-colors ${
              resendCooldown > 0 || isResending || isSuccess
                ? "text-slate-400 dark:text-slate-600 cursor-not-allowed"
                : "text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 cursor-pointer"
            }`}
          >
            <RefreshCw className={`w-3 h-3 ${isResending ? "animate-spin" : ""}`} />
            {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : "Resend Code"}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isVerifying || isSuccess}
            className="flex-1 rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={() => handleVerify()}
            disabled={isVerifying || digits.some((d) => !d) || isSuccess}
            className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Verifying...
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Verified
              </>
            ) : (
              "Confirm"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
