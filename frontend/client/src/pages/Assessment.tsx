/**
 * Assessment Page — Executive Assessment Command Center
 * Route: /assessments
 * Premium role-themed interface displaying available assessments
 * with animated KPI dashboard, rich cards, and micro-interactions
 */

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Clock,
  Layers,
  Target,
  BarChart3,
  Search,
  Filter,
  CheckCircle2,
  Award,
  ArrowUpRight,
  Sparkles,
  BookOpen,
  Shield,
} from "lucide-react";
import PragatiFrame from "@/components/PragatiFrame";
import { useAuth } from "@/contexts/AuthContext";
import * as assessmentService from "@/services/assessmentService";
import type { AssessmentCard } from "@/types/assessment";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

export default function AssessmentPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { role } = useAuth();
  const isFaculty = role === "FACULTY";
  const [assessments, setAssessments] = useState<AssessmentCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");

  useEffect(() => {
    loadAssessments();
  }, []);

  const loadAssessments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await assessmentService.getAvailableAssessments();
      setAssessments(data);
    } catch (err: any) {
      console.error("Failed to load assessments:", err);
      setError(err?.message || "Failed to load assessments");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAssessments = useMemo(() => {
    return assessments.filter((a) => {
      const matchesSearch =
        searchQuery === "" ||
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.description && a.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesDifficulty =
        filterDifficulty === "all" || a.difficulty === filterDifficulty;
      return matchesSearch && matchesDifficulty;
    });
  }, [assessments, searchQuery, filterDifficulty]);

  // Compute KPIs from data
  const kpis = useMemo(() => {
    const total = assessments.length;
    const available = assessments.filter((a) => a.status === "AVAILABLE").length;
    const completed = assessments.filter((a) => a.status === "COMPLETED").length;
    const avgScore =
      assessments.filter((a) => a.latestScore !== undefined).length > 0
        ? Math.round(
            assessments
              .filter((a) => a.latestScore !== undefined)
              .reduce((sum, a) => sum + (a.latestScore || 0), 0) /
              assessments.filter((a) => a.latestScore !== undefined).length
          )
        : 0;
    return { total, available, completed, avgScore };
  }, [assessments]);

  return (
    <PragatiFrame title="Assessments" activePath="/assessments">
      <div className="min-h-screen dashboard-grid">
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="px-4 pt-7 pb-2 sm:px-7 max-w-7xl mx-auto">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold text-[#71809a]">
            <span>{isFaculty ? "Academic & Skills" : "Learner Workspace"}</span>
            <span className="text-[#d0d8e6]">/</span>
            <span className="text-primary font-bold">Assessments</span>
          </div>
          <div className="grid grid-cols-[1fr_auto] items-start gap-4 sm:items-end">
            <div>
              <h1 className="text-[28px] font-extrabold tracking-[-0.04em] text-[#182643] sm:text-[34px]">
                Assessments
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm text-[#6c7890] leading-relaxed">
                {isFaculty
                  ? "Measure student skills through verified, proctored assessments, benchmark evaluations, and adaptive tests."
                  : "Measure your skills through verified, proctored assessments. Track your progress, build your evidence portfolio, and demonstrate what you can do."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold shadow-2xs ${
                isFaculty
                  ? "border-emerald-200/80 bg-emerald-50/90 text-emerald-800"
                  : "border-blue-200/80 bg-blue-50/90 text-blue-800"
              }`}>
                <Shield className={`h-4 w-4 ${isFaculty ? "text-emerald-600" : "text-blue-600"}`} />
                {kpis.total} Total Assessments
              </span>
            </div>
          </div>

          {/* KPI Summary Tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6">
            <div className="premium-card p-4 sm:p-5">
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8490a5]">Total Assessments</div>
              <div className="text-2xl font-extrabold tracking-[-0.05em] text-[#1b2946] mt-1">{kpis.total}</div>
            </div>
            <div className="premium-card p-4 sm:p-5">
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8490a5]">Available Now</div>
              <div className="text-2xl font-extrabold tracking-[-0.05em] text-emerald-600 mt-1">{kpis.available}</div>
            </div>
            <div className="premium-card p-4 sm:p-5">
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8490a5]">Completed</div>
              <div className="text-2xl font-extrabold tracking-[-0.05em] text-[#1b2946] mt-1">{kpis.completed}</div>
            </div>
            <div className="premium-card p-4 sm:p-5">
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8490a5]">Avg. Score</div>
              <div className="text-2xl font-extrabold tracking-[-0.05em] text-[#1b2946] mt-1">{kpis.avgScore}%</div>
            </div>
          </div>
        </div>

        {/* ── Search & Filter Bar ───────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-7">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search assessments by name or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 shadow-sm transition focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--primary)]/20 outline-none"
              />
            </div>

            {/* Filter */}
            <div className="flex gap-2">
              {["all", "BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"].map((level) => (
                <button
                  key={level}
                  onClick={() => setFilterDifficulty(level)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all border ${
                    filterDifficulty === level
                      ? "bg-[color:var(--primary)] text-white border-transparent shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {level === "all" ? "All" : level.charAt(0) + level.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Assessment Grid ──────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 pb-12 sm:px-7">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2"
            >
              <Zap className="h-4 w-4 text-red-500" />
              {error}
            </motion.div>
          )}

          {isLoading ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-72 rounded-2xl border border-slate-100 bg-white p-6 animate-pulse"
                >
                  <div className="flex justify-between mb-4">
                    <div className="h-5 w-3/5 rounded-lg bg-slate-100" />
                    <div className="h-5 w-16 rounded-lg bg-slate-100" />
                  </div>
                  <div className="h-3 w-2/3 rounded bg-slate-100 mt-3" />
                  <div className="h-24 rounded-xl bg-slate-50 mt-6" />
                  <div className="h-10 rounded-xl bg-slate-100 mt-6" />
                </div>
              ))}
            </div>
          ) : filteredAssessments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="premium-card p-16 text-center"
            >
              <div
                className="mx-auto h-16 w-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'color-mix(in srgb, var(--primary) 10%, transparent)' }}
              >
                <BookOpen className="h-8 w-8" style={{ color: 'var(--primary)' }} />
              </div>
              <h3 className="text-xl font-bold text-[#182643]">No Assessments Found</h3>
              <p className="mt-2 text-sm text-[#6c7890] max-w-md mx-auto">
                {searchQuery || filterDifficulty !== "all"
                  ? "No assessments match your current filters. Try adjusting your search."
                  : "There are currently no assessments available for your enrolled program."}
              </p>
              {(searchQuery || filterDifficulty !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setFilterDifficulty("all");
                  }}
                  className="mt-4 text-sm font-semibold hover:opacity-80 transition"
                  style={{ color: 'var(--primary)' }}
                >
                  Clear All Filters
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
            >
              {filteredAssessments.map((assessment, index) => (
                <AssessmentCardComponent
                  key={assessment.id}
                  assessment={assessment}
                  index={index}
                  onStart={() => navigate(`/assessments/${assessment.id}`)}
                />
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </PragatiFrame>
  );
}

// ============================================================================
// KPI Tile — Hero stat card
// ============================================================================

function KpiTile({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <motion.div
      variants={itemVariants}
      className={`rounded-2xl border backdrop-blur-md p-4 transition-all hover:scale-[1.02] ${
        highlight
          ? "bg-white/15 border-white/20 shadow-lg"
          : "bg-white/8 border-white/10"
      }`}
    >
      <div className="flex items-center gap-2 text-white/60 mb-2">
        {icon}
        <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-extrabold text-white tracking-tight kpi-value">{value}</p>
    </motion.div>
  );
}

// ============================================================================
// Assessment Card — Premium card component
// ============================================================================

interface AssessmentCardComponentProps {
  assessment: AssessmentCard;
  index: number;
  onStart: () => void;
}

function AssessmentCardComponent({
  assessment,
  index,
  onStart,
}: AssessmentCardComponentProps) {
  const getDifficultyConfig = (difficulty: string) => {
    switch (difficulty) {
      case "BEGINNER":
        return { text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500" };
      case "INTERMEDIATE":
        return { text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500" };
      case "ADVANCED":
        return { text: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200", dot: "bg-orange-500" };
      case "EXPERT":
        return { text: "text-red-700", bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500" };
      default:
        return { text: "text-slate-700", bg: "bg-slate-50", border: "border-slate-200", dot: "bg-slate-500" };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Available" };
      case "UPCOMING":
        return { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200", label: "Upcoming" };
      case "IN_PROGRESS":
        return { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "In Progress" };
      case "COMPLETED":
        return { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", label: "Completed" };
      case "EXPIRED":
        return { bg: "bg-red-50", text: "text-red-600", border: "border-red-200", label: "Expired" };
      case "LOCKED":
        return { bg: "bg-slate-50", text: "text-slate-500", border: "border-slate-200", label: "Locked" };
      default:
        return { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200", label: status };
    }
  };

  const isDisabled = assessment.status === "EXPIRED" || assessment.status === "LOCKED";
  const diffConfig = getDifficultyConfig(assessment.difficulty);
  const statusConfig = getStatusConfig(assessment.status);

  return (
    <motion.div variants={itemVariants} className="group">
      <div
        onClick={!isDisabled ? onStart : undefined}
        className={`relative h-full rounded-2xl border border-[#e2e8f2] bg-white overflow-hidden transition-all duration-300 ${
          isDisabled
            ? "opacity-60 cursor-not-allowed"
            : "cursor-pointer hover:shadow-xl hover:-translate-y-1 hover:border-[color:var(--primary)]/30"
        }`}
      >
        {/* Top accent stripe */}
        <div
          className="h-1 w-full transition-all duration-300 group-hover:h-1.5"
          style={{
            background: isDisabled
              ? "#e2e8f0"
              : `linear-gradient(90deg, var(--primary), color-mix(in srgb, var(--primary) 60%, white))`,
          }}
        />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0 pr-3">
              <h3 className="font-bold text-lg text-[#182643] line-clamp-2 leading-snug group-hover:text-[color:var(--primary)] transition-colors">
                {assessment.name}
              </h3>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${assessment.status === "AVAILABLE" ? "bg-emerald-500 animate-pulse" : ""}`} />
                  {statusConfig.label}
                </span>
              </div>
            </div>
            <div
              className={`flex-shrink-0 rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase flex items-center gap-1 ${diffConfig.bg} ${diffConfig.text} ${diffConfig.border}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${diffConfig.dot}`} />
              {assessment.difficulty}
            </div>
          </div>

          {/* Description */}
          {assessment.description && (
            <p className="text-xs text-[#7d8ba3] line-clamp-2 mb-4 leading-relaxed">
              {assessment.description}
            </p>
          )}

          {/* Skill Tags */}
          {assessment.skillIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {assessment.skillIds.slice(0, 3).map((skill, i) => (
                <span
                  key={i}
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold border transition-colors"
                  style={{
                    background: 'color-mix(in srgb, var(--primary) 8%, transparent)',
                    borderColor: 'color-mix(in srgb, var(--primary) 20%, transparent)',
                    color: 'var(--primary)',
                  }}
                >
                  {skill}
                </span>
              ))}
              {assessment.skillIds.length > 3 && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                  +{assessment.skillIds.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Stats Row */}
          <div className="flex items-center gap-4 text-xs text-[#6c7890] mb-4 py-2 border-y border-slate-100">
            <div className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              <span className="font-semibold">{assessment.totalQuestions}</span>
              <span>questions</span>
            </div>
            <div className="h-3 w-px bg-slate-200" />
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span className="font-semibold">{assessment.durationMinutes}</span>
              <span>min</span>
            </div>
          </div>

          {/* Score & Trend Section */}
          {assessment.latestScore !== undefined && (
            <div
              className="mb-4 rounded-xl p-3 border"
              style={{
                background: 'color-mix(in srgb, var(--primary) 4%, white)',
                borderColor: 'color-mix(in srgb, var(--primary) 15%, transparent)',
              }}
            >
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#7d8ba3]">
                    Latest Score
                  </div>
                  <div className="mt-1 text-2xl font-extrabold" style={{ color: 'var(--primary)' }}>
                    {assessment.latestScore}%
                  </div>
                </div>
                {assessment.trend !== undefined && assessment.trend !== 0 && (
                  <div
                    className={`flex items-center gap-1 text-xs font-bold rounded-lg px-2 py-1 ${
                      assessment.trend > 0
                        ? "text-emerald-700 bg-emerald-50"
                        : "text-red-700 bg-red-50"
                    }`}
                  >
                    {assessment.trend > 0 ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5" />
                    )}
                    <span>{Math.abs(assessment.trend)}%</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CTA Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isDisabled) onStart();
            }}
            disabled={isDisabled}
            className={`w-full rounded-xl px-4 py-3 text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              isDisabled
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "text-white shadow-md hover:shadow-lg hover:opacity-90 active:scale-[0.98]"
            }`}
            style={
              !isDisabled
                ? {
                    background: `linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 80%, black))`,
                  }
                : undefined
            }
          >
            {assessment.status === "AVAILABLE" ? (
              <>
                <Zap className="h-3.5 w-3.5" />
                Start Assessment
                <ArrowUpRight className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
              </>
            ) : assessment.status === "COMPLETED" ? (
              <>
                <Award className="h-3.5 w-3.5" />
                View Results
              </>
            ) : (
              statusConfig.label
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
