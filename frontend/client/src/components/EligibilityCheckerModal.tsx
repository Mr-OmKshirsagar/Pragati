import { trpc } from "@/lib/trpc";
import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  GraduationCap,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  X,
  XCircle,
} from "lucide-react";
import React from "react";
import { toast } from "sonner";

interface EligibilityCheckerModalProps {
  driveId: string;
  companyName: string;
  roleName: string;
  onClose: () => void;
  onApply?: () => void;
}

export default function EligibilityCheckerModal({
  driveId,
  companyName,
  roleName,
  onClose,
  onApply,
}: EligibilityCheckerModalProps) {
  const utils = trpc.useUtils();
  const eligibilityQuery = trpc.placement.checkMyEligibility.useQuery(
    { driveId },
    {
      refetchOnWindowFocus: false,
    }
  );

  const applyMutation = trpc.recruitment.applyToDrive.useMutation({
    onSuccess: () => {
      toast.success(`Application submitted for ${companyName}!`, {
        description: "Your verified profile and snapshot have been recorded in the T&P candidate pipeline.",
      });
      utils.recruitment.getMyApplications.invalidate();
      if (onApply) {
        onApply();
      }
      onClose();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to submit application");
    },
  });

  const { data, isLoading, isError, error } = eligibilityQuery;

  const handleApply = async () => {
    if (!data?.eligible) {
      toast.error("You are not eligible to apply for this opportunity yet.");
      return;
    }
    await applyMutation.mutateAsync({ driveId });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#dfe5ef] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#eef1f6] bg-gradient-to-r from-[#f8faff] to-[#f4f7fd]">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-[#182643]">
                  Placement Eligibility Checker
                </h3>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  Rule AST Engine
                </span>
              </div>
              <p className="text-xs text-[#71809a]">
                Deterministic verification for {roleName} @ {companyName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[#8b99bd] hover:bg-slate-100 hover:text-[#182643] transition"
            aria-label="Close eligibility modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {isLoading ? (
            <div className="py-14 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <div className="mt-3 text-sm font-bold text-[#182643]">
                Evaluating Profile Snapshot...
              </div>
              <p className="mt-1 text-xs text-[#71809a]">
                Checking CGPA, backlogs, latest skill assessment scores, and internship records against rule AST.
              </p>
            </div>
          ) : isError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-rose-500" />
              <div className="mt-2 text-sm font-bold text-rose-900">
                Eligibility Evaluation Failed
              </div>
              <p className="mt-1 text-xs text-rose-700">
                {error?.message || "Failed to load candidate criteria."}
              </p>
            </div>
          ) : data ? (
            <>
              {/* Status Banner */}
              <div
                className={`rounded-2xl p-5 border transition-all ${
                  data.eligible
                    ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                    : "bg-rose-50/80 border-rose-200 text-rose-950"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white ${
                      data.eligible ? "bg-[#13876f]" : "bg-[#c24152]"
                    }`}
                  >
                    {data.eligible ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      <XCircle className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold tracking-tight">
                      {data.eligible
                        ? "You are Eligible to Apply!"
                        : "Not Currently Eligible"}
                    </h4>
                    <p className="mt-1 text-xs leading-relaxed opacity-90">
                      {data.eligible
                        ? `Your verified academic, skill, and internship credentials meet all benchmarks configured by Training & Placement for ${companyName}.`
                        : `Your verified profile did not pass one or more mandatory benchmarks. See the itemized breakdown below for transparent details.`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Candidate Snapshot Summary Bar */}
              {data.candidateSnapshot && (
                <div className="rounded-2xl border border-[#dfe5ef] bg-[#fbfcfe] p-4">
                  <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#8995aa] mb-2.5">
                    Live Verified Profile Snapshot
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="rounded-xl border border-[#e8edf5] bg-white p-2.5">
                      <div className="text-[10px] font-bold text-[#8995aa]">CGPA</div>
                      <div className="text-sm font-extrabold text-[#182643]">
                        {data.candidateSnapshot.cgpa.toFixed(2)}
                      </div>
                    </div>
                    <div className="rounded-xl border border-[#e8edf5] bg-white p-2.5">
                      <div className="text-[10px] font-bold text-[#8995aa]">Active Backlogs</div>
                      <div
                        className={`text-sm font-extrabold ${
                          data.candidateSnapshot.activeBacklogs === 0
                            ? "text-[#13876f]"
                            : "text-[#c24152]"
                        }`}
                      >
                        {data.candidateSnapshot.activeBacklogs}
                      </div>
                    </div>
                    <div className="rounded-xl border border-[#e8edf5] bg-white p-2.5">
                      <div className="text-[10px] font-bold text-[#8995aa]">DSA / Python</div>
                      <div className="text-sm font-extrabold text-[#182643]">
                        {data.candidateSnapshot.skills?.["DSA"] ?? "—"} /{" "}
                        {data.candidateSnapshot.skills?.["Python"] ?? "—"}
                      </div>
                    </div>
                    <div className="rounded-xl border border-[#e8edf5] bg-white p-2.5">
                      <div className="text-[10px] font-bold text-[#8995aa]">Internship</div>
                      <div
                        className={`text-xs font-extrabold mt-0.5 ${
                          data.candidateSnapshot.internshipStatus === "COMPLETED"
                            ? "text-[#13876f]"
                            : "text-[#bd7a27]"
                        }`}
                      >
                        {data.candidateSnapshot.internshipStatus}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Itemized Criteria Checklist */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-[#263653]">
                    Deterministic Criteria Breakdown
                  </span>
                  <span className="text-[11px] font-semibold text-[#8995aa]">
                    {data.criteriaResults?.filter((c: any) => c.passed).length} /{" "}
                    {data.criteriaResults?.length || data.reasons?.length || 0} passed
                  </span>
                </div>

                <div className="space-y-2.5">
                  {data.criteriaResults && data.criteriaResults.length > 0
                    ? data.criteriaResults.map((criterion: any, idx: number) => {
                        const isPass = criterion.passed;
                        return (
                          <div
                            key={idx}
                            className={`flex items-center justify-between p-3 rounded-xl border transition ${
                              isPass
                                ? "border-emerald-200 bg-[#f4faf7]"
                                : "border-rose-200 bg-[#fff5f6]"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${
                                  isPass
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-rose-100 text-rose-700"
                                }`}
                              >
                                {isPass ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <X className="h-4 w-4" />
                                )}
                              </span>
                              <div>
                                <div className="text-xs font-bold text-[#263653]">
                                  {criterion.field.startsWith("skill.")
                                    ? `${criterion.field.replace("skill.", "")} Assessment Score`
                                    : criterion.field === "cgpa"
                                    ? "Minimum Cumulative CGPA"
                                    : criterion.field === "active_backlogs"
                                    ? "Clean Backlog Record"
                                    : "Mandatory Internship Lifecycle"}
                                </div>
                                <div className="text-[10.5px] text-[#71809a] font-mono mt-0.5">
                                  Actual:{" "}
                                  <strong className={isPass ? "text-emerald-700" : "text-rose-700"}>
                                    {criterion.actualValue}
                                  </strong>{" "}
                                  {criterion.operator} Required:{" "}
                                  <strong>{criterion.expectedValue}</strong>
                                </div>
                              </div>
                            </div>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${
                                isPass
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {isPass ? "PASS" : "FAIL"}
                            </span>
                          </div>
                        );
                      })
                    : data.reasons?.map((reason: string, idx: number) => {
                        const isPass = reason.includes("[PASS]");
                        return (
                          <div
                            key={idx}
                            className={`flex items-center justify-between p-3 rounded-xl border ${
                              isPass
                                ? "border-emerald-200 bg-[#f4faf7]"
                                : "border-rose-200 bg-[#fff5f6]"
                            }`}
                          >
                            <span className="text-xs font-medium text-[#263653]">
                              {reason}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9.5px] font-extrabold ${
                                isPass
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {isPass ? "PASS" : "FAIL"}
                            </span>
                          </div>
                        );
                      })}
                </div>
              </div>

              {/* Explanatory Note */}
              <div className="rounded-xl border border-[#dfe5ef] bg-[#f8fafd] p-3 text-[11px] leading-relaxed text-[#64748b]">
                <strong>Algorithmic Transparency Guarantee:</strong> PRAGATI evaluates recruitment eligibility deterministically via Abstract Syntax Tree (AST) expressions. Decisions are derived strictly from cryptographically vaulted and institutionally verified records.
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#eef1f6] bg-[#fcfdfe]">
          <button
            onClick={onClose}
            className="rounded-xl border border-[#dfe5ef] bg-white px-4 py-2.5 text-xs font-bold text-[#52617d] hover:bg-slate-50 transition"
          >
            Close
          </button>
          <button
            onClick={handleApply}
            disabled={!data?.eligible || applyMutation.isPending}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-sm transition ${
              data?.eligible && !applyMutation.isPending
                ? "bg-[#13876f] hover:bg-[#0f6c58] cursor-pointer"
                : "bg-slate-300 cursor-not-allowed opacity-60"
            }`}
          >
            {applyMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Submitting Application...</span>
              </>
            ) : (
              <>
                <span>Proceed to Apply</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
