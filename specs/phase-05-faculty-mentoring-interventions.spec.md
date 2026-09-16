# Phase 05 Specification: Faculty Mentoring & Closed-Loop Interventions

## 1. Metadata
- **Phase**: 05
- **Title**: Faculty Ward Roster, Closed-Loop Mentoring & Gap Resolution
- **Status**: Ready for Implementation
- **Dependencies**: Phase 01, Phase 02, Phase 04
- **Target Files**:
  - `backend/src/services/interventionService.ts`
  - `backend/src/routers/faculty.ts`
  - `frontend/client/src/pages/FacultyWards.tsx`
  - `frontend/client/src/components/InterventionModal.tsx`

---

## 2. Objective & Scope
Build the faculty ward monitoring interface and closed-loop intervention workflow. Enable faculty mentors to view assigned student wards, inspect active skill gaps (`Needs Attention`), schedule structured mentoring sessions, assign remedial study tasks, and automatically transition skill gaps from `OPEN` to `RESOLVED` once a student takes a follow-up assessment and hits the target score.

---

## 3. Closed-Loop State Machine

```text
               +-----------------------------+
               |     SKILL GAP DETECTED      |
               |       (Status: OPEN)        |
               +--------------+--------------+
                              |
                              | Faculty assigned / alerted
                              v
               +-----------------------------+
               |     INTERVENTION CREATED    |
               |     (Status: SCHEDULED)     |
               +--------------+--------------+
                              |
                              | Session conducted & material assigned
                              v
               +-----------------------------+
               |   INTERVENTION COMPLETED    |
               |    (Outcome text logged)    |
               +--------------+--------------+
                              |
                              | Student re-assesses in Skill S
                              v
               +-----------------------------+
               |   SCORE THRESHOLD CHECK     |
               |   (New Score vs Target 75)  |
               +-------+-------------+-------+
                       |             |
         New Score >= 75             New Score < 75
                       |             |
                       v             v
             +---------------+ +---------------+
             | GAP RESOLVED  | | GAP REOPENED  |
             | Closed-Loop   | | Escalated to  |
             | Verified      | | HOD / Extra   |
             +---------------+ +---------------+
```

---

## 4. tRPC Router & Service Contracts (`backend/src/routers/faculty.ts`)

```typescript
import { router, facultyProcedure } from "../_core/trpc";
import { z } from "zod";
import * as interventionService from "../services/interventionService";

export const facultyRouter = router({
  getWards: facultyProcedure.query(async ({ ctx }) => {
    // Only fetch students where assigned_faculty_id === ctx.user.id
    return interventionService.getAssignedWards(ctx.user.id);
  }),

  createIntervention: facultyProcedure
    .input(
      z.object({
        studentId: z.string().uuid(),
        skillGapId: z.string().uuid(),
        type: z.enum(["MENTORING", "REMEDIAL_CLASS", "ASSIGNMENT"]),
        description: z.string().min(5),
        startDate: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return interventionService.createIntervention({
        assignedBy: ctx.user.id,
        ...input,
      });
    }),

  recordOutcome: facultyProcedure
    .input(
      z.object({
        interventionId: z.string().uuid(),
        outcome: z.string().min(5),
        status: z.enum(["COMPLETED", "CANCELLED"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return interventionService.recordOutcome(input);
    }),
});
```

### 4.1 Automated Resolution Hook
When a student completes a follow-up assessment in Phase 03:
```typescript
export async function checkInterventionResolution(studentId: string, skillId: string, newScore: number) {
  const db = await getDb();
  if (!db) return;

  if (newScore >= 75) {
    // Find any open skill gaps for this student and skill
    const openGaps = await db.query.skillGaps.findMany({
      where: and(
        eq(skillGaps.studentId, studentId),
        eq(skillGaps.skillId, skillId),
        eq(skillGaps.status, "OPEN")
      ),
    });

    for (const gap of openGaps) {
      await db.update(skillGaps).set({
        status: "RESOLVED",
        resolvedAt: new Date(),
      }).where(eq(skillGaps.id, gap.id));

      // Mark linked active interventions as COMPLETED
      await db.update(interventions).set({
        status: "COMPLETED",
        outcome: `Automatically resolved: Follow-up score improved to ${newScore}.`,
        updatedAt: new Date(),
      }).where(eq(interventions.skillGapId, gap.id));
    }
  }
}
```

---

## 5. UI Views (`FacultyWards.tsx` & `InterventionModal.tsx`)
- **Ward Table**:
  - Student Name (e.g. Rahul Sharma), Roll Number, CGPA (8.42).
  - Status Badge: `Needs Attention` (Red/Amber) if open gaps exist; `On Track` (Emerald) otherwise.
  - Action: *"View Gaps & Intervene"*.
- **Intervention Creator Modal**:
  - Displays skill gap context & AI briefing.
  - Inputs: Intervention Type (Mentoring Session), Session Date, Action Notes.
  - Submit: Creates intervention and sends Supabase Realtime notification to the student.

---

## 6. Verification & Acceptance Tests
1. Verify Ward Scope Isolation:
   - Faculty A cannot view wards assigned to Faculty B.
2. Mentoring Lifecycle Test:
   - Faculty creates intervention for Rahul Sharma $\rightarrow$ Verify record in `interventions`.
3. Closed-Loop Demo Flow Test:
   - Rahul's initial score: 61 (Gap: `OPEN`).
   - Faculty logs intervention.
   - Rahul re-assesses and scores 78.
   - Verify: Gap transitions to `RESOLVED`, intervention marked `COMPLETED`.

---

## 7. Definition of Done
- [ ] Faculty ward query enforces strict teacher-guardian scope.
- [ ] Intervention creation and outcome recording persisted in Supabase PostgreSQL.
- [ ] Follow-up assessment triggers automatic closed-loop gap resolution.
- [ ] Faculty UI rendered and tested.
