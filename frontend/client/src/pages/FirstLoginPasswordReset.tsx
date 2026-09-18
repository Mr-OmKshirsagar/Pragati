import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth, ROLE_CONFIG } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ShieldAlert,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Loader2,
  LogOut,
  Sparkles,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function FirstLoginPasswordReset() {
  const [, setLocation] = useLocation();
  const { user, role, logout, updateMustChangePassword } = useAuth();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const resetMutation = trpc.auth.completeFirstLoginPasswordReset.useMutation();

  // Criteria calculations
  const criteria = useMemo(() => {
    return {
      hasMinLength: newPassword.length >= 8,
      hasUpper: /[A-Z]/.test(newPassword),
      hasLower: /[a-z]/.test(newPassword),
      hasNumberOrSpecial: /[\d\W_]/.test(newPassword),
      matches: newPassword.length > 0 && newPassword === confirmPassword,
    };
  }, [newPassword, confirmPassword]);

  const strengthScore = useMemo(() => {
    let score = 0;
    if (criteria.hasMinLength) score++;
    if (criteria.hasUpper) score++;
    if (criteria.hasLower) score++;
    if (criteria.hasNumberOrSpecial) score++;
    return score;
  }, [criteria]);

  const isValid =
    criteria.hasMinLength &&
    criteria.hasUpper &&
    criteria.hasLower &&
    criteria.hasNumberOrSpecial &&
    criteria.matches;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await resetMutation.mutateAsync({
        userId: user?.id,
        email: user?.email,
        newPassword,
        confirmPassword,
      });

      if (res.success) {
        setIsSuccess(true);
        updateMustChangePassword(false);
        toast.success(res.message || "Password updated successfully!");

        setTimeout(() => {
          const destination = ROLE_CONFIG[role]?.defaultPath || "/overview";
          setLocation(destination);
        }, 1200);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to update password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  const roleConfig = ROLE_CONFIG[role];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20">
      <div className="w-full max-w-lg">
        <Card className="border border-slate-200 dark:border-slate-800 shadow-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-2xl overflow-hidden">
          {/* Header Banner */}
          <div className="h-2 bg-gradient-to-r from-amber-500 via-indigo-600 to-teal-500" />

          <CardHeader className="text-center pt-8 pb-4">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-3 shadow-inner">
              {isSuccess ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-500 animate-in zoom-in-50 duration-300" />
              ) : (
                <ShieldAlert className="w-7 h-7" />
              )}
            </div>

            <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Mandatory First-Login Password Reset
            </CardTitle>

            <CardDescription className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
              Your account was provisioned with a temporary password. Under institutional security policy, you must establish a new, confidential password before proceeding to your portal.
            </CardDescription>

            {/* Authenticated User Pill */}
            {user && (
              <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300">
                <KeyRound className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="font-semibold">{user.name}</span>
                <span>·</span>
                <span className="text-slate-500 dark:text-slate-400">{user.email}</span>
                <Badge variant="outline" className={`ml-1 text-[10px] py-0 px-1.5 ${roleConfig?.themeTone}`}>
                  {roleConfig?.label || role}
                </Badge>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-5 px-6 pt-2 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-500" />
                  New Password
                </label>
                <div className="relative">
                  <Input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter at least 8 characters"
                    disabled={isSubmitting || isSuccess}
                    className="pr-10 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-500" />
                  Confirm New Password
                </label>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    disabled={isSubmitting || isSuccess}
                    className="pr-10 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Strength Meter */}
              {newPassword.length > 0 && (
                <div className="space-y-2 pt-1 pb-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Password Strength:</span>
                    <span
                      className={`font-semibold ${
                        strengthScore <= 1
                          ? "text-red-500"
                          : strengthScore <= 3
                          ? "text-amber-500"
                          : "text-emerald-500"
                      }`}
                    >
                      {strengthScore <= 1
                        ? "Weak"
                        : strengthScore <= 3
                        ? "Moderate"
                        : "Strong & Compliant"}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 h-1.5">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`rounded-full transition-all duration-300 ${
                          strengthScore >= step
                            ? strengthScore <= 1
                              ? "bg-red-500"
                              : strengthScore <= 3
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                            : "bg-slate-200 dark:bg-slate-800"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Requirements Checklist */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-2 text-xs">
                <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Institutional Security Rules:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    {criteria.hasMinLength ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span className={criteria.hasMinLength ? "text-emerald-700 dark:text-emerald-400 font-medium" : ""}>
                      At least 8 characters
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {criteria.hasUpper ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span className={criteria.hasUpper ? "text-emerald-700 dark:text-emerald-400 font-medium" : ""}>
                      Uppercase letter (A-Z)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {criteria.hasLower ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span className={criteria.hasLower ? "text-emerald-700 dark:text-emerald-400 font-medium" : ""}>
                      Lowercase letter (a-z)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {criteria.hasNumberOrSpecial ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span className={criteria.hasNumberOrSpecial ? "text-emerald-700 dark:text-emerald-400 font-medium" : ""}>
                      Number or symbol (0-9, #!$)
                    </span>
                  </div>
                </div>

                <div className="pt-1 border-t border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                  {criteria.matches ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  <span className={criteria.matches ? "text-emerald-700 dark:text-emerald-400 font-medium" : ""}>
                    Passwords match
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={!isValid || isSubmitting || isSuccess}
                className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-500/20 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating Password & Dispatching Receipt...
                  </>
                ) : isSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-300" />
                    Password Updated! Redirecting...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Set Secure Password & Enter PRAGATI
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="bg-slate-50/80 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Security notice: A confirmation alert will be sent to your registered email upon update.</span>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 font-medium cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
