# Phase 08 Specification: Placement Rules & Deterministic Eligibility Engine

## 1. Metadata
- **Phase**: 08
- **Title**: AST Placement Rule Builder & Transparent Deterministic Eligibility Engine
- **Status**: Completed
- **Dependencies**: Phase 01, Phase 03, Phase 07
- **Target Files**:
  - `backend/src/rules/eligibilityEngine.ts`
  - `backend/src/services/tnpService.ts`
  - `backend/src/routers/placement.ts`
  - `frontend/client/src/components/EligibilityCheckerModal.tsx`
  - `frontend/client/src/pages/TnpDrives.tsx`

---

## 2. Objective & Scope
Build the deterministic placement eligibility engine that evaluates student readiness against multi-variable corporate criteria. Provide Training & Placement (T&P) Coordinators with a structured rule builder, and give students complete algorithmic transparency into why they qualified or why they were disqualified (e.g., *"DSA score 62 is below required 70"*).

---

## 3. Placement Rule AST Model

Recruitment criteria are defined as an Abstract Syntax Tree (AST) stored as JSON in `placement_rules.rule_definition`:

```typescript
export interface RuleCondition {
  field: "cgpa" | "active_backlogs" | "internship_status" | `skill.${string}`;
  operator: ">=" | "<=" | "=" | ">" | "<" | "!=";
  value: number | string;
}

export interface RuleAST {
  operator: "AND" | "OR";
  conditions: (RuleCondition | RuleAST)[];
}
```

### 3.1 Standard Benchmark Rule (ABC Technologies Drive)
```json
{
  "operator": "AND",
  "conditions": [
    { "field": "cgpa", "operator": ">=", "value": 7.5 },
    { "field": "active_backlogs", "operator": "=", "value": 0 },
    { "field": "skill.DSA", "operator": ">=", "value": 70 },
    { "field": "skill.Python", "operator": ">=", "value": 65 },
    { "field": "internship_status", "operator": "=", "value": "COMPLETED" }
  ]
}
```

---

## 4. Deterministic Evaluation Algorithm (`server/rules/eligibilityEngine.ts`)

The evaluation engine is a **pure function** that evaluates a student snapshot against the AST:

```typescript
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
  reason: string;
}

export interface EligibilityResult {
  studentId: string;
  driveId: string;
  eligible: boolean;
  reasons: string[];
}

export function evaluateCondition(condition: RuleCondition, student: StudentCandidateSnapshot): ConditionEvaluationResult {
  let actualValue: number | string | undefined;

  if (condition.field === "cgpa") actualValue = student.cgpa;
  else if (condition.field === "active_backlogs") actualValue = student.activeBacklogs;
  else if (condition.field === "internship_status") actualValue = student.internshipStatus;
  else if (condition.field.startsWith("skill.")) {
    const skillName = condition.field.replace("skill.", "");
    actualValue = student.skills[skillName] ?? 0;
  }

  if (actualValue === undefined) {
    return { passed: false, reason: `Missing data for required field: ${condition.field} [FAIL]` };
  }

  let passed = false;
  switch (condition.operator) {
    case ">=": passed = Number(actualValue) >= Number(condition.value); break;
    case "<=": passed = Number(actualValue) <= Number(condition.value); break;
    case "=":  passed = String(actualValue) === String(condition.value); break;
    case ">":  passed = Number(actualValue) > Number(condition.value); break;
    case "<":  passed = Number(actualValue) < Number(condition.value); break;
    case "!=": passed = String(actualValue) !== String(condition.value); break;
  }

  const label = condition.field.startsWith("skill.") ? condition.field.replace("skill.", "") + " Score" : condition.field.toUpperCase();
  return {
    passed,
    reason: `${label}: Actual ${actualValue} ${condition.operator} Required ${condition.value} [${passed ? "PASS" : "FAIL"}]`,
  };
}

export function evaluateStudentEligibility(driveId: string, rule: RuleAST, student: StudentCandidateSnapshot): EligibilityResult {
  const reasons: string[] = [];
  let overallPassed = rule.operator === "AND";

  for (const item of rule.conditions) {
    if ("field" in item) {
      const res = evaluateCondition(item, student);
      reasons.push(res.reason);
      if (rule.operator === "AND" && !res.passed) overallPassed = false;
      if (rule.operator === "OR" && res.passed) overallPassed = true;
    }
  }

  return {
    studentId: student.id,
    driveId,
    eligible: overallPassed,
    reasons,
  };
}
```

---

## 5. tRPC Router Contracts (`backend/src/routers/placement.ts`)

```typescript
import { router, studentProcedure, tnpProcedure } from "../_core/trpc";
import { z } from "zod";
import * as tnpService from "../services/tnpService";

export const placementRouter = router({
  checkMyEligibility: studentProcedure
    .input(z.object({ driveId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      return tnpService.checkStudentEligibility(ctx.user.studentProfile.id, input.driveId);
    }),

  evaluateRoster: tnpProcedure
    .input(z.object({ driveId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      // Runs bulk evaluation for all eligible department candidates
      return tnpService.evaluateAllCandidatesForDrive(input.driveId);
    }),
});
```

---

## 6. UI Components

### 6.1 Student Transparent Modal (`EligibilityCheckerModal.tsx`)
Rendered when a student clicks *"Check My Eligibility"* on an opportunity card:
- **Eligible Banner**: Emerald banner if `eligible === true`; Rose banner if `eligible === false`.
- **Itemized Criteria Checklist**:
  - `[✓ PASS]` CGPA: Actual 8.42 $\ge$ Required 7.50
  - `[✓ PASS]` Active Backlogs: Actual 0 $=$ Required 0
  - `[✓ PASS]` DSA Score: Actual 78 $\ge$ Required 70
  - `[✓ PASS]` Python Score: Actual 84 $\ge$ Required 65
  - `[✓ PASS]` Internship: Actual COMPLETED $=$ Required COMPLETED
- **Student with Deficiencies** (e.g. Peer Priya):
  - `[✕ FAIL]` DSA Score: Actual 62 $<$ Required 70
- **Action**: *"Proceed to Apply"* button enabled **only** if `eligible === true`.

### 6.2 T&P Drive Rule Builder (`TnpDrives.tsx`)
- Drag-and-drop or select-based condition builder for CGPA threshold, Max Backlogs, Minimum Skill Scores, and Internship Completion requirement.
- One-click *"Run Roster Evaluation"* button showing count of qualified vs disqualified students.

---

## 7. Verification & Acceptance Tests
1. Deterministic Calculation Test:
   - Rahul Sharma (CGPA 8.42, Backlogs 0, DSA 78, Python 84, Internship COMPLETED) $\rightarrow$ Evaluates to `eligible: true`.
   - Peer Student (CGPA 8.0, Backlogs 0, DSA 62, Python 80, Internship COMPLETED) $\rightarrow$ Evaluates to `eligible: false` with reason *"DSA Score: Actual 62 >= Required 70 [FAIL]"*.
2. Zero Mock Verification:
   - Ensure the evaluation retrieves live records from Supabase tables (`academic_records`, `backlogs`, `skill_history`, `internships`).

---

## 8. Definition of Done
- [x] Rule AST parser and pure evaluator function implemented and tested.
- [x] Evaluated results and reasons persisted to `eligibility_evaluations`.
- [x] `EligibilityCheckerModal.tsx` renders clear, color-coded itemized reasons.
- [x] T&P roster evaluation endpoint functions in bulk.
