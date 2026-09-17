/**
 * QuestionCard Component
 * Displays a single question with answer options
 * Supports smooth answer selection and visual feedback
 */

import { motion, AnimatePresence } from "framer-motion";
import type { Question, QuestionDisplay, AnswerType } from "@/types/assessment";

interface QuestionCardProps {
  question: QuestionDisplay;
  selectedAnswer?: AnswerType;
  onAnswerSelect: (answer: AnswerType) => void;
  isAnswered: boolean;
  markedForReview: boolean;
  onMarkForReview: (marked: boolean) => void;
}

export function QuestionCard({
  question,
  selectedAnswer,
  onAnswerSelect,
  isAnswered,
  markedForReview,
  onMarkForReview,
}: QuestionCardProps) {
  const renderQuestion = () => {
    switch (question.type) {
      case "SINGLE_CHOICE":
        return (
          <SingleChoiceQuestion
            question={question}
            selectedAnswer={selectedAnswer as string}
            onAnswerSelect={onAnswerSelect}
          />
        );
      case "MULTIPLE_CHOICE":
        return (
          <MultipleChoiceQuestion
            question={question}
            selectedAnswer={selectedAnswer as string[]}
            onAnswerSelect={onAnswerSelect}
          />
        );
      case "TRUE_FALSE":
        return (
          <TrueFalseQuestion
            question={question}
            selectedAnswer={selectedAnswer as boolean}
            onAnswerSelect={onAnswerSelect}
          />
        );
      case "NUMERICAL":
        return (
          <NumericalQuestion
            question={question}
            selectedAnswer={selectedAnswer as number}
            onAnswerSelect={onAnswerSelect}
          />
        );
      case "SHORT_TEXT":
        return (
          <ShortTextQuestion
            question={question}
            selectedAnswer={selectedAnswer as string}
            onAnswerSelect={onAnswerSelect}
          />
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Question Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-sm font-semibold text-[#7d8ba3] uppercase tracking-wide">
              Question {question.id}
            </p>
            <h2 className="text-xl font-bold text-[#182643] leading-relaxed">
              {question.text}
            </h2>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onMarkForReview(!markedForReview)}
            className={`ml-4 flex-shrink-0 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
              markedForReview
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            {markedForReview ? "✓ Marked" : "Mark"}
          </motion.button>
        </div>

        {/* Skill Tags */}
        {question.skillTags && question.skillTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {question.skillTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-[10px] font-semibold text-indigo-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Answer Options */}
      <div className="space-y-3">{renderQuestion()}</div>

      {/* Answer Status */}
      <AnimatePresence>
        {isAnswered && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 border border-emerald-200"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Answer saved
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// Question Type Components
// ============================================================================

interface QuestionTypeProps {
  question: QuestionDisplay;
  selectedAnswer?: AnswerType;
  onAnswerSelect: (answer: AnswerType) => void;
}

function SingleChoiceQuestion({
  question,
  selectedAnswer,
  onAnswerSelect,
}: QuestionTypeProps & { question: any; selectedAnswer?: string }) {
  const options = question.options || [];

  return (
    <div className="space-y-2.5">
      {options.map((option: string, index: number) => (
        <AnswerOption
          key={index}
          label={option}
          isSelected={selectedAnswer === option}
          onSelect={() => onAnswerSelect(option)}
          type="radio"
        />
      ))}
    </div>
  );
}

function MultipleChoiceQuestion({
  question,
  selectedAnswer = [],
  onAnswerSelect,
}: QuestionTypeProps & { selectedAnswer?: string[] }) {
  const options = (question as any).options || [];
  const selected = Array.isArray(selectedAnswer) ? selectedAnswer : [];

  const handleToggle = (option: string) => {
    const newSelected = selected.includes(option)
      ? selected.filter((s) => s !== option)
      : [...selected, option];
    onAnswerSelect(newSelected);
  };

  return (
    <div className="space-y-2.5">
      <p className="text-xs text-[#7d8ba3] font-semibold">Select all that apply:</p>
      {options.map((option: string, index: number) => (
        <AnswerOption
          key={index}
          label={option}
          isSelected={selected.includes(option)}
          onSelect={() => handleToggle(option)}
          type="checkbox"
        />
      ))}
    </div>
  );
}

function TrueFalseQuestion({
  question,
  selectedAnswer,
  onAnswerSelect,
}: QuestionTypeProps & { selectedAnswer?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <AnswerOption
        label="True"
        isSelected={selectedAnswer === true}
        onSelect={() => onAnswerSelect(true)}
        type="radio"
      />
      <AnswerOption
        label="False"
        isSelected={selectedAnswer === false}
        onSelect={() => onAnswerSelect(false)}
        type="radio"
      />
    </div>
  );
}

function NumericalQuestion({
  question,
  selectedAnswer,
  onAnswerSelect,
}: QuestionTypeProps & { selectedAnswer?: number }) {
  return (
    <div>
      <input
        type="number"
        value={selectedAnswer !== undefined ? selectedAnswer : ""}
        onChange={(e) => onAnswerSelect(e.target.value ? parseFloat(e.target.value) : 0)}
        placeholder="Enter your answer"
        className="w-full rounded-xl border border-[#cbd5e1] bg-white px-4 py-3 text-sm font-semibold text-[#182643] outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      />
    </div>
  );
}

function ShortTextQuestion({
  question,
  selectedAnswer,
  onAnswerSelect,
}: QuestionTypeProps & { selectedAnswer?: string }) {
  return (
    <div>
      <input
        type="text"
        value={selectedAnswer || ""}
        onChange={(e) => onAnswerSelect(e.target.value)}
        placeholder="Type your answer here"
        className="w-full rounded-xl border border-[#cbd5e1] bg-white px-4 py-3 text-sm font-semibold text-[#182643] outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
    </div>
  );
}

// ============================================================================
// Answer Option Component
// ============================================================================

interface AnswerOptionProps {
  label: string;
  isSelected: boolean;
  onSelect: () => void;
  type: "radio" | "checkbox";
}

function AnswerOption({ label, isSelected, onSelect, type }: AnswerOptionProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onSelect}
      className={`w-full rounded-xl border-2 px-4 py-3.5 text-left text-sm font-semibold transition-all ${
        isSelected
          ? "border-indigo-600 bg-indigo-50 text-indigo-900"
          : "border-[#e2e8f2] bg-white text-[#3d4959] hover:border-indigo-300 hover:bg-indigo-50/50"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
            isSelected
              ? "border-indigo-600 bg-indigo-600"
              : "border-[#cbd5e1] bg-white"
          }`}
        >
          {isSelected && (
            <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              {type === "radio" ? (
                <circle cx="10" cy="10" r="4" />
              ) : (
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              )}
            </svg>
          )}
        </div>
        <span>{label}</span>
      </div>
    </motion.button>
  );
}
