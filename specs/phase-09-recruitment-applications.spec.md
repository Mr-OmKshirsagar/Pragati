# Phase 09 Specification: Recruitment Drives & Student Applications

## 1. Metadata
- **Phase**: 09
- **Title**: Recruitment Drive Publishing & 1-Click Transparent Applications
- **Status**: Completed
- **Dependencies**: Phase 01, Phase 02, Phase 08
- **Target Files**:
  - `backend/src/services/applicationService.ts`
  - `backend/src/routers/recruitment.ts`
  - `frontend/client/src/pages/Opportunities.tsx`
  - `frontend/client/src/pages/admin/AdminPlacement.tsx`

---

## 2. Objective & Scope
Enable T&P Coordinators to create and publish campus recruitment drives with application deadlines and compensation details. Enable students to view active drives, verify their deterministic eligibility, and apply with a single click. Enforce strict server-side re-validation of eligibility and idempotency guards against duplicate submissions.

---

## 3. Application Lifecycle State Machine

```text
[DRIVE PUBLISHED BY T&P] (Status: PUBLISHED)
           │
           ▼ Student browses opportunities on /opportunities
[STUDENT ELIGIBILITY CHECK]
  ├── Evaluates student data against placement rule AST
  └── IF ELIGIBLE: "Apply in 1-Click" button enabled
           │
           ▼ Student clicks Apply
[SERVER APPLICATION HANDLER]
  ├── 1. Re-run server-side eligibility evaluation (Never trust client check)
  │       └── If NOT ELIGIBLE ──► Reject with 400 RULE_VIOLATION
  ├── 2. Check for existing application (student_id, drive_id)
  │       └── If EXISTS ──► Reject with 409 DUPLICATE_APPLICATION
  ├── 3. Insert record into applications (status: 'APPLIED')
  ├── 4. Record audit log in audit_logs
  └── 5. Send Supabase Realtime confirmation notification
           │
           ▼ T&P Coordinator Candidate Pipeline
[CANDIDATE STAGE MANAGEMENT]
  APPLIED ──► SHORTLISTED ──► INTERVIEWING ──► OFFERED / REJECTED
```

---

## 4. Business Logic & Invariants

### 4.1 Server-Side Gatekeeping
A student **cannot** bypass eligibility checks by calling the API directly. Even if a modified frontend sends an application request, the backend re-evaluates the active placement rule and blocks ineligible submissions.

### 4.2 Idempotency & Concurrency
The unique compound index on `(student_id, recruitment_drive_id)` in the `applications` table guarantees that duplicate clicks or concurrent requests cannot create duplicate applications.

---

## 5. tRPC Router Contracts (`backend/src/routers/recruitment.ts`)

```typescript
import { router, studentProcedure, tnpProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import * as applicationService from "../services/applicationService";

export const recruitmentRouter = router({
  getActiveDrives: publicProcedure.query(async () => {
    return applicationService.getPublishedDrives();
  }),

  applyToDrive: studentProcedure
    .input(z.object({ driveId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      return applicationService.submitApplication({
        studentId: ctx.user.studentProfile.id,
        driveId: input.driveId,
      });
    }),

  getMyApplications: studentProcedure.query(async ({ ctx }) => {
    return applicationService.getStudentApplications(ctx.user.studentProfile.id);
  }),

  updateApplicantStatus: tnpProcedure
    .input(
      z.object({
        applicationId: z.string().uuid(),
        status: z.enum(["APPLIED", "SHORTLISTED", "INTERVIEWING", "OFFERED", "REJECTED"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return applicationService.updateApplicationStatus(input);
    }),
});
```

---

## 6. UI Implementation (`Opportunities.tsx`)
- **Drive Cards**:
  - Company Logo, Name (e.g. ABC Technologies), Role (Software Engineer), Package (12 LPA).
  - Deadline countdown tag.
  - Criteria Pill: *"CGPA $\ge$ 7.5, Backlogs: 0, Verified Internship"*.
  - Buttons:
    - `[Check Eligibility]` $\rightarrow$ Opens `EligibilityCheckerModal`.
    - `[Apply Now]` (Enabled only after successful evaluation).
- **Applied Status Badge**:
  - Once applied, the button changes to `[✓ Applied on 16 Sep 2026]`.

---

## 7. Verification & Acceptance Tests
1. Direct API Bypass Test:
   - Ineligible student calls `trpc.recruitment.applyToDrive.mutate({ driveId })` directly.
   - Expect: Throws `400 Bad Request` with error code `RULE_VIOLATION`.
2. Duplicate Submission Test:
   - Call `applyToDrive` twice for the same student and drive $\rightarrow$ Second call fails cleanly with `DUPLICATE_APPLICATION`.
3. Candidate Pipeline Test:
   - Verify T&P Coordinator can view Rahul Sharma's application and transition status to `SHORTLISTED`.

---

## 8. Definition of Done
- [x] Published drives queried from Supabase PostgreSQL.
- [x] Server re-evaluates eligibility on application submission.
- [x] Idempotent unique constraint enforced.
- [x] `Opportunities.tsx` UI reflects live application states.
