import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock3,
  Cpu,
  GraduationCap,
  ShieldAlert,
  Sparkles,
  TrendingDown,
} from "lucide-react";
import { useMemo } from "react";

export default function SkillGapAlert() {
  const [, navigate] = useLocation();
  const gapsQuery = trpc.skillGap.getMyGaps.useQuery();
  const gaps = gapsQuery.data ?? [];
  const primaryGap = gaps[0];

  const explainQuery = trpc.skillGap.explainGap.useQuery(
    { skillGapId: primaryGap?.id ?? "" },
    { enabled: Boolean(primaryGap?.id) }
  );

  const aiData = explainQuery.data;

  if (gapsQuery.isLoading) {
    return (
      <div className="animate-pulse rounded-2xl border border-[#f1d7a7] bg-[#fffaf1] p-5">
        <div className="h-5 w-48 rounded bg-[#f1ddb9]" />
        <div className="mt-3 h-12 rounded bg-[#f7ebd4]" />
      </div>
    );
  }

  if (!primaryGap) {
    return (
      <div className="rounded-2xl border border-[#d1fae5] bg-[#f0fdf4] p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#dcfce7] text-[#16a34a]">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#166534]">
              Zero Active Skill Gaps
            </div>
            <div className="text-xs text-[#15803d]">
              Continuous assessment scores are stable with no open backlogs.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const scoreHistory = primaryGap.reason?.score_history ?? [78, 70, 61];
  const latestScore = scoreHistory[scoreHistory.length - 1];
  const previousScore = scoreHistory[scoreHistory.length - 2];
  const drop = previousScore - latestScore;

  return (
    <section className="motion-enter overflow-hidden rounded-2xl border border-[#f1d7a7] bg-[#fffaf1] p-5 shadow-[0_16px_42px_rgba(139,91,24,0.06)] sm:p-6">
      {/* Header with Badges */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#fff0d2] text-[#bd7a27]">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-[#fbe7bb] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#9a6318]">
                RULE GENERATED FINDING
              </span>
              <span className="rounded-md bg-[#fee2e2] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#b91c1c]">
                {primaryGap.severity} SEVERITY
              </span>
            </div>
            <h3 className="mt-1 text-lg font-extrabold tracking-[-0.03em] text-[#4a3418]">
              Skill Gap Detected: {primaryGap.skillName}
            </h3>
          </div>
        </div>
        <span className="self-start rounded-full bg-[#fde8c2] px-3 py-1 text-[10px] font-bold text-[#9a6318] sm:self-auto">
          Rule: {primaryGap.ruleId}
        </span>
      </div>

      {/* Trajectory Breakdown */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[#f1ddb9] bg-white/70 p-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#a58a65]">
            Latest Score
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-extrabold text-[#a96d1c]">
              {latestScore}%
            </span>
            <span className="flex items-center text-xs font-bold text-[#b91c1c]">
              <TrendingDown className="h-3.5 w-3.5 mr-0.5" /> -{drop}%
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-[#f1ddb9] bg-white/70 p-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#a58a65]">
            Assessment Trajectory
          </div>
          <div className="mt-1 font-mono text-base font-extrabold text-[#6d5b44]">
            {scoreHistory.join(" → ")}%
          </div>
        </div>

        <div className="rounded-xl border border-[#f1ddb9] bg-white/70 p-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#a58a65]">
            Active Backlog
          </div>
          <div className="mt-1 truncate text-xs font-bold text-[#a96d1c]">
            {primaryGap.reason?.backlog_subject || "Active Backlog"}
          </div>
        </div>
      </div>

      {/* Assistive AI Explanation Box */}
      <div className="mt-4 rounded-xl border border-[#e2d5f8] bg-[#f8f5ff] p-4 text-[#4338ca]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-[#ede9fe] text-[#6d28d9]">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6d28d9]">
              {aiData?.source === "ai"
                ? "AI ASSISTIVE EXPLANATION (GEMINI)"
                : "RULE FALLBACK EXPLANATION"}
            </span>
          </div>
          <span className="text-[10px] text-[#7c3aed]">
            Contextual Briefing · Objective AI
          </span>
        </div>

        <p className="mt-2 text-xs leading-5 text-[#4c1d95]">
          {aiData?.explanation ||
            `${primaryGap.skillName} performance declined across consecutive cycles (${scoreHistory.join(
              " → "
            )}) while an active backlog in ${
              primaryGap.reason?.backlog_subject || "Core Engineering"
            } remains open.`}
        </p>

        {aiData?.recommendedAction && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-white/80 p-2.5 text-xs text-[#5b21b6]">
            <GraduationCap className="h-4 w-4 shrink-0 text-[#7c3aed] mt-0.5" />
            <span>
              <strong>Recommended Action:</strong> {aiData.recommendedAction}
            </span>
          </div>
        )}
      </div>

      {/* Action CTA */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#f1ddb9] pt-4">
        <span className="text-[11px] text-[#8f7555]">
          Detected automatically by the deterministic PRAGATI Skill Engine.
        </span>
        <button
          onClick={() => navigate("/progress")}
          className="flex items-center gap-1.5 rounded-xl bg-[#9a6318] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#784c10]"
        >
          View Progress &amp; Interventions <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </section>
  );
}
