/**
 * Validation Service & Business Rules Engine
 * Complex validation logic for internships, subjects, and business constraints
 */

import { z } from "zod";
import { getDb } from "../db";
import { internships, studentProfiles, subjectEnrollments, subjects } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

const getDatabase = async () => {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return db;
};

// ============================================================================
// VALIDATION RESULT TYPES
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  suggestion?: string;
}

export interface ValidationResult<T> {
  valid: boolean;
  data?: T;
  errors: ValidationError[];
  warnings: ValidationError[];
  timestamp: Date;
}

// ============================================================================
// INTERNSHIP VALIDATION
// ============================================================================

/**
 * Zod schema for internship creation
 */
export const InternshipCreateSchema = z.object({
  studentId: z.string().uuid("Invalid student ID"),
  companyName: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(200, "Company name must be less than 200 characters"),
  role: z
    .string()
    .min(2, "Role must be at least 2 characters")
    .max(100, "Role must be less than 100 characters"),
  startDate: z.string().date("Start date must be a valid date"),
  endDate: z.string().date("End date must be a valid date").optional(),
  stipend: z
    .number()
    .positive("Stipend must be a positive number")
    .optional(),
  supervisorName: z.string().max(200).optional(),
  supervisorEmail: z.string().email("Invalid supervisor email").optional(),
});

export type InternshipCreate = z.infer<typeof InternshipCreateSchema>;

/**
 * Validate internship creation with business rules
 */
export async function validateInternshipCreation(
  data: Partial<InternshipCreate>
): Promise<ValidationResult<InternshipCreate>> {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Schema validation
  try {
    const validated = InternshipCreateSchema.parse(data);

    // Business rule 1: End date must be after start date
    if (validated.endDate) {
      const startDate = new Date(validated.startDate);
      const endDate = new Date(validated.endDate);

      if (endDate <= startDate) {
        errors.push({
          field: "endDate",
          message: "End date must be after start date",
          code: "END_DATE_BEFORE_START",
          suggestion: `Set end date to after ${startDate.toDateString()}`,
        });
      }

      // Business rule 2: Internship duration shouldn't exceed 1 year
      const durationDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      if (durationDays > 365) {
        warnings.push({
          field: "endDate",
          message: "Internship duration exceeds typical 1-year period",
          code: "DURATION_EXCESSIVE",
          suggestion: "Consider verifying the end date",
        });
      }

      // Business rule 3: Internship duration minimum 2 weeks
      if (durationDays < 14 && durationDays > 0) {
        warnings.push({
          field: "endDate",
          message: "Internship duration is less than 2 weeks",
          code: "DURATION_TOO_SHORT",
          suggestion: "Internships are typically at least 2 weeks",
        });
      }
    }

    // Business rule 4: Verify student exists
    const db = await getDatabase();
    const student = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.id, validated.studentId))
      .limit(1)
      .then((res) => res[0]);

    if (!student) {
      errors.push({
        field: "studentId",
        message: "Student not found",
        code: "STUDENT_NOT_FOUND",
        suggestion: "Verify the student ID is correct",
      });
    }

    // Business rule 5: Stipend validation
    if (validated.stipend) {
      if (validated.stipend < 0) {
        errors.push({
          field: "stipend",
          message: "Stipend cannot be negative",
          code: "INVALID_STIPEND",
        });
      }

      if (validated.stipend > 10000000) {
        warnings.push({
          field: "stipend",
          message: "Stipend exceeds typical range (>10M)",
          code: "UNUSUALLY_HIGH_STIPEND",
          suggestion: "Verify the stipend amount is correct",
        });
      }
    }

    if (errors.length > 0) {
      return {
        valid: false,
        errors,
        warnings,
        timestamp: new Date(),
      };
    }

    return {
      valid: true,
      data: validated,
      errors,
      warnings,
      timestamp: new Date(),
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        errors.push({
          field: err.path.join("."),
          message: err.message,
          code: `SCHEMA_${err.code}`,
        });
      });
    }

    return {
      valid: false,
      errors,
      warnings,
      timestamp: new Date(),
    };
  }
}

// ============================================================================
// SUBJECT ENROLLMENT VALIDATION
// ============================================================================

/**
 * Validate student enrollment in subject
 */
export async function validateSubjectEnrollment(data: {
  studentId: string;
  subjectId: string;
  semester: number;
  academicYear: string;
}): Promise<ValidationResult<any>> {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const db = await getDatabase();

  // Validate data types
  if (!data.studentId || !data.subjectId) {
    errors.push({
      field: "studentId",
      message: "Student and subject IDs are required",
      code: "MISSING_REQUIRED_FIELDS",
    });
  }

  if (data.semester < 1 || data.semester > 8) {
    errors.push({
      field: "semester",
      message: "Semester must be between 1 and 8",
      code: "INVALID_SEMESTER",
    });
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
      warnings,
      timestamp: new Date(),
    };
  }

  // Business rule 1: Can't enroll same student twice in same semester
  const existingEnrollment = await db
    .select()
    .from(subjectEnrollments)
    .where(
      and(
        eq(subjectEnrollments.studentId, data.studentId),
        eq(subjectEnrollments.subjectId, data.subjectId),
        eq(subjectEnrollments.semester, data.semester)
      )
    )
    .limit(1)
    .then((res) => res[0]);

  if (existingEnrollment) {
    errors.push({
      field: "subjectId",
      message: "Student is already enrolled in this subject for this semester",
      code: "DUPLICATE_ENROLLMENT",
      suggestion: "Check if the student has already enrolled",
    });
  }

  // Business rule 2: Verify subject and student exist
  const [subject, student] = await Promise.all([
    db
      .select()
      .from(subjects)
      .where(eq(subjects.id, data.subjectId))
      .limit(1)
      .then((res) => res[0]),
    db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.id, data.studentId))
      .limit(1)
      .then((res) => res[0]),
  ]);

  if (!subject) {
    errors.push({
      field: "subjectId",
      message: "Subject not found",
      code: "SUBJECT_NOT_FOUND",
    });
  }

  if (!student) {
    errors.push({
      field: "studentId",
      message: "Student not found",
      code: "STUDENT_NOT_FOUND",
    });
  }

  // Business rule 3: Subject semester should match enrollment semester
  if (subject && subject.semester !== data.semester) {
    warnings.push({
      field: "semester",
      message: `Subject is offered in semester ${subject.semester}, not ${data.semester}`,
      code: "SEMESTER_MISMATCH",
      suggestion: `Enroll in semester ${subject.semester}`,
    });
  }

  return {
    valid: errors.length === 0,
    data: errors.length === 0 ? data : undefined,
    errors,
    warnings,
    timestamp: new Date(),
  };
}

// ============================================================================
// GRADE VALIDATION
// ============================================================================

/**
 * Validate grade submission
 */
export async function validateGradeSubmission(data: {
  marks: number;
  maxMarks: number;
  minMarks?: number;
}): Promise<ValidationResult<any>> {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Business rule 1: Marks must be <= maxMarks
  if (data.marks > data.maxMarks) {
    errors.push({
      field: "marks",
      message: `Marks (${data.marks}) cannot exceed maximum marks (${data.maxMarks})`,
      code: "MARKS_EXCEED_MAXIMUM",
    });
  }

  // Business rule 2: Marks must be >= minMarks (if specified)
  if (data.minMarks !== undefined && data.marks < data.minMarks) {
    errors.push({
      field: "marks",
      message: `Marks (${data.marks}) cannot be below minimum marks (${data.minMarks})`,
      code: "MARKS_BELOW_MINIMUM",
    });
  }

  // Business rule 3: Marks must be non-negative
  if (data.marks < 0) {
    errors.push({
      field: "marks",
      message: "Marks cannot be negative",
      code: "NEGATIVE_MARKS",
    });
  }

  return {
    valid: errors.length === 0,
    data: errors.length === 0 ? data : undefined,
    errors,
    warnings,
    timestamp: new Date(),
  };
}

// ============================================================================
// ATTENDANCE VALIDATION
// ============================================================================

/**
 * Validate attendance record
 */
export async function validateAttendanceRecord(data: {
  totalClasses: number;
  presentClasses: number;
  absentClasses: number;
  lateClasses?: number;
}): Promise<ValidationResult<any>> {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Business rule 1: Present + Absent + Late = Total
  const lateClasses = data.lateClasses || 0;
  const total = data.presentClasses + data.absentClasses + lateClasses;

  if (total !== data.totalClasses) {
    errors.push({
      field: "totalClasses",
      message: `Sum of attendance (${total}) doesn't match total classes (${data.totalClasses})`,
      code: "ATTENDANCE_SUM_MISMATCH",
    });
  }

  // Business rule 2: Attendance can't exceed 100%
  const attendancePercent = (data.presentClasses / data.totalClasses) * 100;
  if (attendancePercent > 100) {
    errors.push({
      field: "presentClasses",
      message: "Attendance cannot exceed 100%",
      code: "ATTENDANCE_EXCEEDS_100",
    });
  }

  // Business rule 3: Warn if attendance < 75% (typically required minimum)
  if (attendancePercent < 75 && attendancePercent > 0) {
    warnings.push({
      field: "presentClasses",
      message: `Attendance (${attendancePercent.toFixed(1)}%) is below typical 75% threshold`,
      code: "LOW_ATTENDANCE",
      suggestion: "Student may be marked at-risk",
    });
  }

  return {
    valid: errors.length === 0,
    data: errors.length === 0 ? data : undefined,
    errors,
    warnings,
    timestamp: new Date(),
  };
}

// ============================================================================
// BUSINESS RULES ENGINE
// ============================================================================

export interface BusinessRule {
  id: string;
  name: string;
  condition: (context: any) => boolean;
  action: (context: any) => Promise<void>;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

/**
 * Rule: Cannot drop subject if grade < 50
 */
export const CannotDropLowGradeSubjectRule: BusinessRule = {
  id: "drop_low_grade_prevention",
  name: "Cannot drop subject with low grade",
  condition: (context) => context.grade && context.grade < 50 && context.action === "DROP_SUBJECT",
  action: async (context) => {
    throw new Error(
      `Cannot drop subject with grade ${context.grade}. Minimum passing grade is 50.`
    );
  },
  priority: "HIGH",
};

/**
 * Rule: Cannot enroll if max credits exceeded
 */
export const MaxCreditsEnforcementRule: BusinessRule = {
  id: "max_credits_enforcement",
  name: "Enforce maximum credits per semester",
  condition: (context) => context.currentCredits + context.newCredits > 24, // Max 24 credits
  action: async (context) => {
    throw new Error(
      `Adding ${context.newCredits} credits exceeds maximum. Current: ${context.currentCredits}, Max allowed: 24`
    );
  },
  priority: "HIGH",
};

/**
 * Rule: Prerequisite check for advanced courses
 */
export const PrerequisiteCheckRule: BusinessRule = {
  id: "prerequisite_validation",
  name: "Validate course prerequisites",
  condition: (context) => context.isAdvancedCourse && !context.completedPrerequisites,
  action: async (context) => {
    throw new Error(
      "Cannot enroll in advanced course. Required prerequisites not completed."
    );
  },
  priority: "CRITICAL",
};

/**
 * Rule: At-risk student notification
 */
export const AtRiskStudentNotificationRule: BusinessRule = {
  id: "at_risk_notification",
  name: "Notify at-risk students",
  condition: (context) => context.attendance < 75 || context.avgGrade < 60,
  action: async (context) => {
    console.log(`⚠️ At-risk alert: Student ${context.studentId}`);
    // TODO: Send notification via notificationService
  },
  priority: "MEDIUM",
};

/**
 * Rule: Verify internship details match expectations
 */
export const InternshipVerificationRule: BusinessRule = {
  id: "internship_verification",
  name: "Validate internship requirements",
  condition: (context) => {
    const startDate = new Date(context.startDate);
    const endDate = new Date(context.endDate);
    const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

    return duration < 30; // Minimum 30 days
  },
  action: async (context) => {
    throw new Error(
      "Internship must be at least 30 days long. Please verify the dates."
    );
  },
  priority: "CRITICAL",
};

/**
 * Execute business rules engine
 */
export async function executeBusinessRules(
  rules: BusinessRule[],
  context: any
): Promise<{
  violations: string[];
  executedRules: string[];
  warnings: string[];
}> {
  const violations: string[] = [];
  const executedRules: string[] = [];
  const warnings: string[] = [];

  // Sort by priority
  const priorityOrder: Record<string, number> = {
    CRITICAL: 1,
    HIGH: 2,
    MEDIUM: 3,
    LOW: 4,
  };

  const sortedRules = [...rules].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  for (const rule of sortedRules) {
    try {
      if (rule.condition(context)) {
        executedRules.push(rule.id);

        if (rule.priority === "CRITICAL" || rule.priority === "HIGH") {
          try {
            await rule.action(context);
          } catch (error) {
            violations.push(
              error instanceof Error ? error.message : `Rule violation: ${rule.name}`
            );
          }
        } else {
          warnings.push(`Rule check: ${rule.name}`);
        }
      }
    } catch (error) {
      // Handle unexpected rule execution errors
      console.error(`Error executing rule ${rule.id}:`, error);
    }
  }

  return {
    violations,
    executedRules,
    warnings,
  };
}

// ============================================================================
// COMBINED VALIDATION PIPELINE
// ============================================================================

/**
 * Validate data and apply business rules
 */
export async function validateWithRules(data: {
  type: "INTERNSHIP" | "ENROLLMENT" | "GRADE" | "ATTENDANCE";
  payload: any;
  rules?: BusinessRule[];
}): Promise<{
  valid: boolean;
  validationResult: ValidationResult<any>;
  ruleResult: { violations: string[]; executedRules: string[]; warnings: string[] };
  errors: ValidationError[];
}> {
  let validationResult: ValidationResult<any>;

  // Run specific validation
  switch (data.type) {
    case "INTERNSHIP":
      validationResult = await validateInternshipCreation(data.payload);
      break;
    case "ENROLLMENT":
      validationResult = await validateSubjectEnrollment(data.payload);
      break;
    case "GRADE":
      validationResult = await validateGradeSubmission(data.payload);
      break;
    case "ATTENDANCE":
      validationResult = await validateAttendanceRecord(data.payload);
      break;
    default:
      validationResult = {
        valid: false,
        errors: [{ field: "type", message: "Unknown validation type", code: "UNKNOWN_TYPE" }],
        warnings: [],
        timestamp: new Date(),
      };
  }

  // Execute business rules if validation passed
  let ruleResult: { violations: string[]; executedRules: string[]; warnings: string[] } = {
    violations: [],
    executedRules: [],
    warnings: [],
  };
  if (validationResult.valid && data.rules && data.rules.length > 0) {
    ruleResult = await executeBusinessRules(data.rules, data.payload);
  }

  return {
    valid: validationResult.valid && ruleResult.violations.length === 0,
    validationResult,
    ruleResult,
    errors: [
      ...validationResult.errors,
      ...ruleResult.violations.map((v) => ({
        field: "business_rule",
        message: v,
        code: "RULE_VIOLATION",
      })),
    ],
  };
}
