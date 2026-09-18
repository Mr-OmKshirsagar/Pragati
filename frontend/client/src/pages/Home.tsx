import PragatiFrame from "@/components/PragatiFrame";
import SkillGapAlert from "@/components/SkillGapAlert";
import { trpc } from "@/lib/trpc";
import type { Opportunity, StudentDashboard } from "@shared/pragati";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileCheck2,
  FileText,
  GraduationCap,
  Layers,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  UploadCloud,
  UsersRound,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const dashboardQuery = trpc.student.dashboard.useQuery();
  const opportunitiesQuery = trpc.student.opportunities.useQuery();

  return (
    <PragatiFrame title="Overview" activePath="/student/overview">
      <main className="min-h-[calc(100vh-70px)] bg-[#F8FAFC] px-4 py-6 sm:px-8 xl:px-10 pb-24 text-[#1C2128]">
        <div className="mx-auto max-w-[1280px] space-y-6">
          {dashboardQuery.isLoading ? (
            <DashboardSkeleton />
          ) : dashboardQuery.isError || !dashboardQuery.data ? (
            <DashboardError onRetry={() => dashboardQuery.refetch()} />
          ) : (
            <StudentFullDashboard
              data={dashboardQuery.data as any}
              opportunities={(opportunitiesQuery.data?.opportunities as any) ?? []}
              opportunitiesLoading={opportunitiesQuery.isLoading}
            />
          )}
        </div>
      </main>
    </PragatiFrame>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Comprehensive Related Student Dashboard (ShikshaSetu Aesthetic)
// ═══════════════════════════════════════════════════════════════════════════

function StudentFullDashboard({
  data,
  opportunities,
  opportunitiesLoading,
}: {
  data: StudentDashboard;
  opportunities: Opportunity[];
  opportunitiesLoading: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* 1. Capability Hero Banner */}
      <CapabilityHeroBanner data={data} />

      {/* 2. Deterministic Career Readiness Scorecard Banner */}
      <CareerReadinessScorecardSection data={data} />

      {/* 3. Four Metric Cards Row (Actual Student Metrics) */}
      <StudentMetricsRow data={data} />

      {/* 4. Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6 items-start">
        {/* Left Column: Skill Gap Alert + Competencies Profile + Career Timeline */}
        <div className="space-y-6">
          <SkillGapAlert />
          <CompetencyProfileSection data={data} />
          <CareerTimelineSection data={data} />
        </div>

        {/* Right Column: Next Best Actions + Active Internship + Campus Drives */}
        <div className="space-y-6">
          <NextBestActionsSection data={data} />
          <CorporateAttachmentCard data={data} />
          <PlacementGatewaySection
            opportunities={opportunities}
            loading={opportunitiesLoading}
          />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Oceanic Navy/Teal Hero Banner
// ═══════════════════════════════════════════════════════════════════════════

function CapabilityHeroBanner({ data }: { data: StudentDashboard }) {
  const [, navigate] = useLocation();
  const firstName = data.student.name.split(" ")[0] || "Rahul";

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 12 && hour < 17) return "Good afternoon";
    if (hour >= 17) return "Good evening";
    return "Good morning";
  }, []);

  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold text-[#71809a]">
        <span>Learner Workspace</span>
        <span className="text-[#d0d8e6]">/</span>
        <span className="text-primary font-bold">Overview</span>
      </div>
      <div className="grid grid-cols-[1fr_auto] items-start gap-4 sm:items-end">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.04em] text-[#182643] sm:text-[34px]">
            {greeting}, {firstName}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#6c7890]">
            <span className="flex items-center gap-1.5 font-medium text-[#334155]">
              <Briefcase className="h-3.5 w-3.5 text-primary" />
              <span>{data.student.program}</span>
            </span>
            <span className="text-[#cbd5e1]">·</span>
            <span className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-[#8290a7]" />
              <span>{data.student.institution} · CS-2023-0842</span>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => navigate("/student/skills")}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#F97316] to-[#EA580C] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-950/20 hover:from-[#EA580C] hover:to-[#C2410C] active:scale-95 transition-all"
          >
            <FileText className="h-4 w-4" />
            <span>Take Assessment</span>
          </button>

          <button
            onClick={() => navigate("/student/career-passport")}
            className="inline-flex items-center gap-2 rounded-xl border border-[#dfe5ef] bg-white px-4 py-2.5 text-xs font-bold text-[#334155] shadow-xs hover:bg-slate-50 active:scale-95 transition-all"
          >
            <BookOpen className="h-4 w-4 text-primary" />
            <span>View Career Passport</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. Deterministic Career Readiness Scorecard Section
// ═══════════════════════════════════════════════════════════════════════════

function CareerReadinessScorecardSection({ data }: { data: any }) {
  const scorecard = data?.readinessScorecard || {
    readinessScore: 87.26,
    methodologyExplanation:
      "A deterministic weighted average of four transparent progress indicators: (Academic 30%) + (Skill Coverage 30%) + (Internship 20%) + (Verified Evidence 20%). It is not an AI-generated employability score.",
    formula: "ReadinessScore = (A * 0.30) + (S * 0.30) + (I * 0.20) + (E * 0.20)",
    breakdown: {
      academic: { rawCgpa: 8.42, percentage: 84.2, weight: 0.3, weightedContribution: 25.26 },
      skills: { totalCoreSkills: 5, skillsAboveThreshold: 4, percentage: 80, weight: 0.3, weightedContribution: 24 },
      internship: { completeness: 100, weight: 0.2, weightedContribution: 20 },
      evidence: { totalClaims: 10, verifiedClaims: 9, percentage: 90, weight: 0.2, weightedContribution: 18 },
    },
  };

  const { readinessScore, formula, breakdown, methodologyExplanation } = scorecard;

  return (
    <section className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Target className="h-6 w-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-primary">
              <span>CAREER READINESS SCORECARD</span>
              <span>·</span>
              <span>DETERMINISTIC FORMULA</span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">
              Transparent Institutional Readiness Index
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="font-mono text-2xl sm:text-3xl font-black text-primary">
              {readinessScore}%
            </div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
              {readinessScore >= 80 ? "Tier-1 Placement Ready" : "On Track"}
            </span>
          </div>

          <button
            onClick={() => window.location.assign("/student/career-passport")}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 active:scale-95 transition shadow-xs"
          >
            <BookOpen className="h-3.5 w-3.5 text-cyan-300" />
            <span>Open Passport</span>
          </button>
        </div>
      </div>

      {/* 4 Pillars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Academic */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
              Academic Progress
            </span>
            <span className="font-mono text-xs font-extrabold text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-200">
              30% Weight
            </span>
          </div>
          <div className="font-mono text-2xl font-black text-slate-900">
            {breakdown.academic.percentage}%
          </div>
          <div className="h-1.5 w-full rounded-full bg-blue-200/60 overflow-hidden">
            <div className="h-full rounded-full bg-blue-600" style={{ width: `${breakdown.academic.percentage}%` }} />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
            <span>CGPA {breakdown.academic.rawCgpa} / 10</span>
            <span className="font-bold text-blue-800">+{breakdown.academic.weightedContribution}%</span>
          </div>
        </div>

        {/* Skill Coverage */}
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
              Skill Coverage
            </span>
            <span className="font-mono text-xs font-extrabold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
              30% Weight
            </span>
          </div>
          <div className="font-mono text-2xl font-black text-slate-900">
            {breakdown.skills.percentage}%
          </div>
          <div className="h-1.5 w-full rounded-full bg-emerald-200/60 overflow-hidden">
            <div className="h-full rounded-full bg-emerald-600" style={{ width: `${breakdown.skills.percentage}%` }} />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
            <span>{breakdown.skills.skillsAboveThreshold} of {breakdown.skills.totalCoreSkills} core &ge; 70</span>
            <span className="font-bold text-emerald-800">+{breakdown.skills.weightedContribution}%</span>
          </div>
        </div>

        {/* Internship */}
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">
              Internship Evidence
            </span>
            <span className="font-mono text-xs font-extrabold text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
              20% Weight
            </span>
          </div>
          <div className="font-mono text-2xl font-black text-slate-900">
            {breakdown.internship.completeness}%
          </div>
          <div className="h-1.5 w-full rounded-full bg-indigo-200/60 overflow-hidden">
            <div className="h-full rounded-full bg-indigo-600" style={{ width: `${breakdown.internship.completeness}%` }} />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
            <span>Milestones Verified</span>
            <span className="font-bold text-indigo-800">+{breakdown.internship.weightedContribution}%</span>
          </div>
        </div>

        {/* Evidence */}
        <div className="rounded-2xl border border-purple-100 bg-purple-50/40 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider">
              Verified Claims
            </span>
            <span className="font-mono text-xs font-extrabold text-purple-700 bg-white px-2 py-0.5 rounded-md border border-purple-200">
              20% Weight
            </span>
          </div>
          <div className="font-mono text-2xl font-black text-slate-900">
            {breakdown.evidence.percentage}%
          </div>
          <div className="h-1.5 w-full rounded-full bg-purple-200/60 overflow-hidden">
            <div className="h-full rounded-full bg-purple-600" style={{ width: `${breakdown.evidence.percentage}%` }} />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
            <span>{breakdown.evidence.verifiedClaims} of {breakdown.evidence.totalClaims} verified</span>
            <span className="font-bold text-purple-800">+{breakdown.evidence.weightedContribution}%</span>
          </div>
        </div>
      </div>

      {/* Methodology Formula Disclaimer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <span className="leading-relaxed italic">
            "{methodologyExplanation}"
          </span>
        </div>
        <div className="font-mono font-bold text-slate-800 shrink-0 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
          {formula}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. Four Student Metric Cards Row
// ═══════════════════════════════════════════════════════════════════════════

function StudentMetricsRow({ data }: { data: StudentDashboard }) {
  const [, navigate] = useLocation();
  const cards = [
    {
      label: "ACADEMIC CGPA",
      value: "8.42",
      delta: "+0.18 vs last semester",
      icon: GraduationCap,
      color: "bg-blue-50 text-blue-700",
      link: "/student/progress",
      actionText: "View transcript",
    },
    {
      label: "VERIFIED SKILLS",
      value: "07",
      delta: "+2 this semester",
      icon: Target,
      color: "bg-emerald-50 text-emerald-700",
      link: "/student/skills",
      actionText: "Skill framework",
    },
    {
      label: "ACHIEVEMENTS",
      value: "12",
      delta: "09 verified across 4 categories",
      icon: Award,
      color: "bg-purple-50 text-purple-700",
      link: "/student/achievements",
      actionText: "Verified ledger",
    },
    {
      label: "INTERNSHIP",
      value: "Active",
      delta: "Atlas Labs · 68% completed",
      icon: Briefcase,
      color: "bg-amber-50 text-amber-700",
      link: "/student/internship",
      actionText: "Evidence status",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase font-mono">
                  {card.label}
                </span>
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-4">
                <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
                  {card.value}
                </div>
                <div className="mt-1 text-xs text-slate-500 font-medium">
                  {card.delta}
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate(card.link)}
              className="mt-4 flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-primary transition-colors pt-2 border-t border-slate-100"
            >
              <span>{card.actionText}</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. Targeted Skill Gap & Deterministic Rule Finding
// ═══════════════════════════════════════════════════════════════════════════

function TargetedSkillGapAlert({ data }: { data: StudentDashboard }) {
  const [, navigate] = useLocation();

  return (
    <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-50/40 via-white to-white p-6 sm:p-7 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-amber-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-800">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/70 px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-amber-800">
              <span>SKILL GAP DETECTED</span>
              <span>·</span>
              <span>DETERMINISTIC RULE ENGINE</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-1">
              {data.skillGap.skill} Performance Drift (61%)
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
          <span>78%</span>
          <span className="text-amber-500">→</span>
          <span>70%</span>
          <span className="text-amber-600">→</span>
          <span className="text-amber-700 font-extrabold">61%</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-4 text-xs">
          <div className="font-bold text-amber-900 mb-1 flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 text-amber-700" />
            <span>Rule Trigger Reason:</span>
          </div>
          <p className="text-amber-800 leading-relaxed font-medium">
            {data.skillGap.reason} OS score dropped by 9% across two assessment cycles while the OS backlog remains unverified.
          </p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-[#F8FAFC] p-4 text-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-700 font-bold">
            <Sparkles className="h-4 w-4 text-teal-600" />
            <span>AI-Assisted Contextual Guidance:</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Your performance decline is isolated to Concurrency, Thread Synchronization, and Virtual Memory. Complete the faculty-recommended peer remedial session with Dr. Meera Nair to regain eligibility before the upcoming recruitment drive cutoffs.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <span className="text-xs text-slate-500 font-medium">
          Assigned Mentor: <strong className="text-slate-800">Dr. Meera Nair (Dept of CSE)</strong>
        </span>

        <button
          onClick={() => navigate("/student/mentoring")}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 active:scale-95 transition-all"
        >
          <span>Schedule Mentoring Session</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. Competency Profile Section (Real Skills Breakdown)
// ═══════════════════════════════════════════════════════════════════════════

function CompetencyProfileSection({ data }: { data: StudentDashboard }) {
  const [, navigate] = useLocation();
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Verified Technical Competencies</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Validated framework assessment scores with historical trend telemetry.
          </p>
        </div>

        <button
          onClick={() => navigate("/student/skills")}
          className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
        >
          Full Skill Matrix
        </button>
      </div>

      <div className="space-y-4">
        {data.skillProfile.map((skill) => {
          const isGap = skill.delta < 0;
          return (
            <div
              key={skill.label}
              className="rounded-xl border border-slate-100 bg-[#FBFDFE] p-4 space-y-3 hover:border-slate-200 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 font-mono">
                    {skill.label}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    · Tested on {skill.assessmentDate}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-extrabold text-slate-900">
                    {skill.score}%
                  </span>
                  <span
                    className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10.5px] font-bold ${isGap
                        ? "bg-amber-50 text-amber-800 border border-amber-200"
                        : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      }`}
                  >
                    {isGap ? (
                      <TrendingDown className="h-3 w-3 text-amber-600" />
                    ) : (
                      <TrendingUp className="h-3 w-3 text-emerald-600" />
                    )}
                    <span>{skill.delta > 0 ? `+${skill.delta}%` : `${skill.delta}%`}</span>
                  </span>
                </div>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isGap ? "bg-amber-500" : "bg-primary"
                    }`}
                  style={{ width: `${skill.score}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
                <span className="font-mono text-[11px]">
                  History: {skill.series.join(" → ")}%
                </span>
                <button
                  onClick={() => navigate("/student/skills")}
                  className="font-semibold text-primary hover:text-blue-700 flex items-center gap-1"
                >
                  <span>Assessment history</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. Student Career Timeline & Pathway
// ═══════════════════════════════════════════════════════════════════════════

function CareerTimelineSection({ data }: { data: StudentDashboard }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Career Pathway & Milestones</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Institutional progression log from academic foundation to placement qualification.
        </p>
      </div>

      <div className="space-y-4">
        {data.timeline.map((event, idx) => {
          const isComplete = event.state === "complete";
          const isCurrent = event.state === "current";

          return (
            <div key={`${event.year}-${event.title}`} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${isComplete
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : isCurrent
                        ? "bg-cyan-600 text-white ring-4 ring-cyan-100 animate-pulse"
                        : "bg-slate-100 text-slate-400 border border-slate-200"
                    }`}
                >
                  {isComplete ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                </div>
                {idx < data.timeline.length - 1 && (
                  <div className="h-10 w-0.5 bg-slate-200 my-1" />
                )}
              </div>

              <div className="pt-0.5 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">{event.title}</span>
                  <span className="font-mono text-[10px] text-slate-400 font-semibold">
                    {event.year}
                  </span>
                  {isCurrent && (
                    <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[9.5px] font-bold text-cyan-800 border border-cyan-200">
                      In Progress
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{event.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. Next Best Actions Feed (Right Column)
// ═══════════════════════════════════════════════════════════════════════════

function NextBestActionsSection({ data }: { data: StudentDashboard }) {
  const [, navigate] = useLocation();
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900">
            Next Best Actions
          </h3>
          <p className="text-[11px] text-slate-500">3 prioritized intervention items</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800 border border-emerald-200">
          High Priority
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {data.actions.map((action) => (
          <div
            key={action.title}
            className="py-3.5 first:pt-1 last:pb-1 flex items-start justify-between gap-3 text-xs"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">{action.title}</span>
                <span
                  className={`rounded px-1.5 py-0.2 text-[9.5px] font-bold uppercase ${action.tone === "amber"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : action.tone === "blue"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-purple-50 text-purple-700 border border-purple-200"
                    }`}
                >
                  {action.tag}
                </span>
              </div>
              <p className="text-[11.5px] text-slate-500">{action.detail}</p>
            </div>

            <button
              onClick={() => {
                if (action.title.includes("OS mentoring")) navigate("/student/mentoring");
                else if (action.title.includes("internship")) navigate("/student/internship");
                else navigate("/student/opportunities");
              }}
              className="shrink-0 text-slate-400 hover:text-primary pt-1"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 8. Corporate Attachment (Active Internship)
// ═══════════════════════════════════════════════════════════════════════════

function CorporateAttachmentCard({ data }: { data: StudentDashboard }) {
  const [, navigate] = useLocation();
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900">
            Corporate Attachment
          </h3>
          <p className="text-[11px] text-slate-500">
            {data.internship.company} · {data.internship.role}
          </p>
        </div>
        <button
          onClick={() => navigate("/student/internship")}
          className="text-xs font-semibold text-primary hover:text-blue-700"
        >
          Manage
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-slate-600">
          <span>Evidence Collection</span>
          <span className="font-bold text-slate-900 font-mono">
            {data.internship.progress}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${data.internship.progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-2 pt-1">
        {data.internship.evidence.map((ev) => {
          const isVerified = ev.state === "verified";
          const isPending = ev.state === "pending";

          return (
            <div
              key={ev.label}
              className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${isVerified
                      ? "bg-emerald-500"
                      : isPending
                        ? "bg-amber-500 animate-pulse"
                        : "bg-slate-300"
                    }`}
                />
                <span className="font-medium text-slate-700">{ev.label}</span>
              </div>
              <span
                className={`text-[10.5px] font-semibold ${isVerified
                    ? "text-emerald-700"
                    : isPending
                      ? "text-amber-700"
                      : "text-slate-400"
                  }`}
              >
                {isVerified ? "Verified ✓" : isPending ? "Review Pending" : "Not Started"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 9. Placement Gateway (Recruitment Opportunities)
// ═══════════════════════════════════════════════════════════════════════════

function PlacementGatewaySection({
  opportunities,
  loading,
}: {
  opportunities: Opportunity[];
  loading: boolean;
}) {
  const [, navigate] = useLocation();
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900">
            Placement Gateway
          </h3>
          <p className="text-[11px] text-slate-500">Corporate recruitment drives</p>
        </div>
        <button
          onClick={() => navigate("/student/opportunities")}
          className="text-xs font-semibold text-primary hover:text-blue-700"
        >
          View All ({opportunities.length})
        </button>
      </div>

      <div className="divide-y divide-slate-100">
        {loading ? (
          <div className="py-4 text-center text-xs text-slate-400">Loading drives...</div>
        ) : opportunities.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-400">No active drives</div>
        ) : (
          opportunities.slice(0, 3).map((opp) => {
            const isEligible = opp.eligibilityStatus === "Eligible";
            return (
              <div
                key={opp.id}
                className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">{opp.company}</div>
                  <div className="text-[11px] text-slate-500">{opp.role} · ₹18.5 LPA</div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isEligible
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                  >
                    {isEligible ? "Eligible" : "Pending"}
                  </span>
                  <button
                    onClick={() => setSelectedOpp(opp)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedOpp && (
        <OpportunityCriteriaModal
          opportunity={selectedOpp}
          onClose={() => setSelectedOpp(null)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Criteria Modal
// ═══════════════════════════════════════════════════════════════════════════

function OpportunityCriteriaModal({
  opportunity,
  onClose,
}: {
  opportunity: Opportunity;
  onClose: () => void;
}) {
  const [, navigate] = useLocation();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{opportunity.company}</h3>
            <p className="text-xs text-slate-500">{opportunity.role}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-2.5">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Role Eligibility Criteria
          </div>
          {opportunity.criteria.map((crit) => (
            <div
              key={crit.label}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs"
            >
              <div>
                <span className="font-semibold text-slate-800">{crit.label}</span>
                <span className="ml-2 text-slate-500">
                  (Required: {crit.expected}, Your: {crit.actual})
                </span>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${crit.pass
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
              >
                {crit.pass ? "Met" : "Not Met"}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => navigate("/student/opportunities")}
            className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-xs transition-colors"
          >
            Go to Drive Application
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Skeletons and Errors
// ═══════════════════════════════════════════════════════════════════════════

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-48 rounded-xl bg-slate-200" />
      <div className="h-44 rounded-3xl bg-slate-200" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-2xl bg-slate-200" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6">
        <div className="h-96 rounded-2xl bg-slate-200" />
        <div className="h-96 rounded-2xl bg-slate-200" />
      </div>
    </div>
  );
}

function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="grid min-h-[360px] place-items-center text-center">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <AlertTriangle className="mx-auto h-8 w-8 text-[#B8620C]" />
        <h2 className="mt-3 text-base font-bold text-slate-900">
          Unable to retrieve capability profile
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          The institutional database did not return your records. Please retry.
        </p>
        <button
          onClick={onRetry}
          className="mt-4 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
