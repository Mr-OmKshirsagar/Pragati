/**
 * Assessment Type Definitions for PRAGATI
 * Comprehensive types for the student assessment experience
 */

// ============================================================================
// Core Assessment Types
// ============================================================================

export type AssessmentStatus =
  | "UPCOMING"
  | "AVAILABLE"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "EXPIRED"
  | "LOCKED";

export type AssessmentDifficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";

export type QuestionType =
  | "SINGLE_CHOICE"
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "NUMERICAL"
  | "SHORT_TEXT";

export type AnswerType = string | string[] | number | boolean;

// ============================================================================
// Assessment Definitions
// ============================================================================

export interface AssessmentMetadata {
  id: string;
  name: string;
  description: string;
  skillIds: string[];
  totalQuestions: number;
  durationMinutes: number;
  maxScore: number;
  difficulty: AssessmentDifficulty;
  negativeMarking: boolean;
  singleAttempt: boolean;
  scheduledDate?: string;
  expiryDate?: string;
}

export interface Assessment extends AssessmentMetadata {
  status: AssessmentStatus;
  lastAttemptScore?: number;
  lastAttemptDate?: string;
  attemptCount: number;
  previousScores: AssessmentScore[];
  skillCategories: string[];
}

export interface AssessmentCard extends Assessment {
  trend?: number; // percentage change from last attempt
  latestScore?: number;
}

// ============================================================================
// Question Definitions
// ============================================================================

export interface QuestionBase {
  id: string;
  assessmentId: string;
  questionNumber: number;
  type: QuestionType;
  text: string;
  explanation?: string;
  skillTags: string[];
  difficulty: AssessmentDifficulty;
}

export interface SingleChoiceQuestion extends QuestionBase {
  type: "SINGLE_CHOICE";
  options: string[];
  correctAnswer: string;
}

export interface MultipleChoiceQuestion extends QuestionBase {
  type: "MULTIPLE_CHOICE";
  options: string[];
  correctAnswers: string[];
}

export interface TrueFalseQuestion extends QuestionBase {
  type: "TRUE_FALSE";
  correctAnswer: boolean;
}

export interface NumericalQuestion extends QuestionBase {
  type: "NUMERICAL";
  correctAnswer: number;
  tolerance?: number;
}

export interface ShortTextQuestion extends QuestionBase {
  type: "SHORT_TEXT";
  correctAnswers: string[];
  caseSensitive?: boolean;
}

export type Question =
  | SingleChoiceQuestion
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | NumericalQuestion
  | ShortTextQuestion;

// For display to student (without answer key)
export type QuestionDisplay = Omit<Question, "correctAnswer" | "correctAnswers">;

// ============================================================================
// Attempt State Management
// ============================================================================

export interface QuestionState {
  questionId: string;
  answer?: AnswerType;
  isAnswered: boolean;
  markedForReview: boolean;
  savedAt: number; // timestamp
}

export interface AttemptState {
  attemptId: string;
  assessmentId: string;
  studentId: string;
  startedAt: number;
  lastModified: number;
  questions: QuestionState[];
  currentQuestionIndex: number;
  submittedAt?: number;
  status: "ACTIVE" | "SUBMITTED" | "ABANDONED";
  serverEndTime: number; // authoritative server-provided end time
}

export interface AttemptProgress {
  totalQuestions: number;
  answeredCount: number;
  markedForReviewCount: number;
  timeRemainingSeconds: number;
  percentProgress: number;
}

// ============================================================================
// Answer Submission
// ============================================================================

export interface AnswerSubmission {
  attemptId: string;
  questionId: string;
  answer: AnswerType;
  timestamp: number;
  isSynced: boolean;
}

export interface AnswerSyncStatus {
  questionId: string;
  status: "SYNCED" | "SYNCING" | "FAILED" | "PENDING";
  lastSyncAt?: number;
  error?: string;
}

// ============================================================================
// Submission & Results
// ============================================================================

export interface SubmissionReview {
  attemptId: string;
  assessmentId: string;
  totalQuestions: number;
  answered: number;
  unanswered: number;
  markedForReview: number;
  timeRemaining: number;
  estimatedScore?: number;
}

export interface SubmissionConfirm {
  attemptId: string;
  cannotRevert: boolean;
  questionsReview: SubmissionReview;
}

export interface AssessmentResult {
  attemptId: string;
  assessmentId: string;
  assessmentName: string;
  studentId: string;
  score: number; // 0-100
  maxScore: number;
  percentageScore: number;
  submittedAt: number;
  processedAt?: number;
  status: "SUBMITTED" | "SCORED" | "VERIFIED";
  attemptNumber: number;
}

export interface AssessmentScore {
  date: string;
  score: number;
  percentageScore: number;
  attemptNumber: number;
  status: "SUBMITTED" | "SCORED" | "VERIFIED";
}

// ============================================================================
// Performance Analysis
// ============================================================================

export interface SkillPerformance {
  skillId: string;
  skillName: string;
  percentageScore: number;
  questionsAttempted: number;
  questionsCorrect: number;
}

export interface PerformanceBreakdown {
  overallScore: number;
  skillPerformance: SkillPerformance[];
  categoryBreakdown?: Array<{
    category: string;
    score: number;
    weight: number;
  }>;
}

export interface SkillImpact {
  skillId: string;
  skillName: string;
  previousScore?: number;
  currentScore: number;
  change: number;
  percentageChange: number;
  status: "IMPROVED" | "MAINTAINED" | "DECLINED";
  interventionRelated?: boolean;
  interventionName?: string;
}

export interface AssessmentHistory {
  assessmentId: string;
  assessmentName: string;
  attempts: AssessmentScore[];
  trend: {
    direction: "UP" | "DOWN" | "FLAT";
    magnitude: number;
  };
  skillImpacts: SkillImpact[];
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface GetAssessmentsRequest {
  includeHistory?: boolean;
  skillFilter?: string[];
  statusFilter?: AssessmentStatus[];
}

export interface GetAssessmentsResponse {
  assessments: AssessmentCard[];
  totalCount: number;
}

export interface StartAssessmentRequest {
  assessmentId: string;
  studentId: string;
}

export interface StartAssessmentResponse {
  attemptId: string;
  assessmentId: string;
  studentId: string;
  startedAt: number;
  serverEndTime: number; // authoritative deadline
  questions: QuestionDisplay[];
}

export interface GetAttemptRequest {
  attemptId: string;
}

export interface GetAttemptResponse {
  attempt: AttemptState;
  questions: QuestionDisplay[];
  progress: AttemptProgress;
}

export interface SaveAnswerRequest {
  attemptId: string;
  questionId: string;
  answer: AnswerType;
}

export interface SaveAnswerResponse {
  status: "SAVED" | "SYNCING";
  savedAt: number;
  error?: string;
}

export interface SubmitAssessmentRequest {
  attemptId: string;
  assessmentId: string;
}

export interface SubmitAssessmentResponse {
  attemptId: string;
  assessmentId: string;
  submittedAt: number;
  messageId?: string;
  pollEndpoint?: string;
}

export interface GetResultRequest {
  attemptId: string;
}

export interface GetResultResponse {
  result: AssessmentResult;
  performance: PerformanceBreakdown;
  skillImpacts: SkillImpact[];
  history: AssessmentHistory;
  verification: {
    submitted: boolean;
    scored: boolean;
    institutionVerified: boolean;
  };
  aiExplanation?: string;
}

// ============================================================================
// UI State Types
// ============================================================================

export interface AssessmentUIState {
  currentPhase:
    | "LIST"
    | "OVERVIEW"
    | "READINESS"
    | "COUNTDOWN"
    | "QUESTION"
    | "REVIEW"
    | "SUBMISSION"
    | "RESULT"
    | "ERROR";
  selectedAssessmentId?: string;
  attemptId?: string;
  currentQuestionIndex: number;
  isFullscreen: boolean;
  networkStatus: "ONLINE" | "OFFLINE" | "UNSTABLE";
  lastSyncTime?: number;
  unsyncedChanges: number;
}

export interface AssessmentNotification {
  id: string;
  type: "INFO" | "WARNING" | "ERROR" | "SUCCESS";
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible: boolean;
  duration?: number;
}

// ============================================================================
// Error Types
// ============================================================================

export class AssessmentError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = "AssessmentError";
  }
}

export const AssessmentErrorCodes = {
  ASSESSMENT_NOT_FOUND: "ASSESSMENT_NOT_FOUND",
  ATTEMPT_NOT_FOUND: "ATTEMPT_NOT_FOUND",
  ASSESSMENT_EXPIRED: "ASSESSMENT_EXPIRED",
  ASSESSMENT_LOCKED: "ASSESSMENT_LOCKED",
  ATTEMPT_ALREADY_SUBMITTED: "ATTEMPT_ALREADY_SUBMITTED",
  SINGLE_ATTEMPT_EXHAUSTED: "SINGLE_ATTEMPT_EXHAUSTED",
  UNAUTHORIZED: "UNAUTHORIZED",
  TIMER_EXPIRED: "TIMER_EXPIRED",
  NETWORK_ERROR: "NETWORK_ERROR",
  SYNC_FAILED: "SYNC_FAILED",
  INVALID_ANSWER: "INVALID_ANSWER",
  SUBMISSION_FAILED: "SUBMISSION_FAILED",
};
