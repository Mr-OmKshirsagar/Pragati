import { describe, expect, it } from "vitest";
import {
  evaluateCondition,
  evaluateOperator,
  evaluateStudentEligibility,
  RuleAST,
  StudentCandidateSnapshot,
} from "../src/rules/eligibilityEngine";

describe("Deterministic Eligibility Engine (Phase 11)", () => {
  const sampleRule: RuleAST = {
    operator: "AND",
    conditions: [
      { field: "cgpa", operator: ">=", value: 7.5 },
      { field: "active_backlogs", operator: "=", value: 0 },
      { field: "skill.DSA", operator: ">=", value: 70 },
      { field: "internship_status", operator: "=", value: "COMPLETED" },
    ],
  };

  it("should qualify a student meeting all criteria (Rahul Sharma)", () => {
    const candidate: StudentCandidateSnapshot = {
      id: "rahul-uuid",
      name: "Rahul Sharma",
      cgpa: 8.42,
      activeBacklogs: 0,
      skills: { DSA: 78, Python: 84 },
      internshipStatus: "COMPLETED",
    };

    const result = evaluateStudentEligibility("drive-1", sampleRule, candidate);
    expect(result.eligible).toBe(true);
    expect(result.reasons.length).toBe(4);
    expect(result.reasons.every((r) => r.includes("[PASS]"))).toBe(true);
    expect(result.criteriaResults.every((c) => c.passed)).toBe(true);
  });

  it("should disqualify a student with a deficiency and give clear reasons (Priya Patel - DSA deficient)", () => {
    const candidate: StudentCandidateSnapshot = {
      id: "peer-uuid",
      name: "Priya Patel",
      cgpa: 8.1,
      activeBacklogs: 0,
      skills: { DSA: 62, Python: 80 },
      internshipStatus: "COMPLETED",
    };

    const result = evaluateStudentEligibility("drive-1", sampleRule, candidate);
    expect(result.eligible).toBe(false);
    expect(result.reasons.some((r) => r.includes("DSA") && r.includes("[FAIL]"))).toBe(true);
    expect(result.reasons.some((r) => r.includes("Actual 62"))).toBe(true);
  });

  it("should disqualify a student with an active backlog", () => {
    const candidate: StudentCandidateSnapshot = {
      id: "backlog-uuid",
      name: "Vikram Mehta",
      cgpa: 8.0,
      activeBacklogs: 1,
      skills: { DSA: 75, Python: 75 },
      internshipStatus: "COMPLETED",
    };

    const result = evaluateStudentEligibility("drive-1", sampleRule, candidate);
    expect(result.eligible).toBe(false);
    expect(result.reasons.some((r) => r.includes("Active backlogs") && r.includes("[FAIL]"))).toBe(true);
  });

  it("should disqualify a student with uncompleted internship", () => {
    const candidate: StudentCandidateSnapshot = {
      id: "internship-uuid",
      name: "Sneha Rao",
      cgpa: 8.5,
      activeBacklogs: 0,
      skills: { DSA: 85, Python: 90 },
      internshipStatus: "IN_PROGRESS",
    };

    const result = evaluateStudentEligibility("drive-1", sampleRule, candidate);
    expect(result.eligible).toBe(false);
    expect(result.reasons.some((r) => r.includes("Internship status") && r.includes("[FAIL]"))).toBe(true);
  });

  it("should qualify borderline candidate meeting exact threshold values", () => {
    const candidate: StudentCandidateSnapshot = {
      id: "borderline-uuid",
      name: "Amit Kumar",
      cgpa: 7.5,
      activeBacklogs: 0,
      skills: { DSA: 70 },
      internshipStatus: "COMPLETED",
    };

    const result = evaluateStudentEligibility("drive-1", sampleRule, candidate);
    expect(result.eligible).toBe(true);
    expect(result.criteriaResults.every((c) => c.passed)).toBe(true);
  });

  it("should handle nested OR conditions correctly", () => {
    const languageRule: RuleAST = {
      operator: "AND",
      conditions: [
        { field: "cgpa", operator: ">=", value: 7.0 },
        {
          operator: "OR",
          conditions: [
            { field: "skill.Python", operator: ">=", value: 80 },
            { field: "skill.Java", operator: ">=", value: 80 },
          ],
        },
      ],
    };

    // Candidate has Python >= 80 but not Java
    const pythonDev: StudentCandidateSnapshot = {
      id: "py-dev",
      name: "Dev 1",
      cgpa: 7.8,
      activeBacklogs: 0,
      skills: { Python: 85, Java: 50 },
      internshipStatus: "COMPLETED",
    };
    expect(evaluateStudentEligibility("drive-2", languageRule, pythonDev).eligible).toBe(true);

    // Candidate has Java >= 80 but not Python
    const javaDev: StudentCandidateSnapshot = {
      id: "java-dev",
      name: "Dev 2",
      cgpa: 7.8,
      activeBacklogs: 0,
      skills: { Python: 40, Java: 82 },
      internshipStatus: "COMPLETED",
    };
    expect(evaluateStudentEligibility("drive-2", languageRule, javaDev).eligible).toBe(true);

    // Candidate has neither
    const noLangDev: StudentCandidateSnapshot = {
      id: "no-lang",
      name: "Dev 3",
      cgpa: 7.8,
      activeBacklogs: 0,
      skills: { Python: 60, Java: 60 },
      internshipStatus: "COMPLETED",
    };
    expect(evaluateStudentEligibility("drive-2", languageRule, noLangDev).eligible).toBe(false);
  });

  it("should gracefully handle missing skill metrics with a FAIL reason", () => {
    const candidate: StudentCandidateSnapshot = {
      id: "missing-skill-uuid",
      name: "Rohan V",
      cgpa: 8.0,
      activeBacklogs: 0,
      skills: {}, // No skills recorded
      internshipStatus: "COMPLETED",
    };

    const result = evaluateStudentEligibility("drive-1", sampleRule, candidate);
    expect(result.eligible).toBe(false);
    expect(result.reasons.some((r) => r.includes("DSA") && r.includes("[FAIL]"))).toBe(true);
  });

  it("should evaluate individual operators correctly", () => {
    expect(evaluateOperator(10, ">=", 10)).toBe(true);
    expect(evaluateOperator(9, ">=", 10)).toBe(false);
    expect(evaluateOperator("COMPLETED", "=", "completed")).toBe(true);
    expect(evaluateOperator("IN_PROGRESS", "!=", "COMPLETED")).toBe(true);
    expect(evaluateOperator(5, "<", 10)).toBe(true);
  });
});
