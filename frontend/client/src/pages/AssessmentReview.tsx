/**
 * Assessment Review Page — Pre-Submission Command Center
 * Route: /assessments/:id/review/:attemptId
 * Premium review interface with animated stats, question map,
 * and confirmation flow before final submission
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRoute, useLocation } from "wouter";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
  Shield,
  Eye,
  Flag,
  FileCheck2,
  X,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PragatiFrame from "@/components/PragatiFrame";
import { useAuth } from "@/contexts/AuthContext";
import type { AttemptState, QuestionState } from "@/types/assessment";

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

interface ReviewState extends AttemptState {
  totalTime: number;
  timeSpent: number;
}

export default function AssessmentReviewPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/assessments/:id/review/:attemptId");

  const assessmentId = params?.id as string;
  const attemptId = params?.attemptId as string;

  const [review, setReview] = useState<ReviewState | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Mock review data - in real implementation would fetch from API
    const mockReview: ReviewState = {
      attemptId,
      assessmentId,
      studentId: "student_123",
      startedAt: Date.now() - 25 * 60 * 1000,
      lastModified: Date.now(),
      questions: Array.from({ length: 30 }, (_, i) => ({
        questionId: `q${i + 1}`,
        answer: i % 3 === 0 ? "Option A" : i % 3 === 1 ? ["Option B", "Option C"] : true,
        isAnswered: Math.random() > 0.1, // 90% answered
        markedForReview: Math.random() > 0.8, // 20% marked
        savedAt: Date.now() - Math.random() * 25 * 60 * 1000,
      })),
      currentQuestionIndex: 0,
      status: "ACTIVE",
      serverEndTime: Date.now() + 20 * 60 * 1000, // 20 min remaining
      totalTime: 45 * 60 * 1000, // 45 minutes total
      timeSpent: 25 * 60 * 1000, // 25 minutes spent
    };

    setReview(mockReview);
  }, [attemptId, assessmentId]);

  if (!review) {
    return null;
  }

  const stats = {
    totalQuestions: review.questions.length,
    answered: review.questions.filter((q) => q.isAnswered).length,
    unanswered: review.questions.filter((q) => !q.isAnswered).length,
    markedForReview: review.questions.filter((q) => q.markedForReview).length,
    timeRemaining: Math.max(0, review.serverEndTime - Date.now()),
  };

  const completionRate = Math.round((stats.answered / stats.totalQuestions) * 100);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Simulate submission
      await new Promise((resolve) => setTimeout(resolve, 1500));
      navigate(`/assessments/${assessmentId}/result/${attemptId}`);
    } catch (error) {
      console.error("Submission failed:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <PragatiFrame title="Assessment Review" activePath="/assessments">
      <div className="min-h-screen dashboard-grid">
        {/* ── Hero Header ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden border-b px-4 py-6 sm:px-7 text-white sticky top-0 z-40"
          style={{
            borderColor: 'color-mix(in srgb, var(--primary) 15%, transparent)',
            background: `
              radial-gradient(circle at 82% 18%, color-mix(in srgb, var(--primary) 20%, transparent), transparent 28%),
              linear-gradient(135deg, var(--role-bg, #0b1226) 0%, color-mix(in srgb, var(--role-bg, #0b1226) 70%, var(--primary)) 52%, var(--primary) 100%)
            `,
          }}
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full blur-3xl" style={{ background: 'color-mix(in srgb, var(--primary) 15%, transparent)' }} />

          <div className="relative z-10 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <button
                  onClick={() => navigate(`/assessments/${assessmentId}/attempt/${attemptId}`)}
                  className="mb-3 flex items-center gap-2 text-white/70 hover:text-white font-medium text-sm transition"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Assessment
                </button>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-extrabold tracking-tight">Review & Submit</h1>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[11px] font-bold backdrop-blur">
                    <Eye className="h-3 w-3" />
                    Final Review
                  </span>
                </div>
              </div>

              {/* Timer */}
              <div className="hidden sm:flex items-center gap-2 rounded-xl bg-white/10 border border-white/15 px-4 py-2 backdrop-blur">
                <Clock className="h-4 w-4 text-white/70" />
                <span className="font-mono text-lg font-bold">
                  {Math.floor(stats.timeRemaining / 60000)}:{String(Math.floor((stats.timeRemaining % 60000) / 1000)).padStart(2, "0")}
                </span>
                <span className="text-[10px] text-white/50 uppercase tracking-wider ml-1">remaining</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Content ────────────────────────────────────────────────── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto px-4 py-8 sm:px-7 space-y-6"
        >
          {/* Warning Banner */}
          {stats.unanswered > 0 && (
            <motion.div
              variants={itemVariants}
              className="rounded-2xl border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-5 flex items-start gap-4"
            >
              <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-bold text-amber-900">
                  {stats.unanswered} question{stats.unanswered !== 1 ? "s" : ""} not answered
                </p>
                <p className="text-sm text-amber-800 mt-1">
                  You can still submit. Only answered questions will be scored.
                </p>
              </div>
            </motion.div>
          )}

          {/* Stats KPI Grid */}
          <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ReviewStatCard
              icon={<FileCheck2 className="h-5 w-5" />}
              label="Total"
              value={stats.totalQuestions}
              color="slate"
            />
            <ReviewStatCard
              icon={<CheckCircle2 className="h-5 w-5" />}
              label="Answered"
              value={stats.answered}
              color="emerald"
              subtext={`${completionRate}%`}
            />
            <ReviewStatCard
              icon={<Flag className="h-5 w-5" />}
              label="Marked"
              value={stats.markedForReview}
              color="amber"
            />
            <ReviewStatCard
              icon={<Clock className="h-5 w-5" />}
              label="Time Left"
              value={`${Math.floor(stats.timeRemaining / 60000)}:${String(Math.floor((stats.timeRemaining % 60000) / 1000)).padStart(2, "0")}`}
              color="primary"
              subtext="min:sec"
            />
          </motion.div>

          {/* Completion Progress */}
          <motion.div variants={itemVariants} className="premium-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-[#182643]">Completion Progress</span>
              <span
                className="text-sm font-extrabold"
                style={{ color: 'var(--primary)' }}
              >
                {completionRate}%
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full origin-left"
                style={{
                  width: `${completionRate}%`,
                  background: `linear-gradient(90deg, var(--primary), color-mix(in srgb, var(--primary) 60%, white))`,
                }}
              />
            </div>
          </motion.div>

          {/* Question Map */}
          <motion.div variants={itemVariants} className="premium-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ background: 'color-mix(in srgb, var(--primary) 12%, transparent)' }}
              >
                <Sparkles className="h-4 w-4" style={{ color: 'var(--primary)' }} />
              </div>
              <h2 className="text-lg font-bold text-[#182643]">Question Map</h2>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-5 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-emerald-500" />
                <span className="text-[#6c7890] font-medium">Answered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-amber-500" />
                <span className="text-[#6c7890] font-medium">Marked for Review</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-slate-300" />
                <span className="text-[#6c7890] font-medium">Unanswered</span>
              </div>
            </div>

            {/* Question Grid */}
            <div className="flex flex-wrap gap-2">
              {review.questions.map((q, idx) => {
                const isMarked = q.markedForReview;
                const isAnswered = q.isAnswered;

                return (
                  <motion.div
                    key={q.questionId}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.015 }}
                    className={`h-9 w-9 rounded-lg flex items-center justify-center text-xs font-bold border-2 transition-all hover:scale-110 cursor-default ${
                      isMarked
                        ? "bg-amber-50 border-amber-300 text-amber-700"
                        : isAnswered
                          ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                          : "bg-slate-50 border-slate-200 text-slate-500"
                    }`}
                  >
                    {idx + 1}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Submit Section */}
          <motion.div
            variants={itemVariants}
            className="premium-card p-6 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, color-mix(in srgb, var(--primary) 5%, white), color-mix(in srgb, var(--primary) 2%, white))`,
              borderColor: 'color-mix(in srgb, var(--primary) 20%, transparent)',
            }}
          >
            {/* Background accent */}
            <div
              className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full blur-3xl opacity-10"
              style={{ background: 'var(--primary)' }}
            />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'color-mix(in srgb, var(--primary) 15%, transparent)' }}
                >
                  <Send className="h-4 w-4" style={{ color: 'var(--primary)' }} />
                </div>
                <h2 className="text-lg font-bold text-[#182643]">Ready to Submit?</h2>
              </div>

              <p className="text-sm text-[#6c7890] mb-5">
                Once submitted, your answers are locked and your skill profile will be updated based on your performance.
              </p>

              <div className="space-y-3 mb-6">
                <label className="flex items-center gap-3 text-sm text-[#6c7890] cursor-pointer group">
                  <div className="h-5 w-5 rounded border-2 border-emerald-300 bg-emerald-50 flex items-center justify-center">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  </div>
                  <span className="group-hover:text-[#182643] transition-colors">
                    I've reviewed all my answers
                  </span>
                </label>
                <label className="flex items-center gap-3 text-sm text-[#6c7890] cursor-pointer group">
                  <div className="h-5 w-5 rounded border-2 border-emerald-300 bg-emerald-50 flex items-center justify-center">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  </div>
                  <span className="group-hover:text-[#182643] transition-colors">
                    I understand that marked questions will still be evaluated
                  </span>
                </label>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => navigate(`/assessments/${assessmentId}/attempt/${attemptId}`)}
                  variant="outline"
                  className="flex-1 border-2 font-semibold"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Assessment
                </Button>
                <Button
                  onClick={() => setShowConfirmation(true)}
                  disabled={isSubmitting}
                  className="flex-1 text-white font-bold shadow-lg hover:shadow-xl transition-all"
                  style={{
                    background: `linear-gradient(135deg, #059669, #047857)`,
                  }}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Submitting..." : "Submit Assessment"}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* ── Confirmation Modal ─────────────────────────────────────────── */}
        <AnimatePresence>
          {showConfirmation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 20 }}
                className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl"
              >
                {/* Icon */}
                <div className="flex justify-center mb-5">
                  <div
                    className="h-16 w-16 rounded-2xl flex items-center justify-center"
                    style={{ background: 'color-mix(in srgb, var(--primary) 10%, white)' }}
                  >
                    <Shield className="h-8 w-8" style={{ color: 'var(--primary)' }} />
                  </div>
                </div>

                <h2 className="text-xl font-extrabold text-[#182643] text-center">
                  Submit Assessment?
                </h2>
                <p className="text-sm text-[#6c7890] text-center mt-2">
                  You're submitting with <span className="font-bold text-[#182643]">{stats.answered} answers</span>.
                  This action cannot be undone.
                </p>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2 mt-5 mb-6">
                  <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-center">
                    <p className="text-lg font-extrabold text-emerald-700">{stats.answered}</p>
                    <p className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider">Answered</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-center">
                    <p className="text-lg font-extrabold text-amber-700">{stats.markedForReview}</p>
                    <p className="text-[10px] font-bold uppercase text-amber-600 tracking-wider">Marked</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
                    <p className="text-lg font-extrabold text-slate-700">{stats.unanswered}</p>
                    <p className="text-[10px] font-bold uppercase text-slate-600 tracking-wider">Skipped</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowConfirmation(false)}
                    variant="outline"
                    className="flex-1 border-2 font-semibold"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 text-white font-bold shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, #059669, #047857)`,
                    }}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Submitting...
                      </span>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Confirm Submit
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PragatiFrame>
  );
}

// ============================================================================
// Subcomponents
// ============================================================================

interface ReviewStatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: "slate" | "emerald" | "amber" | "primary";
  subtext?: string;
}

function ReviewStatCard({ icon, label, value, color, subtext }: ReviewStatCardProps) {
  const colorMap = {
    slate: {
      bg: "bg-slate-50",
      border: "border-slate-200",
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
      textColor: "text-slate-800",
    },
    emerald: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      textColor: "text-emerald-800",
    },
    amber: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      textColor: "text-amber-800",
    },
    primary: {
      bg: "bg-white",
      border: "border-slate-200",
      iconBg: "",
      iconColor: "",
      textColor: "",
    },
  };

  const c = colorMap[color];
  const isPrimary = color === "primary";

  return (
    <motion.div
      variants={itemVariants}
      className={`rounded-2xl border-2 ${c.border} ${c.bg} p-4 hover:shadow-md transition-all duration-300`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`h-8 w-8 rounded-lg flex items-center justify-center ${isPrimary ? "" : `${c.iconBg}`}`}
          style={isPrimary ? { background: 'color-mix(in srgb, var(--primary) 12%, transparent)' } : undefined}
        >
          <span className={isPrimary ? "" : c.iconColor} style={isPrimary ? { color: 'var(--primary)' } : undefined}>
            {icon}
          </span>
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${isPrimary ? "text-[#7d8ba3]" : c.iconColor}`}>
          {label}
        </span>
      </div>
      <p
        className={`text-2xl font-extrabold ${isPrimary ? "text-[#182643]" : c.textColor}`}
        style={isPrimary ? { color: 'var(--primary)' } : undefined}
      >
        {value}
      </p>
      {subtext && (
        <p className="text-[10px] font-semibold text-[#7d8ba3] mt-0.5">{subtext}</p>
      )}
    </motion.div>
  );
}
