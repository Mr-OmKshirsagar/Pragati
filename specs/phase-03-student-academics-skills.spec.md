# Phase 03 Specification: Student Profiles, Academics & Skills Engine

## 1. Metadata
- **Phase**: 03
- **Title**: Student Profile, Academic Records & Continuous Assessment Engine
- **Status**: Ready for Implementation
- **Dependencies**: Phase 01, Phase 02
- **Target Files**:
  - `frontend/server/services/studentService.ts`
  - `frontend/server/services/academicService.ts`
  - `frontend/server/services/skillService.ts`
  - `frontend/server/routers/student.ts`
  - `frontend/client/src/pages/Progress.tsx`
  - `frontend/client/src/pages/Skills.tsx`

---

## 2. Objective & Scope
Implement the core student data services and API routes for fetching student profile info, querying academic semester records (SGPA/CGPA) and subject results, maintaining backlogs, browsing the skills taxonomy, and executing skill assessments with immutable score recording in `skill_history`.

---

## 3. Business Logic & Invariants

### 3.1 Academic Record Immutability
- Ordinary students can **never** modify official grades, SGPA, or CGPA.
- CGPA calculation:
  $$\text{CGPA} = \frac{\sum (\text{SGPA}_i \times \text{Credits}_i)}{\sum \text{Credits}_i}$$
- Backlog state transitions: `ACTIVE` $\rightarrow$ `CLEARED` (upon passing grade recorded in subsequent semester).

### 3.2 Continuous Assessment Submission & Skill History
When a student completes an assessment:
1. Validate that the assessment is in `PUBLISHED` status.
2. Calculate score: $\text{Score} = \sum \text{QuestionPoints}_{\text{correct}}$.
3. Insert immutable attempt record into `assessment_submissions`.
4. For each skill associated with the assessment, append a time-series entry to `skill_history`:
   ```sql
   INSERT INTO skill_history (student_id, skill_id, assessment_id, score, max_score, assessment_date)
   VALUES ($1, $2, $3, $4, 100, NOW());
   ```
5. Emit event or trigger skill-gap evaluation hook (Phase 04).

---

## 4. tRPC Router & Service Contracts

### 4.1 Student Router (`server/routers/student.ts`)
```typescript
import { router, studentProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import * as studentService from "../services/studentService";
import * as academicService from "../services/academicService";
import * as skillService from "../services/skillService";

export const studentRouter = router({
  getProfile: studentProcedure.query(async ({ ctx }) => {
    return studentService.getStudentProfile(ctx.user.studentProfile.id);
  }),

  getAcademics: studentProcedure.query(async ({ ctx }) => {
    return academicService.getStudentAcademics(ctx.user.studentProfile.id);
  }),

  getSkills: studentProcedure.query(async ({ ctx }) => {
    return skillService.getStudentSkillProfile(ctx.user.studentProfile.id);
  }),

  submitAssessment: studentProcedure
    .input(
      z.object({
        assessmentId: z.string().uuid(),
        answers: z.record(z.string(), z.string()), // questionId -> selectedOption
      })
    )
    .mutation(async ({ input, ctx }) => {
      return skillService.submitAssessment({
        studentId: ctx.user.studentProfile.id,
        assessmentId: input.assessmentId,
        answers: input.answers,
      });
    }),
});
```

### 4.2 Core Service Methods

#### `academicService.getStudentAcademics(studentId: string)`
Returns:
```typescript
export interface StudentAcademicsResponse {
  cgpa: number;
  totalCredits: number;
  activeBacklogsCount: number;
  semesters: {
    semester: number;
    academicYear: string;
    sgpa: number;
    subjects: {
      code: string;
      name: string;
      marks: number;
      grade: string;
      status: "PASSED" | "FAILED";
    }[];
  }[];
  backlogs: {
    id: string;
    subjectName: string;
    semester: number;
    status: "ACTIVE" | "CLEARED";
  }[];
}
```

#### `skillService.getStudentSkillProfile(studentId: string)`
Returns:
```typescript
export interface SkillProfileResponse {
  skills: {
    id: string;
    name: string;
    category: string;
    latestScore: number;
    delta: number; // change since previous attempt
    scoreHistory: number[]; // e.g. [78, 70, 61]
    verified: boolean;
  }[];
}
```

---

## 5. UI Implementation (`Progress.tsx` & `Skills.tsx`)
- `Progress.tsx`: Render CGPA trend chart (`recharts` LineChart), semester cards with collapsible subject lists, and active backlog warning callouts.
- `Skills.tsx`: Render skill cards with score progress rings, delta indicators (+5%, -9%), sparklines of recent assessment cycles, and an active *"Take New Assessment"* button opening a modal.

---

## 6. Verification & Acceptance Tests
1. Run Seed & Verify Rahul Sharma's Academics:
   - Query `trpc.student.getAcademics.query()` $\rightarrow$ Verify `cgpa === 8.42`, `activeBacklogsCount === 1` (OS).
2. Assessment Submission Test:
   - Submit assessment answers $\rightarrow$ Verify entry added to `assessment_submissions`.
   - Verify `skill_history` reflects the new score point.
3. Anti-Tamper Security Test:
   - Verify a student cannot pass another student's `studentId` to mutate their scores.

---

## 7. Definition of Done
- [ ] Student profile, academics, and skills services implemented with Drizzle ORM.
- [ ] tRPC queries registered and verified.
- [ ] `Progress.tsx` and `Skills.tsx` connected to real backend endpoints.
- [ ] Tests passing for assessment submission and score trajectory updates.
