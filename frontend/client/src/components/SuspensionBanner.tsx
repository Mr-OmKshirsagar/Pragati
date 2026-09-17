import React from "react";
import { ShieldAlert, AlertTriangle, LogOut, Mail, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface SuspensionBannerProps {
  reason?: string;
  onDismiss?: () => void;
}

export function SuspensionBanner({ reason, onDismiss }: SuspensionBannerProps) {
  const { logout } = useAuth();
  const displayReason =
    reason ||
    "This institution's access has been temporarily suspended by the Platform Owner pending administrative or compliance review.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-rose-500/30 bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-8 text-white shadow-2xl shadow-rose-950/50">
        {/* Glow accent */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 h-24 w-48 rounded-full bg-rose-600/20 blur-2xl pointer-events-none" />

        {/* Icon & Header */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-500/40 bg-rose-500/10 text-rose-400 shadow-inner">
            <ShieldAlert className="h-9 w-9" />
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-rose-400">
            <Lock className="h-3 w-3" /> Institutional Access Suspended
          </span>

          <h2 className="mt-3 text-xl font-bold tracking-tight text-white sm:text-2xl">
            Platform Governance Notice
          </h2>

          <p className="mt-2 text-sm text-slate-300">
            Access to this portal has been locked by the Platform Owner. All student profiles, faculty records, and evidence vaults remain safely preserved and intact.
          </p>
        </div>

        {/* Reason Box */}
        <div className="mt-6 rounded-xl border border-rose-500/30 bg-rose-950/20 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-300">
                Official Reason Recorded:
              </p>
              <p className="mt-1 text-sm font-medium text-rose-100 leading-relaxed">
                "{displayReason}"
              </p>
            </div>
          </div>
        </div>

        {/* Preserved Data Notice */}
        <div className="mt-4 rounded-lg bg-slate-800/50 p-3 text-xs text-slate-400 text-center border border-slate-700/50">
          🛡️ Institutional data integrity guarantee: Zero records deleted. System reactivation will instantly restore all roles and access.
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              logout();
              window.location.href = "/login";
            }}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2.5 text-sm font-semibold text-white transition shadow-sm"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
          <a
            href="mailto:governance@pragati.edu?subject=Inquiry%20Regarding%20Institution%20Suspension"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition shadow-lg shadow-rose-900/30"
          >
            <Mail className="h-4 w-4" /> Contact Governance
          </a>
        </div>
      </div>
    </div>
  );
}
