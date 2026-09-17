/**
 * useAssessmentState Hook
 * Central state management for assessment attempts
 * Handles autosave, network sync, timer state
 */

import { useCallback, useEffect, useReducer, useRef } from "react";
import type {
  AttemptState,
  QuestionState,
  AssessmentUIState,
  AnswerType,
  AssessmentNotification,
} from "@/types/assessment";
import * as assessmentService from "@/services/assessmentService";

// ============================================================================
// Types
// ============================================================================

type AssessmentAction =
  | {
      type: "SET_PHASE";
      payload: AssessmentUIState["currentPhase"];
    }
  | {
      type: "SET_ATTEMPT";
      payload: AttemptState;
    }
  | {
      type: "SET_CURRENT_QUESTION";
      payload: number;
    }
  | {
      type: "SET_ANSWER";
      payload: {
        questionId: string;
        answer: AnswerType;
      };
    }
  | {
      type: "MARK_FOR_REVIEW";
      payload: string; // questionId
    }
  | {
      type: "UNMARK_FOR_REVIEW";
      payload: string; // questionId
    }
  | {
      type: "SET_NETWORK_STATUS";
      payload: AssessmentUIState["networkStatus"];
    }
  | {
      type: "INCREMENT_UNSYNCED";
    }
  | {
      type: "DECREMENT_UNSYNCED";
    }
  | {
      type: "SET_FULLSCREEN";
      payload: boolean;
    }
  | {
      type: "ADD_NOTIFICATION";
      payload: AssessmentNotification;
    }
  | {
      type: "REMOVE_NOTIFICATION";
      payload: string; // notificationId
    }
  | {
      type: "RESET";
    };

interface AssessmentStateInternal extends AssessmentUIState {
  attempt?: AttemptState;
  notifications: AssessmentNotification[];
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: AssessmentStateInternal = {
  currentPhase: "LIST",
  currentQuestionIndex: 0,
  isFullscreen: false,
  networkStatus: assessmentService.detectNetworkStatus(),
  unsyncedChanges: 0,
  notifications: [],
};

// ============================================================================
// Reducer
// ============================================================================

function assessmentReducer(
  state: AssessmentStateInternal,
  action: AssessmentAction
): AssessmentStateInternal {
  switch (action.type) {
    case "SET_PHASE":
      return { ...state, currentPhase: action.payload };

    case "SET_ATTEMPT":
      return { ...state, attempt: action.payload };

    case "SET_CURRENT_QUESTION":
      return { ...state, currentQuestionIndex: action.payload };

    case "SET_ANSWER": {
      if (!state.attempt) return state;

      const questionIndex = state.attempt.questions.findIndex(
        (q) => q.questionId === action.payload.questionId
      );

      if (questionIndex === -1) return state;

      const updatedQuestions = [...state.attempt.questions];
      updatedQuestions[questionIndex] = {
        ...updatedQuestions[questionIndex],
        answer: action.payload.answer,
        isAnswered: true,
        savedAt: Date.now(),
      };

      return {
        ...state,
        attempt: {
          ...state.attempt,
          questions: updatedQuestions,
          lastModified: Date.now(),
        },
        unsyncedChanges: state.unsyncedChanges + 1,
      };
    }

    case "MARK_FOR_REVIEW": {
      if (!state.attempt) return state;

      const questionIndex = state.attempt.questions.findIndex(
        (q) => q.questionId === action.payload
      );

      if (questionIndex === -1) return state;

      const updatedQuestions = [...state.attempt.questions];
      updatedQuestions[questionIndex] = {
        ...updatedQuestions[questionIndex],
        markedForReview: true,
      };

      return {
        ...state,
        attempt: {
          ...state.attempt,
          questions: updatedQuestions,
        },
      };
    }

    case "UNMARK_FOR_REVIEW": {
      if (!state.attempt) return state;

      const questionIndex = state.attempt.questions.findIndex(
        (q) => q.questionId === action.payload
      );

      if (questionIndex === -1) return state;

      const updatedQuestions = [...state.attempt.questions];
      updatedQuestions[questionIndex] = {
        ...updatedQuestions[questionIndex],
        markedForReview: false,
      };

      return {
        ...state,
        attempt: {
          ...state.attempt,
          questions: updatedQuestions,
        },
      };
    }

    case "SET_NETWORK_STATUS":
      return {
        ...state,
        networkStatus: action.payload,
        lastSyncTime: action.payload === "ONLINE" ? Date.now() : state.lastSyncTime,
      };

    case "INCREMENT_UNSYNCED":
      return { ...state, unsyncedChanges: state.unsyncedChanges + 1 };

    case "DECREMENT_UNSYNCED":
      return { ...state, unsyncedChanges: Math.max(0, state.unsyncedChanges - 1) };

    case "SET_FULLSCREEN":
      return { ...state, isFullscreen: action.payload };

    case "ADD_NOTIFICATION":
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };

    case "REMOVE_NOTIFICATION":
      return {
        ...state,
        notifications: state.notifications.filter((n) => n.id !== action.payload),
      };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

// ============================================================================
// Hook
// ============================================================================

interface UseAssessmentStateOptions {
  attemptId?: string;
  assessmentId?: string;
  autoSaveInterval?: number;
  pollInterval?: number;
}

export function useAssessmentState(options: UseAssessmentStateOptions = {}) {
  const {
    attemptId,
    assessmentId,
    autoSaveInterval = 10000, // 10s
    pollInterval = 5000, // 5s
  } = options;

  const [state, dispatch] = useReducer(assessmentReducer, initialState);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const networkCheckTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ========================================================================
  // Network Status Monitoring
  // ========================================================================

  useEffect(() => {
    const handleOnline = () => {
      dispatch({ type: "SET_NETWORK_STATUS", payload: "ONLINE" });
    };

    const handleOffline = () => {
      dispatch({ type: "SET_NETWORK_STATUS", payload: "OFFLINE" });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // ========================================================================
  // Autosave
  // ========================================================================

  const performAutosave = useCallback(async () => {
    if (!state.attempt || state.unsyncedChanges === 0 || state.networkStatus === "OFFLINE") {
      return;
    }

    try {
      // Find all unsynced answers
      const unsyncedAnswers = state.attempt.questions.filter((q) => !q.savedAt);

      if (unsyncedAnswers.length === 0) {
        return;
      }

      // Save to backend
      for (const question of unsyncedAnswers) {
        if (question.answer !== undefined && question.isAnswered) {
          await assessmentService.saveAnswer(
            state.attempt.attemptId,
            question.questionId,
            question.answer
          );

          dispatch({ type: "DECREMENT_UNSYNCED" });
        }
      }
    } catch (error) {
      console.error("Autosave failed:", error);
      // Show notification but don't crash
      dispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          id: `autosave_error_${Date.now()}`,
          type: "WARNING",
          message: "Unable to save response. Will retry automatically.",
          dismissible: true,
          duration: 5000,
        },
      });
    }
  }, [state.attempt, state.unsyncedChanges, state.networkStatus]);

  useEffect(() => {
    autoSaveTimerRef.current = setInterval(performAutosave, autoSaveInterval);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [performAutosave, autoSaveInterval]);

  // ========================================================================
  // Action Creators
  // ========================================================================

  const setPhase = useCallback((phase: AssessmentUIState["currentPhase"]) => {
    dispatch({ type: "SET_PHASE", payload: phase });
  }, []);

  const setAttempt = useCallback((attempt: AttemptState) => {
    dispatch({ type: "SET_ATTEMPT", payload: attempt });
  }, []);

  const setCurrentQuestion = useCallback((index: number) => {
    dispatch({ type: "SET_CURRENT_QUESTION", payload: index });
  }, []);

  const setAnswer = useCallback((questionId: string, answer: AnswerType) => {
    dispatch({
      type: "SET_ANSWER",
      payload: { questionId, answer },
    });
  }, []);

  const markForReview = useCallback((questionId: string) => {
    dispatch({ type: "MARK_FOR_REVIEW", payload: questionId });
  }, []);

  const unmarkForReview = useCallback((questionId: string) => {
    dispatch({ type: "UNMARK_FOR_REVIEW", payload: questionId });
  }, []);

  const setFullscreen = useCallback((isFullscreen: boolean) => {
    dispatch({ type: "SET_FULLSCREEN", payload: isFullscreen });
  }, []);

  const addNotification = useCallback((notification: AssessmentNotification) => {
    dispatch({ type: "ADD_NOTIFICATION", payload: notification });

    if (notification.duration) {
      setTimeout(() => {
        dispatch({ type: "REMOVE_NOTIFICATION", payload: notification.id });
      }, notification.duration);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    dispatch({ type: "REMOVE_NOTIFICATION", payload: id });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  // ========================================================================
  // Progress Calculation
  // ========================================================================

  const progress = {
    totalQuestions: state.attempt?.questions.length ?? 0,
    answeredCount: state.attempt?.questions.filter((q) => q.isAnswered).length ?? 0,
    markedForReviewCount:
      state.attempt?.questions.filter((q) => q.markedForReview).length ?? 0,
    percentProgress: state.attempt?.questions.length
      ? Math.round(
          ((state.attempt.questions.filter((q) => q.isAnswered).length /
            state.attempt.questions.length) *
            100) as number
        )
      : 0,
  };

  return {
    // State
    phase: state.currentPhase,
    attempt: state.attempt,
    currentQuestionIndex: state.currentQuestionIndex,
    isFullscreen: state.isFullscreen,
    networkStatus: state.networkStatus,
    unsyncedChanges: state.unsyncedChanges,
    notifications: state.notifications,
    progress,

    // Actions
    setPhase,
    setAttempt,
    setCurrentQuestion,
    setAnswer,
    markForReview,
    unmarkForReview,
    setFullscreen,
    addNotification,
    removeNotification,
    reset,
    performAutosave,

    // Helpers
    canNavigateNextQuestion:
      state.currentQuestionIndex < (state.attempt?.questions.length ?? 0) - 1,
    canNavigatePreviousQuestion: state.currentQuestionIndex > 0,
  };
}

export type UseAssessmentStateReturn = ReturnType<typeof useAssessmentState>;
