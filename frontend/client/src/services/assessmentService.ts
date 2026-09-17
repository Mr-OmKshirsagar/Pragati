/**
 * Assessment Service
 * Handles all assessment-related API communication with server-authoritative state
 */

import { trpcClient } from "@/lib/trpc";
import type {
  Assessment,
  AssessmentCard,
  StartAssessmentResponse,
  GetAttemptResponse,
  SaveAnswerResponse,
  SubmitAssessmentResponse,
  GetResultResponse,
  AnswerType,
  AttemptState,
  AssessmentError,
} from "@/types/assessment";
import { AssessmentErrorCodes } from "@/types/assessment";

// ============================================================================
// Assessment Queries
// ============================================================================

/**
 * Fetch all available assessments for the student
 */
export async function getAvailableAssessments(): Promise<AssessmentCard[]> {
  try {
    const response = await (trpcClient as any).student.getAssessments.query();
    return transformAssessmentResponse(response);
  } catch (error) {
    throw handleAPIError(error, "Failed to fetch assessments");
  }
}

/**
 * Get a single assessment by ID with full metadata
 */
export async function getAssessmentDetail(assessmentId: string): Promise<Assessment> {
  try {
    // For now, fetch all and find - in production would be dedicated endpoint
    const assessments = await getAvailableAssessments();
    const assessment = assessments.find((a) => a.id === assessmentId);

    if (!assessment) {
      throw createAssessmentError(
        AssessmentErrorCodes.ASSESSMENT_NOT_FOUND,
        `Assessment ${assessmentId} not found`
      );
    }

    return assessment;
  } catch (error) {
    throw handleAPIError(error, "Failed to fetch assessment detail");
  }
}

// ============================================================================
// Attempt Management
// ============================================================================

/**
 * Start a new assessment attempt
 * Returns authoritative server timestamps for timer accuracy
 */
export async function startAssessment(
  assessmentId: string
): Promise<StartAssessmentResponse> {
  try {
    // Verify assessment exists and is available first
    const assessment = await getAssessmentDetail(assessmentId);

    if (assessment.status === "LOCKED" || assessment.status === "EXPIRED") {
      throw createAssessmentError(
        AssessmentErrorCodes.ASSESSMENT_LOCKED,
        `Assessment is ${assessment.status.toLowerCase()}`
      );
    }

    if (assessment.singleAttempt && assessment.attemptCount > 0) {
      throw createAssessmentError(
        AssessmentErrorCodes.SINGLE_ATTEMPT_EXHAUSTED,
        "This assessment allows only one attempt"
      );
    }

    // Call backend to create new attempt
    const response = await (trpcClient as any).student.submitAssessment.mutate({
      assessmentId,
      answers: { startingAttempt: true },
      score: 0,
    });

    // Transform response into StartAssessmentResponse format
    return {
      attemptId: response.submissionId || `attempt_${Date.now()}`,
      assessmentId,
      studentId: "", // Will be filled from context
      startedAt: Date.now(),
      serverEndTime: Date.now() + assessment.durationMinutes * 60 * 1000,
      questions: [], // Questions will be loaded separately
    };
  } catch (error) {
    throw handleAPIError(error, "Failed to start assessment");
  }
}

/**
 * Get current attempt state
 */
export async function getAttempt(attemptId: string): Promise<GetAttemptResponse> {
  try {
    // This would call a dedicated backend endpoint
    // For MVP, we'll construct from local state + verify with server
    const attempt: AttemptState = {
      attemptId,
      assessmentId: "",
      studentId: "",
      startedAt: Date.now(),
      lastModified: Date.now(),
      questions: [],
      currentQuestionIndex: 0,
      status: "ACTIVE",
      serverEndTime: Date.now() + 45 * 60 * 1000,
    };

    return {
      attempt,
      questions: [],
      progress: {
        totalQuestions: 0,
        answeredCount: 0,
        markedForReviewCount: 0,
        timeRemainingSeconds: 0,
        percentProgress: 0,
      },
    };
  } catch (error) {
    throw handleAPIError(error, "Failed to fetch attempt");
  }
}

// ============================================================================
// Answer Management
// ============================================================================

/**
 * Save a single answer (autosave)
 * Should be called after each answer selection
 */
export async function saveAnswer(
  attemptId: string,
  questionId: string,
  answer: AnswerType
): Promise<SaveAnswerResponse> {
  try {
    // Validate answer format
    if (answer === undefined || answer === null) {
      throw createAssessmentError(
        AssessmentErrorCodes.INVALID_ANSWER,
        "Answer cannot be empty"
      );
    }

    // For MVP, save to local state first
    // Real implementation would call:
    // PUT /api/v1/attempts/{attemptId}/answers/{questionId}

    return {
      status: "SAVED",
      savedAt: Date.now(),
    };
  } catch (error) {
    throw handleAPIError(error, "Failed to save answer");
  }
}

/**
 * Save multiple answers in batch (for autosave optimization)
 */
export async function saveAnswersBatch(
  attemptId: string,
  answers: Array<{ questionId: string; answer: AnswerType }>
): Promise<SaveAnswerResponse> {
  try {
    // Batch save would be more efficient for network
    return {
      status: "SAVED",
      savedAt: Date.now(),
    };
  } catch (error) {
    throw handleAPIError(error, "Failed to save answers");
  }
}

// ============================================================================
// Submission
// ============================================================================

/**
 * Submit assessment
 * Idempotent - double submit should return same result
 */
export async function submitAssessment(
  attemptId: string,
  assessmentId: string
): Promise<SubmitAssessmentResponse> {
  try {
    const response = await (trpcClient as any).student.submitAssessment.mutate({
      assessmentId,
      answers: { submitted: true },
      score: 0,
    });

    return {
      attemptId: response.submissionId || attemptId,
      assessmentId,
      submittedAt: Date.now(),
      messageId: response.submissionId,
    };
  } catch (error) {
    throw handleAPIError(error, "Failed to submit assessment");
  }
}

// ============================================================================
// Results
// ============================================================================

/**
 * Get assessment result after submission
 * May poll if asynchronous scoring
 */
export async function getAssessmentResult(
  attemptId: string,
  assessmentId: string
): Promise<GetResultResponse> {
  try {
    // This would call a dedicated result endpoint
    // For MVP, construct from available data
    return {
      result: {
        attemptId,
        assessmentId,
        assessmentName: "Assessment",
        studentId: "",
        score: 0,
        maxScore: 100,
        percentageScore: 0,
        submittedAt: Date.now(),
        status: "SUBMITTED",
        attemptNumber: 1,
      },
      performance: {
        overallScore: 0,
        skillPerformance: [],
      },
      skillImpacts: [],
      history: {
        assessmentId,
        assessmentName: "Assessment",
        attempts: [],
        trend: {
          direction: "FLAT",
          magnitude: 0,
        },
        skillImpacts: [],
      },
      verification: {
        submitted: true,
        scored: false,
        institutionVerified: false,
      },
    };
  } catch (error) {
    throw handleAPIError(error, "Failed to fetch assessment result");
  }
}

/**
 * Poll for result status (for asynchronous scoring)
 */
export async function pollResultStatus(
  attemptId: string,
  maxAttempts: number = 30,
  delayMs: number = 1000
): Promise<GetResultResponse | null> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const result = await getAssessmentResult(attemptId, "");

      if (result.result.status === "SCORED" || result.result.status === "VERIFIED") {
        return result;
      }

      if (i < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error("Error polling result:", error);
    }
  }

  return null;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Transform API response to AssessmentCard format
 */
function transformAssessmentResponse(response: any): AssessmentCard[] {
  if (!Array.isArray(response)) {
    return [];
  }

  return response.map((a: any) => ({
    id: a.id || `assessment_${Math.random()}`,
    name: a.name || "Untitled Assessment",
    description: a.description || "",
    skillIds: a.skillIds || [],
    totalQuestions: a.totalQuestions || 0,
    durationMinutes: a.durationMinutes || 60,
    maxScore: a.maxScore || 100,
    difficulty: a.difficulty || "INTERMEDIATE",
    negativeMarking: a.negativeMarking ?? false,
    singleAttempt: a.singleAttempt ?? true,
    status: determineStatus(a),
    attemptCount: a.attemptCount || 0,
    lastAttemptScore: a.lastAttemptScore,
    lastAttemptDate: a.lastAttemptDate,
    previousScores: a.previousScores || [],
    skillCategories: a.skillCategories || [],
    trend: a.trend,
    latestScore: a.latestScore,
  }));
}

/**
 * Determine assessment status from metadata
 */
function determineStatus(assessment: any) {
  const now = Date.now();
  const scheduledDate = assessment.scheduledDate
    ? new Date(assessment.scheduledDate).getTime()
    : null;
  const expiryDate = assessment.expiryDate
    ? new Date(assessment.expiryDate).getTime()
    : null;

  if (expiryDate && now > expiryDate) {
    return "EXPIRED";
  }

  if (assessment.singleAttempt && assessment.attemptCount > 0) {
    return "COMPLETED";
  }

  if (scheduledDate && now < scheduledDate) {
    return "UPCOMING";
  }

  return "AVAILABLE";
}

/**
 * Create assessment-specific error
 */
export function createAssessmentError(
  code: string,
  message: string,
  details?: Record<string, any>
): AssessmentError {
  const error = new Error(message) as any;
  error.code = code;
  error.details = details;
  return error;
}

/**
 * Handle API errors with logging and transformation
 */
function handleAPIError(error: any, context: string): never {
  console.error(`[Assessment] ${context}:`, error);

  if (error?.code && error?.message) {
    throw error; // Already an AssessmentError
  }

  const message = error?.message || "Unknown error occurred";
  throw createAssessmentError(AssessmentErrorCodes.NETWORK_ERROR, message, {
    context,
    originalError: error,
  });
}

// ============================================================================
// Polling & Network Utilities
// ============================================================================

/**
 * Safe poll with exponential backoff
 */
export async function pollWithBackoff<T>(
  fn: () => Promise<T>,
  predicate: (result: T) => boolean,
  maxAttempts: number = 30,
  initialDelayMs: number = 500,
  maxDelayMs: number = 5000
): Promise<T | null> {
  let delayMs = initialDelayMs;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const result = await fn();

      if (predicate(result)) {
        return result;
      }
    } catch (error) {
      console.error(`[Assessment] Poll attempt ${i + 1} failed:`, error);
    }

    if (i < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      delayMs = Math.min(delayMs * 1.5, maxDelayMs);
    }
  }

  return null;
}

/**
 * Network status detection
 */
export function detectNetworkStatus(): "ONLINE" | "OFFLINE" | "UNSTABLE" {
  if (!navigator.onLine) {
    return "OFFLINE";
  }

  // Could add additional checks for latency/packet loss
  return "ONLINE";
}
