/**
 * Assessment Result Page — Performance Analytics Dashboard
 * Route: /assessments/:id/result/:attemptId
 * Premium animated results display with score visualization,
 * skill performance breakdown, and impact analysis
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRoute, useLocation } from "wouter";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Award,
  Target,
  BarChart3,
  Shield,
  Sparkles,
  Minus,
  ArrowUpRight,
  BookOpen,
  Zap,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PragatiFrame from "@/components/PragatiFrame";
import { useAuth } from "@/contexts/AuthContext";
import { AnimatedScoreDisplay } from "@/components/assessment/AnimatedScoreDisplay";
import * as assessmentService from "@/services/assessmentService";
import type { GetResultResponse, SkillImpact } from "@/types/assessment";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function AssessmentResultPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/assessments/:id/result/:attemptId");

  const assessmentId = params?.id as string;
  const attemptId = params?.attemptId as string;

  const [result, setResult] = useState<GetResultResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (assessmentId && attemptId) {
      loadResult();
    }
  }, [assessmentId, attemptId]);

  const loadResult = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await assessmentService.getAssessmentResult(attemptId, assessmentId);
      setResult(data);
    } catch (err: any) {
      console.error("Failed to load result:", err);
      setError(err?.message || "Failed to load result");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen dashboard-grid flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div
            className="inline-flex animate-spin rounded-full h-12 w-12 border-b-2"
            style={{ borderColor: 'var(--primary)' }}
          />
          <p className="mt-4 text-sm text-[#6c7890] font-medium">Processing your assessment results...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen dashboard-grid p-4">
        <div className="max-w-2xl mx-auto mt-12">
          <button
            onClick={() => navigate("/student/assessments")}
            className="mb-6 flex items-center gap-2 font-medium text-sm transition hover:opacity-80"
            style={{ color: 'var(--primary)' }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Assessments
          </button>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center"
          >
            <Zap className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="font-bold text-red-900 text-lg">{error || "Result not found"}</p>
            <p className="text-sm text-red-700 mt-2">Please try again or return to the assessments page.</p>
            <Button
              onClick={() => navigate("/student/assessments")}
              className="mt-6 bg-red-600 hover:bg-red-700"
            >
              Return to Assessments
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  const { result: resultData, performance, skillImpacts, verification } = result;

  // Determine performance tier
  const getScoreTier = (score: number) => {
    if (score >= 90) return { label: "Outstanding", emoji: "🏆", color: "emerald" };
    if (score >= 75) return { label: "Excellent", emoji: "⭐", color: "blue" };
    if (score >= 60) return { label: "Good", emoji: "👍", color: "amber" };
    if (score >= 40) return { label: "Fair", emoji: "📖", color: "orange" };
    return { label: "Needs Improvement", emoji: "💪", color: "red" };
  };

  const tier = getScoreTier(resultData.percentageScore);

  return (
    <PragatiFrame title="Assessment Result" activePath="/student/assessments">
      <div className="min-h-screen dashboard-grid">
        {/* ── Hero Result Header ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden border-b px-4 py-8 sm:px-7 text-white"
          style={{
            borderColor: 'color-mix(in srgb, var(--primary) 15%, transparent)',
            background: `
              radial-gradient(circle at 82% 18%, color-mix(in srgb, var(--primary) 24%, transparent), transparent 28%),
              linear-gradient(135deg, var(--role-bg, #0b1226) 0%, color-mix(in srgb, var(--role-bg, #0b1226) 70%, var(--primary)) 52%, var(--primary) 100%)
            `,
          }}
        >
          {/* Ambient glow */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full blur-3xl" style={{ background: 'color-mix(in srgb, var(--primary) 20%, transparent)' }} />
          <div className="pointer-events-none absolute left-1/4 -bottom-20 h-64 w-64 rounded-full blur-3xl" style={{ background: 'color-mix(in srgb, var(--primary) 12%, transparent)' }} />

          <div className="relative z-10 max-w-7xl mx-auto">
            <button
              onClick={() => navigate("/student/assessments")}
              className="mb-5 flex items-center gap-2 text-white/70 hover:text-white font-medium text-sm transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Assessments
            </button>

            {/* Success Banner */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 border border-emerald-400/25 px-4 py-1.5 mb-4"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
                Assessment Submitted Successfully
              </span>
            </motion.div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Performance <span style={{ color: 'color-mix(in srgb, var(--primary) 50%, white)' }}>Analytics</span>
            </h1>
            <p className="mt-2 text-sm text-slate-300/80">
              {resultData.assessmentName}
            </p>
          </div>
        </motion.div>

        {/* ── Content ────────────────────────────────────────────────────── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto px-4 py-8 sm:px-7 space-y-8"
        >
          {/* Score + Details Grid */}
          <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-3">
            {/* Main Score Card */}
            <div className="lg:col-span-1 premium-card p-8 flex flex-col items-center justify-center relative overflow-hidden">
              {/* Decorative ring */}
              <div
                className="absolute inset-0 pointer-events-none opacity-5"
                style={{
                  background: `radial-gradient(circle at 50% 50%, var(--primary), transparent 70%)`,
                }}
              />

              <div className="relative z-10 flex flex-col items-center">
                <AnimatedScoreDisplay
                  score={resultData.percentageScore}
                  label="Your Score"
                  delay={0}
                />

                {/* Performance Tier Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 }}
                  className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 border"
                  style={{
                    background: 'color-mix(in srgb, var(--primary) 8%, white)',
                    borderColor: 'color-mix(in srgb, var(--primary) 20%, transparent)',
                  }}
                >
                  <span className="text-base">{tier.emoji}</span>
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>
                    {tier.label}
                  </span>
                </motion.div>
              </div>
            </div>

            {/* Details Panel */}
            <div className="lg:col-span-2 space-y-5">
              {/* Assessment Stats */}
              <motion.div variants={itemVariants} className="premium-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'color-mix(in srgb, var(--primary) 12%, transparent)' }}
                  >
                    <BarChart3 className="h-4 w-4" style={{ color: 'var(--primary)' }} />
                  </div>
                  <h3 className="font-bold text-[#182643]">Assessment Details</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <StatMini label="Questions" value="30" icon={<BookOpen className="h-3.5 w-3.5" />} />
                  <StatMini label="Answered" value="28" icon={<CheckCircle2 className="h-3.5 w-3.5" />} />
                  <StatMini label="Correct" value="24" icon={<Target className="h-3.5 w-3.5" />} />
                  <StatMini label="Attempt" value={`#${resultData.attemptNumber}`} icon={<Clock className="h-3.5 w-3.5" />} />
                </div>
              </motion.div>

              {/* Verification Status */}
              <motion.div variants={itemVariants} className="premium-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'color-mix(in srgb, var(--primary) 12%, transparent)' }}
                  >
                    <Shield className="h-4 w-4" style={{ color: 'var(--primary)' }} />
                  </div>
                  <h3 className="font-bold text-[#182643]">Verification Pipeline</h3>
                </div>
                <div className="flex items-center gap-1">
                  <VerificationStep
                    label="Submitted"
                    done={verification.submitted}
                    isFirst
                  />
                  <div className={`flex-1 h-0.5 ${verification.submitted && verification.scored ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                  <VerificationStep
                    label="Scored"
                    done={verification.scored}
                    pending={!verification.scored && verification.submitted}
                  />
                  <div className={`flex-1 h-0.5 ${verification.scored && verification.institutionVerified ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                  <VerificationStep
                    label="Verified"
                    done={verification.institutionVerified}
                    pending={!verification.institutionVerified && verification.scored}
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Performance Breakdown */}
          {performance.skillPerformance.length > 0 && (
            <motion.div variants={itemVariants} className="premium-card p-6">
              <div className="flex items-center gap-2 mb-6">
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'color-mix(in srgb, var(--primary) 12%, transparent)' }}
                >
                  <BarChart3 className="h-4 w-4" style={{ color: 'var(--primary)' }} />
                </div>
                <h2 className="text-lg font-bold text-[#182643]">Skill Performance Breakdown</h2>
              </div>
              <div className="space-y-5">
                {performance.skillPerformance.map((skill, idx) => (
                  <SkillProgressBar key={idx} skill={skill} index={idx} />
                ))}
              </div>
            </motion.div>
          )}

          {/* Skill Impact */}
          {skillImpacts.length > 0 && (
            <motion.div variants={itemVariants} className="premium-card p-6">
              <div className="flex items-center gap-2 mb-6">
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'color-mix(in srgb, var(--primary) 12%, transparent)' }}
                >
                  <Sparkles className="h-4 w-4" style={{ color: 'var(--primary)' }} />
                </div>
                <h2 className="text-lg font-bold text-[#182643]">Skill Profile Impact</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {skillImpacts.map((impact, idx) => (
                  <SkillImpactCard key={idx} impact={impact} index={idx} />
                ))}
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button
              onClick={() => navigate("/student/skills")}
              className="text-white shadow-md hover:opacity-90 flex items-center gap-2"
              style={{
                background: `linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 80%, black))`,
              }}
            >
              <Target className="h-4 w-4" />
              View Skill Profile
              <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
            </Button>
            <Button
              onClick={() => navigate("/student/assessments")}
              variant="outline"
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Take Another Assessment
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </PragatiFrame>
  );
}

// ============================================================================
// Subcomponents
// ============================================================================

function StatMini({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="text-center p-3 rounded-xl bg-slate-50/80 border border-slate-100">
      <div className="flex items-center justify-center gap-1 text-[#7d8ba3] mb-1">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-extrabold text-[#182643]">{value}</p>
    </div>
  );
}

function VerificationStep({
  label,
  done,
  pending = false,
  isFirst = false,
}: {
  label: string;
  done: boolean;
  pending?: boolean;
  isFirst?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: isFirst ? 0.3 : 0.5, type: "spring" }}
        className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
          done
            ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-300"
            : pending
              ? "bg-amber-50 text-amber-600 border-2 border-amber-200 animate-pulse"
              : "bg-slate-100 text-slate-400 border-2 border-slate-200"
        }`}
      >
        {done ? <CheckCircle2 className="h-4 w-4" /> : pending ? <Clock className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
      </motion.div>
      <span className={`text-[10px] font-bold uppercase tracking-wider ${done ? "text-emerald-700" : pending ? "text-amber-600" : "text-slate-400"}`}>
        {label}
      </span>
    </div>
  );
}

interface SkillProgressBarProps {
  skill: {
    skillName: string;
    percentageScore: number;
  };
  index: number;
}

function SkillProgressBar({ skill, index }: SkillProgressBarProps) {
  const getBarColor = (score: number) => {
    if (score >= 80) return "from-emerald-500 to-emerald-400";
    if (score >= 60) return "from-blue-500 to-blue-400";
    if (score >= 40) return "from-amber-500 to-amber-400";
    return "from-red-500 to-red-400";
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      className="group"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-[#182643] group-hover:text-[color:var(--primary)] transition-colors">
          {skill.skillName}
        </span>
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-extrabold"
            style={{ color: 'var(--primary)' }}
          >
            {skill.percentageScore}%
          </span>
        </div>
      </div>
      <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: index * 0.06 + 0.3, duration: 0.7, ease: "easeOut" }}
          className={`h-full bg-gradient-to-r ${getBarColor(skill.percentageScore)} origin-left rounded-full`}
          style={{ width: `${skill.percentageScore}%` }}
        />
      </div>
    </motion.div>
  );
}

interface SkillImpactCardProps {
  impact: SkillImpact;
  index: number;
}

function SkillImpactCard({ impact, index }: SkillImpactCardProps) {
  const isImproved = impact.status === "IMPROVED";
  const isMaintained = impact.status === "MAINTAINED";

  const config = isImproved
    ? {
        icon: <TrendingUp className="h-5 w-5" />,
        gradient: "from-emerald-50 to-green-50",
        border: "border-emerald-200",
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-600",
        textColor: "text-emerald-900",
        badgeBg: "bg-emerald-100 text-emerald-700",
      }
    : isMaintained
      ? {
          icon: <Award className="h-5 w-5" />,
          gradient: "from-slate-50 to-zinc-50",
          border: "border-slate-200",
          iconBg: "bg-slate-100",
          iconColor: "text-slate-600",
          textColor: "text-slate-900",
          badgeBg: "bg-slate-100 text-slate-700",
        }
      : {
          icon: <TrendingDown className="h-5 w-5" />,
          gradient: "from-orange-50 to-amber-50",
          border: "border-orange-200",
          iconBg: "bg-orange-100",
          iconColor: "text-orange-600",
          textColor: "text-orange-900",
          badgeBg: "bg-orange-100 text-orange-700",
        };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`rounded-2xl border-2 ${config.border} bg-gradient-to-br ${config.gradient} p-5 hover:shadow-md transition-all duration-300`}
    >
      <div className="flex items-start gap-4">
        <div className={`h-10 w-10 rounded-xl ${config.iconBg} flex items-center justify-center flex-shrink-0`}>
          <span className={config.iconColor}>{config.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold ${config.textColor} truncate`}>
            {impact.skillName}
          </h3>
          {impact.interventionName && (
            <p className="text-xs text-[#7d8ba3] mt-0.5 truncate">
              {impact.interventionName}
            </p>
          )}
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-[#7d8ba3] font-mono">{impact.previousScore || "N/A"}</span>
              <span className="text-[#7d8ba3]">→</span>
              <span className={`font-bold ${config.iconColor}`}>{impact.currentScore}</span>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${config.badgeBg}`}>
              {impact.status}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
