import PragatiFrame from "@/components/PragatiFrame";
import { trpc } from "@/lib/trpc";
import type { Opportunity, StudentDashboard } from "@shared/pragati";
import { motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
  Briefcase,
  BriefcaseBusiness,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Compass,
  Download,
  ExternalLink,
  FileCheck2,
  FileText,
  Gauge,
  Globe,
  GraduationCap,
  Layers,
  LogOut,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  UserCheck,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function Home() {
  const dashboardQuery = trpc.student.dashboard.useQuery();
  const opportunitiesQuery = trpc.student.opportunities.useQuery();

  return (
    <PragatiFrame title="Dashboard" activePath="/overview">
      <main className="min-h-[calc(100vh-70px)] bg-[#F8FAFC] px-4 py-6 sm:px-8 xl:px-10 pb-24 text-[#1C2128]">
        <div className="mx-auto max-w-[1280px] space-y-6">
          {dashboardQuery.isLoading ? (
            <DashboardSkeleton />
          ) : dashboardQuery.isError || !dashboardQuery.data ? (
            <DashboardError onRetry={() => dashboardQuery.refetch()} />
          ) : (
            <ShikshaSetuStyleDashboard
              data={dashboardQuery.data}
              opportunities={opportunitiesQuery.data?.opportunities ?? []}
              opportunitiesLoading={opportunitiesQuery.isLoading}
            />
          )}
        </div>
      </main>
    </PragatiFrame>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ShikshaSetu-Inspired Institutional Dashboard
// ═══════════════════════════════════════════════════════════════════════════

function ShikshaSetuStyleDashboard({
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
      {/* 1. Top Sub-Bar (Breadcrumb + Assistant Badge + Language + Profile) */}
      <TopContextBar data={data} />

      {/* 2. Iconic Oceanic Navy/Teal Hero Banner */}
      <CapabilityHeroBanner data={data} />

      {/* 3. Four Metric Cards Row (Matching ShikshaSetu exact card structure) */}
      <MetricCardsRow data={data} />

      {/* 4. Main Two-Column Layout (Left: Priority Skill Gaps | Right: Next Best Action + Drives) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6 items-start">
        {/* Left Column: Priority Skill Gaps */}
        <PrioritySkillGapsSection data={data} />

        {/* Right Column: Next Best Action & Auxiliary Modules */}
        <div className="space-y-6">
          <NextBestActionCard data={data} />
          <CampusRecruitmentSection
            opportunities={opportunities}
            loading={opportunitiesLoading}
          />
          <InternshipMilestonesCard data={data} />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. Top Context Sub-Bar
// ═══════════════════════════════════════════════════════════════════════════

function TopContextBar({ data }: { data: StudentDashboard }) {
  const [lang, setLang] = useState<"en" | "hi">("en");

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
      {/* Breadcrumb Workspace Title */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          PRAGATI WORKSPACE
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Dashboard
        </h1>
      </div>

      {/* Right Utility Pills */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* AI Assistant Pill */}
        <button
          onClick={() => window.location.assign("/mentoring")}
          className="inline-flex items-center gap-2 rounded-full bg-[#0C2D48] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#103E54] transition-all"
        >
          <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
          <span>PRAGATI AI Assistant</span>
          <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
            Assistant
          </span>
        </button>

        {/* Language Switcher */}
        <div className="inline-flex items-center rounded-full border border-slate-200 bg-white p-0.5 text-xs font-semibold text-slate-700 shadow-2xs">
          <button
            onClick={() => setLang("en")}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 transition-all ${
              lang === "en" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Globe className="h-3 w-3" />
            <span>English</span>
          </button>
          <button
            onClick={() => setLang("hi")}
            className={`rounded-full px-2.5 py-1 transition-all ${
              lang === "hi" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            हिन्दी
          </button>
        </div>

        {/* User logout snippet */}
        <div className="hidden sm:flex items-center gap-2 pl-1 text-xs text-slate-600">
          <span className="font-semibold text-slate-800">{data.student.name}</span>
          <button
            onClick={() => window.location.assign("/auth")}
            className="flex items-center gap-1 text-slate-500 hover:text-rose-600 transition-colors"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. Oceanic Navy/Teal Hero Banner (Direct ShikshaSetu Design)
// ═══════════════════════════════════════════════════════════════════════════

function CapabilityHeroBanner({ data }: { data: StudentDashboard }) {
  const firstName = data.student.name.split(" ")[0] || "Student";

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 12 && hour < 17) return "Good afternoon";
    if (hour >= 17) return "Good evening";
    return "Good morning";
  }, []);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0C2D48] via-[#103E54] to-[#0A4D54] p-6 sm:p-8 text-white shadow-sm">
      {/* Subtle background ambient light */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Left: Eyebrow + Name + Institutional Metadata */}
        <div className="space-y-3">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-cyan-200 border border-white/10 backdrop-blur-xs">
            <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
            <span>OFFICIAL CAPABILITY INTELLIGENCE PLATFORM</span>
          </div>

          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
            {greeting}, {firstName}
          </h2>

          {/* Role & Institution Subtitle with clean icons */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs sm:text-sm text-slate-200">
            <span className="flex items-center gap-1.5 font-medium">
              <Briefcase className="h-3.5 w-3.5 text-cyan-300" />
              <span>B.Tech Computer Science & Engineering</span>
            </span>
            <span className="text-white/40">·</span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Building2 className="h-3.5 w-3.5 text-teal-300" />
              <span>Northstar Institute of Technology · CS-2023-0842</span>
            </span>
          </div>
        </div>

        {/* Right: Primary Action Buttons (Take Assessment & Recommendations) */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => window.location.assign("/skills")}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#F97316] to-[#EA580C] px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-orange-950/20 hover:from-[#EA580C] hover:to-[#C2410C] active:scale-95 transition-all"
          >
            <FileText className="h-4 w-4" />
            <span>Take Assessment</span>
          </button>

          <button
            onClick={() => window.location.assign("/career-passport")}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-xs sm:text-sm font-semibold text-white shadow-xs backdrop-blur-xs hover:bg-white/20 active:scale-95 transition-all"
          >
            <BookOpen className="h-4 w-4 text-cyan-300" />
            <span>View Recommendations</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. Four Metric Cards Row (ShikshaSetu Exact Structure)
// ═══════════════════════════════════════════════════════════════════════════

function MetricCardsRow({ data }: { data: StudentDashboard }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* 1. OVERALL CAPABILITY */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            OVERALL CAPABILITY
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Gauge className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
            3.8 / 5.0
          </div>
          <div className="mt-1.5 text-xs text-slate-500 font-medium">
            76% evidence confidence
          </div>
        </div>
      </div>

      {/* 2. COMPETENCIES MAPPED */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            COMPETENCIES MAPPED
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Layers className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
              14
            </span>
            <span className="text-xs text-slate-500 font-medium">framework items</span>
          </div>
          <button
            onClick={() => window.location.assign("/skills")}
            className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
          >
            <span>View framework</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* 3. SKILL GAPS */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            SKILL GAPS
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-50 text-orange-600">
            <Target className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-orange-600 font-mono">
              1
            </span>
            <span className="text-xs text-slate-500 font-medium">priority gap</span>
          </div>
          <button
            onClick={() => window.location.assign("/mentoring")}
            className="mt-2 text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 transition-colors"
          >
            <span>View gap analysis</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* 4. LEARNING PROGRESS */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            LEARNING PROGRESS
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-50 text-purple-600">
            <GraduationCap className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
              3
            </span>
            <span className="text-xs text-slate-500 font-medium">completed (1 active)</span>
          </div>
          <button
            onClick={() => window.location.assign("/internship")}
            className="mt-2 text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1 transition-colors"
          >
            <span>My learning tracker</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. Priority Skill Gaps Section (Left Column)
// ═══════════════════════════════════════════════════════════════════════════

interface SkillItemDefinition {
  code: string;
  category: string;
  title: string;
  currentScore: number;
  requiredScore: number;
  gapText: string;
  priority: number;
  confidence: number;
  isGap: boolean;
  actionText: string;
}

function PrioritySkillGapsSection({ data }: { data: StudentDashboard }) {
  const items: SkillItemDefinition[] = [
    {
      code: "STAT_OS",
      category: "CORE SYSTEMS",
      title: "Operating Systems & Concurrency",
      currentScore: 2.5,
      requiredScore: 4.0,
      gapText: "Gap: 1.5",
      priority: 1,
      confidence: 75,
      isGap: true,
      actionText: "View Learning",
    },
    {
      code: "STAT_NETWORKS",
      category: "INFRASTRUCTURE",
      title: "Computer Networks & Protocols",
      currentScore: 2.8,
      requiredScore: 3.5,
      gapText: "Gap: 0.7",
      priority: 2,
      confidence: 79,
      isGap: false,
      actionText: "View Learning",
    },
    {
      code: "STAT_ALGORITHMS",
      category: "COMPUTING",
      title: "Data Structures & Algorithms",
      currentScore: 3.9,
      requiredScore: 3.5,
      gapText: "On Target",
      priority: 3,
      confidence: 88,
      isGap: false,
      actionText: "View Assessment",
    },
    {
      code: "STAT_DBMS",
      category: "DATA SYSTEMS",
      title: "Database Management Systems",
      currentScore: 3.6,
      requiredScore: 3.5,
      gapText: "On Target",
      priority: 4,
      confidence: 82,
      isGap: false,
      actionText: "View Assessment",
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs space-y-6">
      {/* Section Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Priority Skill Gaps</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Targeted capability deficits ranked by official role requirement priority.
          </p>
        </div>

        <button
          onClick={() => window.location.assign("/skills")}
          className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
        >
          Full Analysis
        </button>
      </div>

      {/* List of Capability Items (Matching ShikshaSetu's Exact Card Structure) */}
      <div className="space-y-4">
        {items.map((item) => {
          const percentage = Math.min((item.currentScore / item.requiredScore) * 100, 100);

          return (
            <div
              key={item.code}
              className="rounded-xl border border-slate-100 bg-[#FBFDFE] p-4 space-y-3 hover:border-slate-200 transition-colors"
            >
              {/* Top Tag & Gap Badge */}
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-bold tracking-wider text-teal-800 uppercase font-mono">
                  {item.code} · {item.category}
                </div>

                <span
                  className={`rounded px-2 py-0.5 text-[11px] font-bold ${
                    item.isGap
                      ? "bg-amber-50 text-amber-800 border border-amber-200"
                      : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  }`}
                >
                  {item.gapText}
                </span>
              </div>

              {/* Title */}
              <h4 className="text-sm sm:text-base font-bold text-slate-900">
                {item.title}
              </h4>

              {/* Score Indicator Row */}
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Current: {item.currentScore.toFixed(1)}</span>
                <span>Required: {item.requiredScore.toFixed(1)}</span>
              </div>

              {/* Progress Track (ShikshaSetu Teal Fill) */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    item.isGap ? "bg-[#0E7490]" : "bg-[#0D9488]"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Footer Row: Priority + Confidence + Action Link */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-slate-400 font-medium">
                  Priority {item.priority} · {item.confidence}% confidence
                </span>

                <button
                  onClick={() => window.location.assign("/mentoring")}
                  className="font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 transition-colors"
                >
                  <span>{item.actionText}</span>
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
// 5. NEXT BEST ACTION Card (The Iconic ShikshaSetu Dark Navy Card)
// ═══════════════════════════════════════════════════════════════════════════

function NextBestActionCard({ data }: { data: StudentDashboard }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0F2A38] via-[#103042] to-[#0A2230] text-white p-6 shadow-sm space-y-4">
      {/* Cyan Ambient Glow */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-cyan-400/10 blur-2xl" />

      {/* Eyebrow */}
      <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs uppercase tracking-wider">
        <Zap className="h-3.5 w-3.5 fill-cyan-400" />
        <span>NEXT BEST ACTION</span>
      </div>

      {/* Main Action Title */}
      <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-snug">
        Close your Operating Systems gap
      </h3>

      {/* Action Description */}
      <p className="text-xs text-slate-300 leading-relaxed">
        Engage in recommended learning resources from departmental faculty and complete capability assessments with Dr. Meera Nair.
      </p>

      {/* Translucent Highlights Container */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2 text-xs">
        <div className="flex items-center justify-between text-slate-200">
          <span className="text-slate-400">Target Proficiency:</span>
          <span className="font-semibold text-cyan-300">Level 4.0 / 5.0</span>
        </div>
        <div className="flex items-center justify-between text-slate-200">
          <span className="text-slate-400">Priority deficit:</span>
          <span className="font-semibold text-orange-300">1.5 points (active backlog)</span>
        </div>
        <div className="flex items-center justify-between text-slate-200">
          <span className="text-slate-400">Assigned Mentor:</span>
          <span className="font-medium text-slate-200">Dr. Meera Nair (CSE)</span>
        </div>
      </div>

      {/* Primary Action Button */}
      <button
        onClick={() => window.location.assign("/mentoring")}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F97316] to-[#EA580C] py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:from-[#EA580C] hover:to-[#C2410C] active:scale-95 transition-all"
      >
        <span>Open Mentoring Intervention</span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. Campus Placement Opportunities (Clean Table Section)
// ═══════════════════════════════════════════════════════════════════════════

function CampusRecruitmentSection({
  opportunities,
  loading,
}: {
  opportunities: Opportunity[];
  loading: boolean;
}) {
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900">
            Recruitment Drives
          </h3>
          <p className="text-[11px] text-slate-500">Corporate placement opportunities</p>
        </div>
        <button
          onClick={() => window.location.assign("/opportunities")}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700"
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
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      isEligible
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
// 7. Internship Milestones Card
// ═══════════════════════════════════════════════════════════════════════════

function InternshipMilestonesCard({ data }: { data: StudentDashboard }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900">
            Evidence Ledger
          </h3>
          <p className="text-[11px] text-slate-500">{data.internship.company}</p>
        </div>
        <button
          onClick={() => window.location.assign("/internship")}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          Manage
        </button>
      </div>

      <div className="space-y-2">
        {data.internship.evidence.slice(0, 4).map((ev) => {
          const isVerified = ev.state === "verified";
          return (
            <div
              key={ev.label}
              className="flex items-center justify-between text-xs py-1"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${
                    isVerified ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                  }`}
                />
                <span className="font-medium text-slate-700">{ev.label}</span>
              </div>
              <span
                className={`text-[11px] font-semibold ${
                  isVerified ? "text-emerald-700" : "text-amber-700"
                }`}
              >
                {isVerified ? "Verified" : "In Review"}
              </span>
            </div>
          );
        })}
      </div>
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
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  crit.pass
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
            onClick={() => window.location.assign("/opportunities")}
            className="rounded-xl bg-[#0C2D48] px-4 py-2 text-xs font-bold text-white hover:bg-[#103E54] shadow-xs transition-colors"
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
          className="mt-4 rounded-xl bg-[#0C2D48] px-4 py-2 text-xs font-bold text-white hover:bg-[#103E54] transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
