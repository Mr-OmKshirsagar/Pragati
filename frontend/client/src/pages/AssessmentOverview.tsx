/**
 * Assessment Overview Page — Pre-Assessment Briefing
 * Route: /assessments/:id
 * Premium assessment details view with readiness checklist,
 * animated countdown, and role-themed executive design
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRoute, useLocation } from "wouter";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Layers,
  Zap,
  AlertCircle,
  Monitor,
  Wifi,
  BookOpen,
  Shield,
  Target,
  BarChart3,
  ArrowUpRight,
  Sparkles,
  Play,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PragatiFrame from "@/components/PragatiFrame";
import { useAuth } from "@/contexts/AuthContext";
import * as assessmentService from "@/services/assessmentService";
import type { Assessment } from "@/types/assessment";
import { AnimatedCountdown } from "@/components/assessment/AnimatedCountdown";

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

export default function AssessmentOverviewPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/assessments/:id");
  const assessmentId = params?.id as string;

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (assessmentId) {
      loadAssessment();
    }
  }, [assessmentId]);

  const loadAssessment = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await assessmentService.getAssessmentDetail(assessmentId);
      setAssessment(data);
    } catch (err: any) {
      console.error("Failed to load assessment:", err);
      setError(err?.message || "Failed to load assessment");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBeginAssessment = async () => {
    setIsStarting(true);
    try {
      const attempt = await assessmentService.startAssessment(assessmentId);
      setShowCountdown(true);
      // Countdown will trigger navigation
      setTimeout(() => {
        navigate(`/assessments/${assessmentId}/attempt/${attempt.attemptId}`);
      }, 4500);
    } catch (err: any) {
      console.error("Failed to start assessment:", err);
      setError(err?.message || "Failed to start assessment");
      setIsStarting(false);
    }
  };

  if (showCountdown) {
    return <AnimatedCountdown onComplete={() => {}} />;
  }

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
          <p className="mt-4 text-sm text-[#6c7890] font-medium">Loading assessment details...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen dashboard-grid p-4">
        <div className="max-w-2xl mx-auto mt-12">
          <button
            onClick={() => navigate("/assessments")}
            className="mb-6 flex items-center gap-2 font-medium text-sm hover:opacity-80 transition"
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
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="font-bold text-red-900 text-lg">{error || "Assessment not found"}</p>
            <Button
              onClick={() => navigate("/assessments")}
              className="mt-6 bg-red-600 hover:bg-red-700"
            >
              Return to Assessments
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  const getDifficultyConfig = (difficulty: string) => {
    switch (difficulty) {
      case "BEGINNER":
        return { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500" };
      case "INTERMEDIATE":
        return { color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500" };
      case "ADVANCED":
        return { color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200", dot: "bg-orange-500" };
      case "EXPERT":
        return { color: "text-red-700", bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500" };
      default:
        return { color: "text-slate-700", bg: "bg-slate-50", border: "border-slate-200", dot: "bg-slate-500" };
    }
  };

  const diffConfig = getDifficultyConfig(assessment.difficulty);

  return (
    <PragatiFrame title="Assessment Overview" activePath="/assessments">
      <div className="min-h-screen dashboard-grid">
        {/* ── Hero Header ─────────────────────────────────────────────── */}
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
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full blur-3xl" style={{ background: 'color-mix(in srgb, var(--primary) 20%, transparent)' }} />
          <div className="pointer-events-none absolute left-1/4 -bottom-20 h-64 w-64 rounded-full blur-3xl" style={{ background: 'color-mix(in srgb, var(--primary) 12%, transparent)' }} />

          <div className="relative z-10 max-w-4xl mx-auto">
            <button
              onClick={() => navigate("/assessments")}
              className="mb-5 flex items-center gap-2 text-white/70 hover:text-white font-medium text-sm transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Assessments
            </button>

            <div className="flex flex-wrap items-start gap-3 mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider backdrop-blur">
                <Target className="h-3 w-3" />
                Assessment Briefing
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase ${diffConfig.bg} ${diffConfig.color} ${diffConfig.border}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${diffConfig.dot}`} />
                {assessment.difficulty}
              </span>
              {assessment.status === "AVAILABLE" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/25 px-3 py-1 text-[11px] font-bold text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Available Now
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              {assessment.name}
            </h1>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-4 mt-5">
              <QuickStat icon={<Layers className="h-4 w-4" />} label={`${assessment.totalQuestions} Questions`} />
              <QuickStat icon={<Clock className="h-4 w-4" />} label={`${assessment.durationMinutes} Minutes`} />
              <QuickStat icon={<Zap className="h-4 w-4" />} label={`${assessment.maxScore} Points Max`} />
            </div>
          </div>
        </motion.div>

        {/* ── Content Grid ──────────────────────────────────────────────── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto px-4 py-8 sm:px-7"
        >
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* About Section */}
              <motion.div variants={itemVariants} className="premium-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'color-mix(in srgb, var(--primary) 12%, transparent)' }}
                  >
                    <BookOpen className="h-4 w-4" style={{ color: 'var(--primary)' }} />
                  </div>
                  <h2 className="font-bold text-[#182643]">About This Assessment</h2>
                </div>
                <p className="text-sm text-[#6c7890] leading-relaxed">
                  {assessment.description ||
                    "Evaluate your understanding of key concepts and skills through this comprehensive assessment."}
                </p>
              </motion.div>

              {/* Detail Cards */}
              <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2">
                <DetailCard
                  icon={<Layers className="h-5 w-5" />}
                  label="Questions"
                  value={`${assessment.totalQuestions} questions`}
                />
                <DetailCard
                  icon={<Clock className="h-5 w-5" />}
                  label="Duration"
                  value={`${assessment.durationMinutes} minutes`}
                />
                <DetailCard
                  icon={<Zap className="h-5 w-5" />}
                  label="Difficulty"
                  value={assessment.difficulty}
                />
                <DetailCard
                  icon={<Target className="h-5 w-5" />}
                  label="Max Score"
                  value={`${assessment.maxScore} points`}
                />
              </motion.div>

              {/* Skill Categories */}
              {assessment.skillCategories && assessment.skillCategories.length > 0 && (
                <motion.div variants={itemVariants} className="premium-card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'color-mix(in srgb, var(--primary) 12%, transparent)' }}
                    >
                      <Sparkles className="h-4 w-4" style={{ color: 'var(--primary)' }} />
                    </div>
                    <h3 className="font-bold text-[#182643]">Skills Evaluated</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {assessment.skillCategories.map((skill, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="rounded-full border px-3 py-1.5 text-xs font-semibold"
                        style={{
                          background: 'color-mix(in srgb, var(--primary) 8%, white)',
                          borderColor: 'color-mix(in srgb, var(--primary) 20%, transparent)',
                          color: 'var(--primary)',
                        }}
                      >
                        {skill}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Rules */}
              <motion.div variants={itemVariants} className="premium-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'color-mix(in srgb, var(--primary) 12%, transparent)' }}
                  >
                    <Shield className="h-4 w-4" style={{ color: 'var(--primary)' }} />
                  </div>
                  <h3 className="font-bold text-[#182643]">Assessment Rules</h3>
                </div>
                <ul className="space-y-3 text-sm">
                  <RuleItem
                    text={assessment.singleAttempt ? "Single attempt — make it count" : "Multiple attempts allowed"}
                    icon={assessment.singleAttempt ? <Lock className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  />
                  <RuleItem
                    text={assessment.negativeMarking ? "Negative marking applies for incorrect answers" : "No negative marking — guess freely"}
                    icon={<AlertCircle className="h-4 w-4" />}
                  />
                  <RuleItem
                    text="Results are recorded to your verified skill profile"
                    icon={<BarChart3 className="h-4 w-4" />}
                  />
                </ul>
              </motion.div>
            </div>

            {/* Readiness Sidebar */}
            <motion.div variants={itemVariants} className="lg:col-span-1">
              <div
                className="sticky top-20 rounded-2xl border-2 p-6 shadow-lg"
                style={{
                  borderColor: 'color-mix(in srgb, var(--primary) 20%, transparent)',
                  background: `linear-gradient(180deg, color-mix(in srgb, var(--primary) 3%, white) 0%, white 50%)`,
                }}
              >
                <div className="flex items-center gap-2 mb-5">
                  <div
                    className="h-9 w-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'color-mix(in srgb, var(--primary) 12%, transparent)' }}
                  >
                    <CheckCircle2 className="h-5 w-5" style={{ color: 'var(--primary)' }} />
                  </div>
                  <h3 className="font-bold text-[#182643]">Pre-Flight Checklist</h3>
                </div>

                <div className="space-y-3 mb-6">
                  <ReadinessItem
                    icon={<Wifi className="h-4 w-4" />}
                    label="Stable internet connection"
                    done
                  />
                  <ReadinessItem
                    icon={<Clock className="h-4 w-4" />}
                    label={`${assessment.durationMinutes} minutes available`}
                    done
                  />
                  <ReadinessItem
                    icon={<Monitor className="h-4 w-4" />}
                    label={assessment.singleAttempt ? "Single attempt only" : "Multiple attempts available"}
                    done
                  />
                  <ReadinessItem
                    icon={<BookOpen className="h-4 w-4" />}
                    label="Results recorded to your profile"
                    done
                  />
                </div>

                {/* Begin Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleBeginAssessment}
                  disabled={isStarting}
                  className="w-full rounded-xl px-4 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{
                    background: `linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 80%, black))`,
                  }}
                >
                  {isStarting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Starting...
                    </span>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Begin Assessment
                    </>
                  )}
                </motion.button>

                <button
                  onClick={() => navigate("/assessments")}
                  className="mt-3 w-full rounded-xl border-2 border-slate-200 px-4 py-2.5 text-xs font-semibold text-[#6c7890] hover:bg-slate-50 hover:border-slate-300 transition-all"
                >
                  Cancel
                </button>

                {assessment.status === "AVAILABLE" && (
                  <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-emerald-600 font-semibold">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Assessment available now
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </PragatiFrame>
  );
}

// ============================================================================
// Subcomponents
// ============================================================================

function QuickStat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/80 backdrop-blur">
      {icon}
      {label}
    </div>
  );
}

function DetailCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <motion.div
      variants={itemVariants}
      className="premium-card p-4 flex items-start gap-4 hover:shadow-md transition-all duration-300 group"
    >
      <div
        className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
        style={{ background: 'color-mix(in srgb, var(--primary) 10%, transparent)' }}
      >
        <span style={{ color: 'var(--primary)' }}>{icon}</span>
      </div>
      <div>
        <p className="text-[10px] font-bold text-[#7d8ba3] uppercase tracking-wider">{label}</p>
        <p className="text-lg font-bold text-[#182643] mt-0.5 group-hover:text-[color:var(--primary)] transition-colors">{value}</p>
      </div>
    </motion.div>
  );
}

function ReadinessItem({
  icon,
  label,
  done = false,
}: {
  icon: React.ReactNode;
  label: string;
  done?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3"
    >
      <motion.div
        className={`rounded-full p-2 ${done ? "bg-emerald-50 border border-emerald-200" : "bg-slate-100 border border-slate-200"}`}
        animate={done ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.5 }}
      >
        <div className={done ? "text-emerald-600" : "text-slate-400"}>{icon}</div>
      </motion.div>
      <span className="text-xs text-[#6c7890] font-medium">{label}</span>
    </motion.div>
  );
}

function RuleItem({ text, icon }: { text: string; icon: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span style={{ color: 'var(--primary)' }} className="mt-0.5 flex-shrink-0">{icon}</span>
      <span className="text-[#6c7890] leading-relaxed">{text}</span>
    </li>
  );
}
