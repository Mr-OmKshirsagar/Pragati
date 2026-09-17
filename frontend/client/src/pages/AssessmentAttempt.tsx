/**
 * Assessment Attempt Page — Focused Exam Interface
 * Route: /assessments/:id/attempt/:attemptId
 * Distraction-free assessment interface with role-themed accents,
 * smooth transitions, and premium micro-interactions
 */

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRoute, useLocation } from "wouter";
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  LogOut,
  Play,
  AlertTriangle,
  Shield,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useAssessmentState } from "@/hooks/useAssessmentState";
import { AssessmentTimer } from "@/components/assessment/AssessmentTimer";
import { QuestionCard } from "@/components/assessment/QuestionCard";
import { QuestionNavigator } from "@/components/assessment/QuestionNavigator";
import * as assessmentService from "@/services/assessmentService";
import type { Question, AttemptState, QuestionDisplay, AnswerType } from "@/types/assessment";

interface MockQuestion extends QuestionDisplay {
  id: string;
  questionNumber: number;
  type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE" | "NUMERICAL" | "SHORT_TEXT";
  text: string;
  skillTags: string[];
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  options?: string[];
}

export default function AssessmentAttemptPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/assessments/:id/attempt/:attemptId");

  const assessmentId = params?.id as string;
  const attemptId = params?.attemptId as string;

  const state = useAssessmentState({
    attemptId,
    assessmentId,
    autoSaveInterval: 5000,
  });

  const [mockQuestions, setMockQuestions] = useState<MockQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNavigator, setShowNavigator] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [timeExpired, setTimeExpired] = useState(false);

  // Initialize assessment
  useEffect(() => {
    initializeAssessment();
  }, [assessmentId, attemptId]);

  const initializeAssessment = async () => {
    setIsLoading(true);

    try {
      // Mock questions for demonstration
      const questions: MockQuestion[] = Array.from({ length: 30 }, (_, i) => ({
        id: `q${i + 1}`,
        assessmentId: assessmentId || "default",
        questionNumber: i + 1,
        type: i % 3 === 0 ? "SINGLE_CHOICE" : i % 3 === 1 ? "MULTIPLE_CHOICE" : "TRUE_FALSE",
        text: `Question ${i + 1}: What is the correct answer to this question about ${["DSA", "OOP", "Algorithms", "Data Structures"][i % 4]}?`,
        skillTags: ["Core Technical", "Problem Solving"],
        difficulty: ["BEGINNER", "INTERMEDIATE", "ADVANCED"][i % 3] as any,
        options: [
          "Option A - First choice",
          "Option B - Second choice",
          "Option C - Third choice",
          "Option D - Fourth choice",
        ],
      }));

      setMockQuestions(questions);

      // Initialize attempt state
      const initialQuestions = questions.map((q) => ({
        questionId: q.id,
        answer: undefined,
        isAnswered: false,
        markedForReview: false,
        savedAt: 0,
      }));

      const attempt: AttemptState = {
        attemptId,
        assessmentId,
        studentId: "student_123",
        startedAt: Date.now(),
        lastModified: Date.now(),
        questions: initialQuestions,
        currentQuestionIndex: 0,
        status: "ACTIVE",
        serverEndTime: Date.now() + 45 * 60 * 1000, // 45 minutes from now
      };

      state.setAttempt(attempt);
      state.setPhase("QUESTION");
    } catch (error) {
      console.error("Failed to initialize assessment:", error);
      state.setPhase("ERROR");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle time expiration
  const handleTimeExpired = useCallback(() => {
    setTimeExpired(true);
    state.addNotification({
      id: `time_expired_${Date.now()}`,
      type: "ERROR",
      message: "Time's up! Your assessment has been submitted.",
      dismissible: false,
    });

    // Auto-submit after notification
    setTimeout(() => {
      handleSubmitAssessment();
    }, 3000);
  }, [state]);

  // Handle low time warning
  const handleLowTime = useCallback((seconds: number) => {
    state.addNotification({
      id: `low_time_${seconds}`,
      type: "WARNING",
      message: `${Math.floor(seconds / 60)} minutes remaining. Make sure to review your answers.`,
      dismissible: true,
      duration: 5000,
    });
  }, [state]);

  // Navigation handlers
  const handlePreviousQuestion = useCallback(() => {
    if (state.canNavigatePreviousQuestion) {
      state.setCurrentQuestion(state.currentQuestionIndex - 1);
    }
  }, [state]);

  const handleNextQuestion = useCallback(() => {
    if (state.canNavigateNextQuestion) {
      state.setCurrentQuestion(state.currentQuestionIndex + 1);
    }
  }, [state]);

  const handleAnswerChange = useCallback(
    (answer: AnswerType) => {
      if (state.attempt) {
        const currentQuestion = mockQuestions[state.currentQuestionIndex];
        state.setAnswer(currentQuestion.id, answer);
      }
    },
    [state, mockQuestions, state.currentQuestionIndex]
  );

  const handleMarkForReview = useCallback(() => {
    if (state.attempt) {
      const currentQuestion = mockQuestions[state.currentQuestionIndex];
      const isMarked =
        state.attempt.questions[state.currentQuestionIndex]?.markedForReview || false;

      if (isMarked) {
        state.unmarkForReview(currentQuestion.id);
      } else {
        state.markForReview(currentQuestion.id);
      }
    }
  }, [state, mockQuestions, state.currentQuestionIndex]);

  const handleExitAssessment = useCallback(() => {
    setShowExitWarning(true);
  }, []);

  const handleConfirmExit = useCallback(() => {
    navigate("/assessments");
  }, [navigate]);

  const handleSubmitAssessment = useCallback(() => {
    state.setPhase("REVIEW");
    navigate(`/assessments/${assessmentId}/result/${attemptId}`);
  }, [state, assessmentId, attemptId, navigate]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#f8fafc' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div
            className="inline-flex animate-spin rounded-full h-12 w-12 border-b-2"
            style={{ borderColor: 'var(--primary)' }}
          />
          <p className="mt-4 text-sm text-[#6c7890] font-medium">Preparing your assessment...</p>
        </motion.div>
      </div>
    );
  }

  if (!state.attempt || mockQuestions.length === 0) {
    return null;
  }

  const currentQuestion = mockQuestions[state.currentQuestionIndex];
  const currentQuestionState = state.attempt.questions[state.currentQuestionIndex];
  const progress = ((state.currentQuestionIndex + 1) / mockQuestions.length) * 100;

  return (
    <div className="fixed inset-0 bg-white overflow-hidden">
      {/* ── Header Bar ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-7"
      >
        {/* Progress bar underneath header */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100">
          <motion.div
            className="h-full"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, var(--primary), color-mix(in srgb, var(--primary) 60%, white))`,
            }}
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{ background: 'color-mix(in srgb, var(--primary) 12%, transparent)' }}
            >
              <Shield className="h-4 w-4" style={{ color: 'var(--primary)' }} />
            </div>
            <div className="text-sm">
              <p className="font-bold text-[#182643]">PRAGATI</p>
              <p className="text-[10px] text-[#7d8ba3] font-medium uppercase tracking-wider">Assessment</p>
            </div>
          </div>
          <div className="hidden sm:block border-l border-slate-200 pl-4">
            <p className="text-[10px] font-bold uppercase text-[#7d8ba3] tracking-wider">DSA Assessment</p>
            <p className="text-sm font-bold text-[#182643]">
              Question <span style={{ color: 'var(--primary)' }}>{state.currentQuestionIndex + 1}</span> of {mockQuestions.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <AssessmentTimer
            serverEndTime={state.attempt.serverEndTime}
            onTimeExpired={handleTimeExpired}
            onLowTime={handleLowTime}
            lowTimeThreshold={300}
          />
          <button
            onClick={handleExitAssessment}
            className="rounded-lg p-2 text-[#64748b] hover:bg-red-50 hover:text-red-600 transition-all"
            title="Exit Assessment"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </motion.div>

      {/* ── Main Content ───────────────────────────────────────────────── */}
      <div className="flex h-[calc(100vh-70px)] overflow-hidden">
        {/* Question Area */}
        <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-7 lg:max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <QuestionCard
                question={currentQuestion}
                selectedAnswer={currentQuestionState?.answer}
                onAnswerSelect={handleAnswerChange}
                isAnswered={currentQuestionState?.isAnswered || false}
                markedForReview={currentQuestionState?.markedForReview || false}
                onMarkForReview={handleMarkForReview}
              />
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="mt-12 flex items-center justify-between gap-4">
            <Button
              onClick={handlePreviousQuestion}
              disabled={!state.canNavigatePreviousQuestion}
              variant="outline"
              className="gap-2 border-2 font-semibold"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              <div className="text-xs text-[#7d8ba3] font-bold">
                {state.currentQuestionIndex + 1} / {mockQuestions.length}
              </div>
            </div>

            {state.currentQuestionIndex === mockQuestions.length - 1 ? (
              <Button
                onClick={handleSubmitAssessment}
                className="gap-2 font-bold text-white shadow-md hover:shadow-lg transition-all"
                style={{
                  background: `linear-gradient(135deg, #059669, #047857)`,
                }}
              >
                <Play className="h-4 w-4" />
                Review & Submit
              </Button>
            ) : (
              <Button
                onClick={handleNextQuestion}
                disabled={!state.canNavigateNextQuestion}
                className="gap-2 font-semibold text-white"
                style={{
                  background: `linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 80%, black))`,
                }}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Navigator Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden xl:flex border-l border-slate-200 w-80 overflow-y-auto flex-col gap-6 bg-slate-50/80 p-6"
        >
          <QuestionNavigator
            questions={state.attempt.questions}
            currentQuestionIndex={state.currentQuestionIndex}
            onNavigate={(index) => state.setCurrentQuestion(index)}
          />
        </motion.div>

        {/* Mobile Navigator Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowNavigator(!showNavigator)}
          className="absolute right-4 bottom-4 lg:hidden rounded-full p-4 text-white shadow-xl hover:shadow-2xl transition-all"
          style={{
            background: `linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 80%, black))`,
          }}
        >
          <Flag className="h-5 w-5" />
          {state.progress.markedForReviewCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 text-[10px] font-bold text-white flex items-center justify-center">
              {state.progress.markedForReviewCount}
            </span>
          )}
        </motion.button>
      </div>

      {/* ── Mobile Navigator Drawer ────────────────────────────────────── */}
      <AnimatePresence>
        {showNavigator && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNavigator(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm xl:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 20 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-80 bg-white overflow-y-auto p-6 space-y-6 shadow-2xl"
            >
              <button
                onClick={() => setShowNavigator(false)}
                className="text-[#7d8ba3] hover:text-[#182643] rounded-lg p-1 hover:bg-slate-100 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
              <QuestionNavigator
                questions={state.attempt.questions}
                currentQuestionIndex={state.currentQuestionIndex}
                onNavigate={(index) => {
                  state.setCurrentQuestion(index);
                  setShowNavigator(false);
                }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Exit Warning Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showExitWarning && (
          <ExitWarningModal
            onContinue={() => setShowExitWarning(false)}
            onConfirmExit={handleConfirmExit}
          />
        )}
      </AnimatePresence>

      {/* ── Notifications ──────────────────────────────────────────────── */}
      <div className="fixed top-20 right-4 z-40 space-y-2 max-w-sm">
        <AnimatePresence>
          {state.notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: -10, x: 20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: -10, x: 20 }}
              className={`rounded-xl px-4 py-3 text-sm font-semibold border-2 shadow-lg ${
                notification.type === "ERROR"
                  ? "bg-red-50 text-red-700 border-red-200"
                  : notification.type === "WARNING"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : notification.type === "SUCCESS"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-blue-50 text-blue-700 border-blue-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{notification.message}</span>
                {notification.dismissible && (
                  <button
                    onClick={() => state.removeNotification(notification.id)}
                    className="ml-4 hover:opacity-70 rounded-lg p-0.5"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ============================================================================
// Exit Warning Modal
// ============================================================================

function ExitWarningModal({
  onContinue,
  onConfirmExit,
}: {
  onContinue: () => void;
  onConfirmExit: () => void;
}) {
  return (
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
        <div className="flex justify-center mb-5">
          <div className="h-16 w-16 rounded-2xl bg-red-50 border-2 border-red-100 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <h2 className="text-xl font-extrabold text-[#182643] text-center">
          Leave Assessment?
        </h2>
        <p className="mt-2 text-sm text-[#6c7890] text-center">
          Your progress is saved, but the assessment timer will continue counting down.
        </p>

        <div className="mt-6 flex gap-3">
          <Button
            onClick={onContinue}
            variant="outline"
            className="flex-1 border-2 font-semibold"
          >
            Continue Assessment
          </Button>
          <Button
            onClick={onConfirmExit}
            className="flex-1 bg-red-600 hover:bg-red-700 font-bold text-white shadow-md"
          >
            Leave
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
