/**
 * Deterministic Placement Eligibility Engine
 * Pure functional AST evaluator for multi-variable corporate recruitment criteria
 */

export interface RuleCondition {
  field: "cgpa" | "active_backlogs" | "internship_status" | `skill.${string}`;
  operator: ">=" | "<=" | "=" | ">" | "<" | "!=";
  value: number | string;
}

export interface RuleAST {
  operator: "AND" | "OR";
  conditions: (RuleCondition | RuleAST)[];
}

export interface StudentCandidateSnapshot {
  id: string;
  name: string;
  cgpa: number;
  activeBacklogs: number;
  skills: Record<string, number>; // e.g. { "DSA": 78, "Python": 84 }
  internshipStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
}

export interface ConditionEvaluationResult {
  passed: boolean;
  pass: boolean;
  reason: string;
  field: string;
  label: string;
  actual: number | string;
  actualValue: number | string;
  expected: number | string;
  expectedValue: number | string;
  operator: string;
}

export interface EligibilityResult {
  studentId: string;
  driveId: string;
  eligible: boolean;
  reasons: string[];
  criteriaResults: ConditionEvaluationResult[];
}

/**
 * Standard ABC Technologies Benchmark Rule AST
 */
export const BENCHMARK_ABC_RULE: RuleAST = {
  operator: "AND",
  conditions: [
    { field: "cgpa", operator: ">=", value: 7.5 },
    { field: "active_backlogs", operator: "=", value: 0 },
    { field: "skill.DSA", operator: ">=", value: 70 },
    { field: "skill.Python", operator: ">=", value: 65 },
    { field: "internship_status", operator: "=", value: "COMPLETED" },
  ],
};

export function evaluateOperator(
  actual: number | string,
  operator: string,
  expected: number | string
): boolean {
  const op = operator === "==" ? "=" : operator;
  switch (op) {
    case ">=":
      return Number(actual) >= Number(expected);
    case "<=":
      return Number(actual) <= Number(expected);
    case "=":
      return String(actual).toUpperCase() === String(expected).toUpperCase();
    case ">":
      return Number(actual) > Number(expected);
    case "<":
      return Number(actual) < Number(expected);
    case "!=":
      return String(actual).toUpperCase() !== String(expected).toUpperCase();
    default:
      return false;
  }
}

/**
 * Evaluates an individual leaf condition against a student candidate snapshot or direct operator evaluation.
 */
export function evaluateCondition(
  actual: number | string,
  operator: string,
  expected: number | string
): boolean;
export function evaluateCondition(
  condition: RuleCondition,
  student: StudentCandidateSnapshot
): ConditionEvaluationResult;
export function evaluateCondition(
  first: RuleCondition | number | string,
  second: StudentCandidateSnapshot | string,
  third?: number | string
): ConditionEvaluationResult | boolean {
  if (typeof second === "string" && third !== undefined) {
    return evaluateOperator(first as number | string, second, third);
  }

  const condition = first as RuleCondition;
  const student = second as StudentCandidateSnapshot;

  let actualValue: number | string | undefined;
  const fieldKey = String(condition.field).toLowerCase();

  if (fieldKey === "cgpa") {
    actualValue = student.cgpa;
  } else if (fieldKey === "active_backlogs") {
    actualValue = student.activeBacklogs;
  } else if (fieldKey === "internship_status" || fieldKey === "internship.status") {
    actualValue = student.internshipStatus;
  } else if (fieldKey.startsWith("skill.")) {
    const skillName = condition.field.replace(/^skill\./i, "");
    // Case-insensitive lookup in skills map
    const matchedKey = Object.keys(student.skills).find(
      (k) => k.toLowerCase() === skillName.toLowerCase()
    );
    actualValue = matchedKey ? student.skills[matchedKey] : 0;
  }

  if (actualValue === undefined) {
    return {
      passed: false,
      pass: false,
      reason: `[FAIL] Missing profile metric for required field: ${condition.field} [FAIL]`,
      field: condition.field,
      label: condition.field,
      actual: "Missing",
      actualValue: "Missing",
      expected: condition.value,
      expectedValue: condition.value,
      operator: condition.operator,
    };
  }

  const op = condition.operator === ("==" as any) ? "=" : condition.operator;
  const passed = evaluateOperator(actualValue, op, condition.value);

  let label: string = condition.field;
  if (fieldKey === "cgpa") label = "CGPA";
  else if (fieldKey === "active_backlogs") label = "Active backlogs";
  else if (fieldKey === "internship_status" || fieldKey === "internship.status") label = "Internship status";
  else if (fieldKey.startsWith("skill.")) label = condition.field.replace(/^skill\./i, "");

  const statusTag = `[${passed ? "PASS" : "FAIL"}]`;
  const reason = `${statusTag} ${label}: Actual ${actualValue} ${op} Required ${condition.value} ${statusTag}`;

  return {
    passed,
    pass: passed,
    reason,
    field: condition.field,
    label,
    actual: actualValue,
    actualValue,
    expected: condition.value,
    expectedValue: condition.value,
    operator: op,
  };
}

/**
 * Pure functional recursive AST tree walker evaluating student eligibility.
 * Supports both:
 *   evaluateStudentEligibility(rule, student)
 *   evaluateStudentEligibility(driveId, rule, student)
 */
export function evaluateStudentEligibility(
  rule: RuleAST,
  student: StudentCandidateSnapshot,
  driveId?: string
): EligibilityResult;
export function evaluateStudentEligibility(
  driveId: string,
  rule: RuleAST,
  student: StudentCandidateSnapshot
): EligibilityResult;
export function evaluateStudentEligibility(
  first: string | RuleAST,
  second: RuleAST | StudentCandidateSnapshot,
  third?: StudentCandidateSnapshot | string
): EligibilityResult {
  let driveId = "drive-direct";
  let rule: RuleAST;
  let student: StudentCandidateSnapshot;

  if (typeof first === "string") {
    driveId = first;
    rule = second as RuleAST;
    student = third as StudentCandidateSnapshot;
  } else {
    rule = first as RuleAST;
    student = second as StudentCandidateSnapshot;
    if (typeof third === "string") {
      driveId = third;
    }
  }

  const reasons: string[] = [];
  const criteriaResults: ConditionEvaluationResult[] = [];

  function evaluateSubtree(node: any): boolean {
    const rawOp = String(node.operator || node.type || "AND").toUpperCase();
    const isAnd = rawOp === "AND";
    const conditions = Array.isArray(node.conditions) ? node.conditions : [];
    let subPassed = isAnd;

    for (const item of conditions) {
      if ("conditions" in item || ("operator" in item && Array.isArray((item as any).conditions))) {
        // Recursive sub-AST
        const nestedResult = evaluateSubtree(item);
        if (isAnd && !nestedResult) subPassed = false;
        if (!isAnd && nestedResult) subPassed = true;
      } else {
        // Leaf condition
        const condResult = evaluateCondition(item as RuleCondition, student);
        reasons.push(condResult.reason);
        criteriaResults.push(condResult);

        if (isAnd && !condResult.passed) subPassed = false;
        if (!isAnd && condResult.passed) subPassed = true;
      }
    }

    return subPassed;
  }

  const overallPassed = evaluateSubtree(rule);

  return {
    studentId: student.id,
    driveId,
    eligible: overallPassed,
    reasons,
    criteriaResults,
  };
}
