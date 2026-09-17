/**
 * QuestionNavigator Component
 * Shows grid of question status buttons with quick navigation
 * Displays answered, current, unanswered, and marked for review states
 */

import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Circle } from "lucide-react";
import type { QuestionState } from "@/types/assessment";

interface QuestionNavigatorProps {
  questions: QuestionState[];
  currentQuestionIndex: number;
  onNavigate: (index: number) => void;
  onlyShowMarked?: boolean;
}

export function QuestionNavigator({
  questions,
  currentQuestionIndex,
  onNavigate,
  onlyShowMarked = false,
}: QuestionNavigatorProps) {
  const displayQuestions = onlyShowMarked
    ? questions
        .map((q, idx) => ({ ...q, originalIndex: idx }))
        .filter((q) => q.markedForReview)
    : questions.map((q, idx) => ({ ...q, originalIndex: idx }));

  const stats = {
    answered: questions.filter((q) => q.isAnswered).length,
    marked: questions.filter((q) => q.markedForReview).length,
    total: questions.length,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-3 border border-slate-200">
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase text-slate-600">Answered</p>
          <p className="mt-1 text-lg font-bold text-emerald-600">{stats.answered}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase text-slate-600">Marked</p>
          <p className="mt-1 text-lg font-bold text-amber-600">{stats.marked}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase text-slate-600">Total</p>
          <p className="mt-1 text-lg font-bold text-slate-600">{stats.total}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="h-1 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600"
        style={{
          width: `${Math.round(((stats.answered / stats.total) * 100) as number)}%`,
        }}
      />

      {/* Question Grid */}
      <div>
        <p className="text-xs font-semibold uppercase text-slate-600 mb-3">
          {onlyShowMarked ? "Marked for Review" : "All Questions"}
        </p>
        <div className="grid grid-cols-auto gap-2 max-h-64 overflow-y-auto">
          {displayQuestions.map((question, idx) => (
            <QuestionButton
              key={question.originalIndex}
              number={question.originalIndex + 1}
              isAnswered={question.isAnswered}
              isMarked={question.markedForReview}
              isCurrent={question.originalIndex === currentQuestionIndex}
              onClick={() => onNavigate(question.originalIndex)}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2 border-t border-slate-200 pt-3 text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <div className="h-2 w-2 rounded-full bg-emerald-600" />
          <span>Answered</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <div className="h-2 w-2 rounded-full bg-amber-600" />
          <span>Marked for Review</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <div className="h-2 w-2 rounded-full border-2 border-indigo-600" />
          <span>Current Question</span>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Question Button Component
// ============================================================================

interface QuestionButtonProps {
  number: number;
  isAnswered: boolean;
  isMarked: boolean;
  isCurrent: boolean;
  onClick: () => void;
}

function QuestionButton({
  number,
  isAnswered,
  isMarked,
  isCurrent,
  onClick,
}: QuestionButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`relative h-10 w-10 rounded-lg font-bold text-xs transition-all ${
        isCurrent
          ? "ring-2 ring-indigo-600 bg-indigo-50 text-indigo-700"
          : isAnswered
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : isMarked
              ? "bg-amber-50 text-amber-700 border border-amber-200"
              : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
      }`}
    >
      {number}
      {isMarked && (
        <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-600" />
      )}
    </motion.button>
  );
}
