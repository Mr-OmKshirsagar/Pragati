# Phase 07 Specification: Internship Lifecycle & Faculty Verification

## 1. Metadata
- **Phase**: 07
- **Title**: Smart Internship Lifecycle Management & Faculty Verification Review
- **Status**: Ready for Implementation
- **Dependencies**: Phase 01, Phase 02, Phase 06
- **Target Files**:
  - `frontend/server/services/internshipService.ts`
  - `frontend/server/routers/internship.ts`
  - `frontend/client/src/pages/WorkspacePages.tsx`
  - `frontend/client/src/pages/FacultyReview.tsx`
  - `frontend/client/src/components/InternshipCheckinModal.tsx`

---

## 2. Objective & Scope
Implement the full student internship lifecycle under **Problem Statement ED-06**. Enable students to register internships, submit mandatory milestones (Offer Letter, Bi-weekly Check-ins, Midterm Report, Completion Certificate), track an objective Evidence Completeness metric, and provide faculty mentors with an auditable verification desk to inspect SHA-256 evidence documents and grant `INSTITUTION_VERIFIED` status.

---

## 3. Milestone & Verification Lifecycle

```text
[INTERNSHIP CREATED] (Status: IN_PROGRESS)
  ├── 1. Milestone: Offer Letter (PDF + SHA-256)
  ├── 2. Milestone: Periodic Check-ins (Summaries submitted by student)
  ├── 3. Milestone: Mid-term / Final Internship Report
  └── 4. Milestone: Completion Certificate (PDF + SHA-256)
           │
           ▼ Evidence Completeness: 100%
[SUBMITTED FOR INSTITUTIONAL VERIFICATION]
           │
           ▼ Faculty Review Queue
[FACULTY MENTOR REVIEW DESK]
  ├── Verify SHA-256 File Integrity
  ├── Inspect Company & Supervisor Details
  └── Action:
        ├── APPROVE ──► Internship Status: 'COMPLETED'
        │               Verification Status: 'INSTITUTION_VERIFIED'
        │               Audit record inserted into 'verifications'
        └── REJECT  ──► Verification Status: 'REJECTED' (Notes returned to student)
```

---

## 4. Business Logic & Invariants

### 4.1 Evidence Completeness Formula
The Evidence Completeness score is an indicator of documentation coverage, **not** a guarantee of authenticity:
$$\text{EvidenceCompleteness} = \frac{\text{CompletedMilestones}}{\text{TotalRequiredMilestones}} \times 100\%$$
- Required Milestones:
  1. `OFFER_LETTER` (Weight: 25%)
  2. `CHECK_IN` (At least 1 check-in, Weight: 25%)
  3. `INTERNSHIP_REPORT` (Weight: 25%)
  4. `COMPLETION_CERTIFICATE` (Weight: 25%)

### 4.2 Prohibited Actions
- Students **cannot** verify their own internships or set verification status to `INSTITUTION_VERIFIED`.
- An internship cannot transition to `COMPLETED` without both an approved Completion Certificate and an authorized faculty signature.

---

## 5. tRPC Router & Service Contracts (`server/routers/internship.ts`)

```typescript
import { router, studentProcedure, facultyProcedure } from "../_core/trpc";
import { z } from "zod";
import * as internshipService from "../services/internshipService";

export const internshipRouter = router({
  getMyInternship: studentProcedure.query(async ({ ctx }) => {
    return internshipService.getStudentActiveInternship(ctx.user.studentProfile.id);
  }),

  createInternship: studentProcedure
    .input(
      z.object({
        companyName: z.string().min(2),
        role: z.string().min(2),
        startDate: z.string(),
        endDate: z.string().optional(),
        stipend: z.number().optional(),
        supervisorName: z.string().optional(),
        supervisorEmail: z.string().email().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return internshipService.createInternship(ctx.user.studentProfile.id, input);
    }),

  submitCheckin: studentProcedure
    .input(
      z.object({
        internshipId: z.string().uuid(),
        summary: z.string().min(10),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return internshipService.addCheckin(ctx.user.studentProfile.id, input);
    }),

  verifyInternship: facultyProcedure
    .input(
      z.object({
        internshipId: z.string().uuid(),
        status: z.enum(["INSTITUTION_VERIFIED", "REJECTED"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return internshipService.verifyInternship({
        verifierId: ctx.user.id,
        ...input,
      });
    }),
});
```

---

## 6. UI Views

### 6.1 Student View (`WorkspacePages.tsx?kind=internship`)
- **Header**: Company (TechCorp), Role (Software Engineering Intern), Status Badge (`IN_PROGRESS` or `COMPLETED`).
- **Milestone Progress Bar**: 75% / 100% with checkmarks next to completed evidence.
- **Check-in Feed**: History of submitted progress updates.
- **Upload Dropzone**: Upload Completion Certificate with live SHA-256 calculation.

### 6.2 Faculty Review Desk (`FacultyReview.tsx`)
- **Queue Table**: Pending student internships awaiting sign-off.
- **Evidence Inspector**:
  - Displays document filename, storage preview link, and cryptographic SHA-256 hash.
  - One-click file integrity validation check.
- **Decision Controls**:
  - `[Approve & Verify]` button $\rightarrow$ updates status to `INSTITUTION_VERIFIED` and sets internship to `COMPLETED`.
  - `[Request Additional Evidence]` button with feedback textarea.

---

## 7. Verification & Acceptance Tests
1. RBAC Verification Check:
   - Attempt calling `verifyInternship` as a `STUDENT` $\rightarrow$ Expect `403 FORBIDDEN`.
2. Completeness Calculation Check:
   - Upload Offer Letter only $\rightarrow$ Completeness is 25%.
   - Add Check-in $\rightarrow$ Completeness is 50%.
   - Add Report & Certificate $\rightarrow$ Completeness is 100%.
3. Faculty Approval Verification:
   - Faculty approves Rahul Sharma's TechCorp internship $\rightarrow$ Verify `internships.status === 'COMPLETED'` and audit log entry created in `audit_logs`.

---

## 8. Definition of Done
- [ ] Internship lifecycle CRUD implemented in Supabase PostgreSQL.
- [ ] Check-ins and evidence milestones properly associated.
- [ ] Faculty verification desk enforces mentor permissions and creates audit entries.
- [ ] Hero student TechCorp demo flow test passes.
