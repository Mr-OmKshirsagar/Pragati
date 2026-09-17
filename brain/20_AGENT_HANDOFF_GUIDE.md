# PRAGATI — Agent Handoff Guide

**Purpose:** Hand this to a coding agent with one instruction: "Build Phase X features" and they know exactly what to code, where to code it, and how to enforce RBAC.

**Preconditions:** Agent has read:
- `18_PAGES_BUILD_CHECKLIST.md` (knows what to build)
- `19_RBAC_ENFORCEMENT_PATTERNS.md` (knows how to enforce RBAC)
- This document (knows file structure + table mappings)

---

## File Structure Reference

```
backend/
├── src/
│   ├── _core/
│   │   ├── context.ts          ← User context + session data
│   │   ├── trpc.ts             ← RBAC middleware (protectedProcedure, requireRole, etc.)
│   │   ├── supabase.ts         ← DB client
│   │   └── storage.ts          ← S3 client
│   │
│   ├── routers/
│   │   ├── index.ts            ← Imports all routers, exports appRouter
│   │   ├── auth.ts             ← Login/logout (public)
│   │   ├── student.ts          ← Student queries (uses studentProcedure)
│   │   ├── faculty.ts          ← Faculty queries (uses facultyProcedure)
│   │   ├── evidence.ts         ← Evidence upload (uses studentProcedure)
│   │   ├── skillGap.ts         ← Skill gap queries
│   │   ├── tnp.ts              ← TNP/placement (uses tnpProcedure)
│   │   └── [NEW in Phase X]    ← admin.ts, hod.ts, assessments.ts, etc.
│   │
│   └── services/
│       ├── studentService.ts
│       ├── academicService.ts
│       ├── skillService.ts
│       ├── interventionService.ts
│       ├── assessmentService.ts
│       ├── placementService.ts
│       ├── evidenceService.ts
│       └── [NEW in Phase X]   ← analyticsService.ts, verificationService.ts, etc.
│
frontend/
├── client/src/
│   ├── pages/
│   │   ├── Home.tsx             ← Student Dashboard ✅
│   │   ├── Progress.tsx         ← Academic Progress ✅
│   │   ├── Skills.tsx           ← Skills Page ✅
│   │   ├── Achievements.tsx     ← Achievements ✅
│   │   ├── Opportunities.tsx    ← Opportunities (needs eligibility wiring)
│   │   ├── WorkspacePages.tsx   ← Mentoring + Internship workspace ✅
│   │   ├── tnp/
│   │   │   └── PlacementDashboard.tsx  ← TNP Drive Management ✅
│   │   ├── faculty/
│   │   │   ├── FacultyWards.tsx  ← Ward Roster ✅
│   │   │   ├── [NEW Phase 7]    ← VerificationDesk.tsx
│   │   │   └── [NEW Phase 7]    ← AssessmentBuilder.tsx
│   │   ├── hod/
│   │   │   ├── [NEW Phase 9]    ← DepartmentAnalytics.tsx
│   │   │   ├── [NEW Phase 9]    ← SkillHeatmap.tsx
│   │   │   ├── [NEW Phase 9]    ← InterventionVelocity.tsx
│   │   │   └── [NEW Phase 9]    ← AuditTrail.tsx
│   │   ├── admin/
│   │   │   ├── [NEW Phase 9]    ← InstitutionSetup.tsx
│   │   │   ├── [NEW Phase 9]    ← UserManagement.tsx
│   │   │   ├── [NEW Phase 9]    ← SkillTaxonomy.tsx
│   │   │   ├── [NEW Phase 9]    ← AuditLogs.tsx
│   │   └── [NEW Phase 8]        ← tnp/RuleBuilder.tsx, CandidatePipeline.tsx
│   │
│   └── utils/
│       └── excelExport.ts       ← Export utility ✅
│
drizzle/
└── schema.ts        ← All 26 tables (read-only, don't modify)
```

---

## Table-to-Endpoint Mapping

### Phase 7: Internship Workspace

**NEW TABLES:**
- `internships` (studentId, companyName, role, startDate, endDate, ctcOrStipend, status, verificationStatus)
- `internship_evidence` (internshipId, evidenceType: OFFER_LETTER | CHECKUP | FINAL_REPORT | CERTIFICATE, status, verificationStatus, verifiedAt)

**NEW ENDPOINTS:**

| Endpoint | Router | Procedure | Input | Table(s) | Output |
|---|---|---|---|---|---|
| `student.registerInternship` | `student.ts` | `studentProcedure` | companyName, role, startDate, endDate, ctcOrStipend | INSERT `internships` | { success, internship } |
| `student.uploadInternshipEvidence` | `student.ts` | `studentProcedure` | internshipId, evidenceType, file | INSERT `internship_evidence` + `evidence_documents` | { success, evidence } |
| `student.getInternships` | `student.ts` | `studentProcedure` | — | READ `internships` WHERE studentId | { internships[] } |
| `student.getInternshipProgress` | `student.ts` | `studentProcedure` | — | READ `internship_evidence` grouped by evidenceType | { internshipId, completion% } |
| `faculty.getVerificationQueue` | `faculty.ts` | `facultyProcedure` | — | READ `internship_evidence` WHERE studentId IN (faculty's wards) | { evidence[], studentName, internshipRole } |
| `faculty.verifyInternshipEvidence` | `faculty.ts` | `facultyProcedure` | evidenceId, approvalStatus, notes | INSERT `verifications` + UPDATE `internship_evidence` | { success, verification } |

**Service Layer:**

| Service Function | File | Logic |
|---|---|---|
| `registerInternship()` | `services/placementService.ts` | INSERT `internships` with `studentId`, `status: ACTIVE` |
| `uploadInternshipEvidence()` | `services/placementService.ts` | Compute SHA256, upload to S3, INSERT `internship_evidence` |
| `getInternships()` | `services/placementService.ts` | SELECT `internships` WHERE `studentId` |
| `getVerificationQueue()` | `services/verificationService.ts` (NEW) | SELECT `internship_evidence` for assigned students |
| `verifyInternshipEvidence()` | `services/verificationService.ts` (NEW) | INSERT `verifications`, UPDATE `internship_evidence.verificationStatus` |

**Key RBAC Rules:**
- ✅ `student.registerInternship` → scoped to `ctx.user.studentProfile.id`
- ✅ `faculty.getVerificationQueue` → filter by `assignedFacultyId = ctx.user.id`
- ✅ `faculty.verifyInternshipEvidence` → validate internship belongs to assigned student

---

### Phase 7: Assessment Creation

**NEW TABLE:**
- `assessment_skills` (assessmentId, skillId) ← already in schema

**NEW ENDPOINTS:**

| Endpoint | Router | Procedure | Input | Table(s) | Output |
|---|---|---|---|---|---|
| `faculty.createAssessment` | `faculty.ts` | `facultyProcedure` | name, skillIds[], maxScore, durationMinutes, questions[] | INSERT `assessments` + `assessment_skills` | { success, assessment } |
| `faculty.publishAssessment` | `faculty.ts` | `facultyProcedure` | assessmentId | UPDATE `assessments.status` DRAFT→PUBLISHED | { success } |
| `admin.getAssessments` | `admin.ts` (NEW) | `adminProcedure` | — | READ `assessments` | { assessments[] } |
| `admin.archiveAssessment` | `admin.ts` (NEW) | `adminProcedure` | assessmentId | UPDATE `assessments.status` → ARCHIVED | { success } |

**Service Layer:**

| Service Function | File | Logic |
|---|---|---|
| `createAssessment()` | `services/assessmentService.ts` | INSERT `assessments` with `createdBy = ctx.user.id`, `status: DRAFT` |
| `publishAssessment()` | `services/assessmentService.ts` | UPDATE `assessments` WHERE `createdBy = ctx.user.id` → `status: PUBLISHED` |

**Key RBAC Rules:**
- ✅ Faculty can only publish assessments they created
- ✅ Only ADMIN can archive assessments

---

### Phase 8: Placement Pipeline

**EXISTING TABLE (with gap fix):**
- `recruitment_drives` (add scope: institutionId must be filtered)

**NEW TABLES:**
- `placement_rules` (recruitmentDriveId, ruleDefinition: JSON, isActive, version)
- `eligibility_evaluations` (drivId, studentId, eligible: boolean, reasons: string[])

**NEW ENDPOINTS:**

| Endpoint | Router | Procedure | Input | Table(s) | Output |
|---|---|---|---|---|---|
| `tnp.createRule` | `tnp.ts` | `tnpProcedure` | driveId, ruleAST (JSON) | INSERT `placement_rules` | { success, rule } |
| `tnp.updateRule` | `tnp.ts` | `tnpProcedure` | ruleId, ruleAST | UPDATE `placement_rules` | { success, rule } |
| `tnp.evaluateEligibility` | `tnp.ts` | `tnpProcedure` | driveId | READ `student_profiles`, `academic_records`, etc.; INSERT `eligibility_evaluations` | { success, count } |
| `tnp.getCandidatePipeline` | `tnp.ts` | `tnpProcedure` | driveId | READ `eligibility_evaluations` + `applications` + `student_profiles` | { candidates[] } |
| `tnp.updateApplicationStatus` | `tnp.ts` | `tnpProcedure` | applicationId, newStatus | UPDATE `applications.status` | { success } |
| `tnp.getPlacements` (FIX) | `tnp.ts` | `tnpProcedure` | — | READ `recruitment_drives` WHERE `institutionId = ctx.user.institutionId` | { drives[] } |

**Service Layer:**

| Service Function | File | Logic |
|---|---|---|
| `createRule()` | `services/placementService.ts` | INSERT `placement_rules` with `ruleDefinition` (JSON AST) |
| `evaluateEligibilityForInstitution()` | `services/placementService.ts` | Bulk-evaluate rule AST for all students; INSERT `eligibility_evaluations` |
| `getCandidatePipeline()` | `services/placementService.ts` | JOIN `eligibility_evaluations` + `applications` + `student_profiles` |
| `getTnpPlacements()` (FIX) | `services/placementService.ts` | Add `institutionId` parameter to WHERE clause |

**Key RBAC Rules:**
- 🔴 **GAP 1 FIX:** `getTnpPlacements()` now filters by `institutionId = ctx.user.institutionId`
- ✅ Rule evaluation scoped to institution's students
- ✅ Application updates validated against TNP's drives

---

### Phase 9: HOD & Admin Pages

**NEW ROUTERS:**
- `hod.ts`
- `admin.ts`

**NEW ENDPOINTS (HOD):**

| Endpoint | Router | Procedure | Input | Table(s) | Output |
|---|---|---|---|---|---|
| `hod.getDepartmentStats` | `hod.ts` | `hodProcedure` | — | `student_profiles`, `academic_records`, `backlogs`, `skill_gaps` | { avgCgpa, totalStudents, activeBacklogs } |
| `hod.getSkillHeatmap` | `hod.ts` | `hodProcedure` | — | `skill_history` (grouped by skillId × semester) | { skillId, semester, avgScore } |
| `hod.getInterventionVelocity` | `hod.ts` | `hodProcedure` | — | `interventions` (grouped by faculty), `skill_gaps` | { faculty, avgResolutionTime, statusBreakdown } |
| `hod.getDepartmentAudit` | `hod.ts` | `hodProcedure` | — | `audit_logs` WHERE `departmentId` | { logs[] } |

**NEW ENDPOINTS (ADMIN):**

| Endpoint | Router | Procedure | Input | Table(s) | Output |
|---|---|---|---|---|---|
| `admin.getInstitutions` | `admin.ts` | `adminProcedure` | — | `institutions` | { institutions[] } |
| `admin.createDepartment` | `admin.ts` | `adminProcedure` | institutionId, name, code | INSERT `departments` | { success, department } |
| `admin.getUsers` | `admin.ts` | `adminProcedure` | — | `users` | { users[] } |
| `admin.createUser` | `admin.ts` | `adminProcedure` | email, name, role, departmentId | INSERT `users` via Supabase Auth | { success, user } |
| `admin.deactivateUser` | `admin.ts` | `adminProcedure` | userId | UPDATE `users.isActive` | { success } |
| `admin.getSkills` | `admin.ts` | `adminProcedure` | — | `skills` | { skills[] } |
| `admin.createSkill` | `admin.ts` | `adminProcedure` | name, category | INSERT `skills` | { success, skill } |
| `admin.getAuditLogs` | `admin.ts` | `adminProcedure` | resourceType?, limit, offset | `audit_logs` | { logs[] } |

**Service Layer (NEW):**

| Service Function | File | Logic |
|---|---|---|
| `getDepartmentStats()` | `services/analyticsService.ts` (NEW) | Aggregate academic, backlog, skill gap data for deptId |
| `getSkillHeatmap()` | `services/analyticsService.ts` (NEW) | GROUP BY skillId, semester; compute avg score |
| `getInterventionVelocity()` | `services/analyticsService.ts` (NEW) | GROUP BY faculty; compute avg (endDate - startDate); count status |
| `getAuditLogs()` | `services/analyticsService.ts` (NEW) | SELECT `audit_logs` without departmentId filter |

**Key RBAC Rules:**
- 🔴 **GAP 4 FIX:** All `hod.*` queries filter by `WHERE departmentId = ctx.user.departmentId`
- ✅ ADMIN queries have NO scope filter (org-wide)
- ✅ User creation enforces valid role enum + no duplicate email

---

## Frontend File Creation Checklist

### Phase 7

- [ ] **`frontend/client/src/pages/tnp/InternshipWorkspace.tsx`**
  - Component: Form to register internship
  - Calls: `trpc.student.registerInternship.useMutation()`
  - Calls: `trpc.student.uploadInternshipEvidence.useMutation()` (for evidence upload)
  - Shows: Internship progress checklist

- [ ] **`frontend/client/src/pages/faculty/VerificationDesk.tsx`**
  - Component: Table of pending evidence (from `trpc.faculty.getVerificationQueue()`)
  - UI: Approve/Reject buttons for each piece of evidence
  - Calls: `trpc.faculty.verifyInternshipEvidence.useMutation()`
  - Shows: Student name, evidence type, uploaded date, SHA256 hash for verification

- [ ] **`frontend/client/src/pages/faculty/AssessmentBuilder.tsx`**
  - Component: Form to create assessment
  - Input: Name, select skills (multi-select), max score, duration, questions[]
  - Calls: `trpc.faculty.createAssessment.useMutation()`
  - Calls: `trpc.faculty.publishAssessment.useMutation()`

### Phase 8

- [ ] **`frontend/client/src/pages/tnp/RuleBuilder.tsx`**
  - Component: Visual rule builder (drag-drop conditions)
  - Shows: CGPA ≥ X, No active backlogs, Skill score ≥ Y, Internship completed, etc.
  - Calls: `trpc.tnp.createRule.useMutation()`, `trpc.tnp.updateRule.useMutation()`
  - Export: JSON AST to backend

- [ ] **`frontend/client/src/pages/tnp/CandidatePipeline.tsx`**
  - Component: Table of candidate pipeline per drive
  - Shows: Student name, eligibility (Eligible/Not Eligible), reasons[], applied (Yes/No), application status
  - Calls: `trpc.tnp.getCandidatePipeline.useQuery()`, `trpc.tnp.updateApplicationStatus.useMutation()`

- [ ] **Update `frontend/client/src/pages/Opportunities.tsx`**
  - Add: Eligibility badge next to each opportunity (Eligible/Not Eligible/Apply)
  - Call: Student applies → `trpc.student.applyForOpportunity.useMutation()`
  - Show: "You meet X criteria" or "Missing: CGPA, Active backlog"

### Phase 9 (HOD Pages)

- [ ] **`frontend/client/src/pages/hod/DepartmentAnalytics.tsx`**
  - Shows: Avg CGPA, total students, active backlogs, skill gaps by severity
  - Calls: `trpc.hod.getDepartmentStats.useQuery()`

- [ ] **`frontend/client/src/pages/hod/SkillHeatmap.tsx`**
  - Visualizes: Skill strength/weakness grid (rows: skills, cols: semesters, cells: avg score)
  - Calls: `trpc.hod.getSkillHeatmap.useQuery()`

- [ ] **`frontend/client/src/pages/hod/InterventionVelocity.tsx`**
  - Shows: Faculty table with avg resolution time, status breakdown (Completed, Active, Cancelled)
  - Calls: `trpc.hod.getInterventionVelocity.useQuery()`

- [ ] **`frontend/client/src/pages/hod/AuditTrail.tsx`**
  - Shows: Paginated audit log for department
  - Calls: `trpc.hod.getDepartmentAudit.useQuery()`

### Phase 9 (Admin Pages)

- [ ] **`frontend/client/src/pages/admin/InstitutionSetup.tsx`**
  - Form: Create/edit institution and departments
  - Calls: `trpc.admin.createDepartment.useMutation()`

- [ ] **`frontend/client/src/pages/admin/UserManagement.tsx`**
  - Table: List users with role, status (active/inactive)
  - Button: Create user (form with email, name, role, dept)
  - Button: Deactivate user
  - Calls: `trpc.admin.createUser.useMutation()`, `trpc.admin.deactivateUser.useMutation()`

- [ ] **`frontend/client/src/pages/admin/SkillTaxonomy.tsx`**
  - Table: Manage skills + subjects
  - Form: Add skill (name, category)
  - Calls: `trpc.admin.createSkill.useMutation()`

- [ ] **`frontend/client/src/pages/admin/AuditLogs.tsx`**
  - Table: Full org audit trail (paginated)
  - Calls: `trpc.admin.getAuditLogs.useQuery()`

---

## Key Testing Scenarios (RBAC Negative Tests)

Before submitting code, verify these fail (return 403/FORBIDDEN):

### Phase 7
- [ ] Faculty tries to verify evidence for non-assigned student → 403
- [ ] Faculty tries to create assessment then student tries to publish it → 403
- [ ] Student tries to register internship for another student → 403

### Phase 8
- [ ] TNP from Institution A tries to view Institution B's drives → 403 (or empty list)
- [ ] Student applies for opportunity they're not eligible for → Check eligibility evaluation first
- [ ] TNP evaluates eligibility using rule from a different drive → 403

### Phase 9
- [ ] HOD from Dept A views Dept B's analytics → 403
- [ ] HOD tries to create a user → 403 (ADMIN only)
- [ ] Faculty tries to access audit logs → 403 (ADMIN only)

---

## Audit Logging Checklist

Every sensitive mutation should log to `audit_logs`:

| Action | Resource Type | Fields to Log |
|---|---|---|
| Create internship | INTERNSHIP | studentId, companyName, role |
| Verify evidence | INTERNSHIP_EVIDENCE | evidenceId, verifierUserId, status, notes |
| Create assessment | ASSESSMENT | assessmentId, skillIds[], createdBy |
| Publish assessment | ASSESSMENT | assessmentId, status: DRAFT→PUBLISHED |
| Create rule | PLACEMENT_RULE | ruleId, ruleDefinition |
| Evaluate eligibility | ELIGIBILITY_EVALUATION | driveId, count evaluated, count eligible |
| Update application status | APPLICATION | applicationId, oldStatus, newStatus |
| Create user | USER | userId, email, role |
| Deactivate user | USER | userId, isActive: true→false |

**Log Entry Template:**
```typescript
await db.insert(auditLogs).values({
  id: nanoid(),
  action: "CREATE", // or UPDATE, DELETE, VERIFY
  resourceType: "INTERNSHIP", // or ASSESSMENT, APPLICATION, etc.
  resourceId: internshipId,
  userId: ctx.user.id,
  changes: { companyName: "...", role: "..." }, // What changed
  createdAt: new Date(),
});
```

---

## Handoff Instruction Template

> **Build Phase [X]**
>
> **What to Build:**
> - Endpoints: [list from table above]
> - Frontend Pages: [list from table above]
> - Services: [list from table above]
>
> **RBAC Rules (MANDATORY):**
> 1. [Rule 1 from appropriate section]
> 2. [Rule 2 from appropriate section]
>
> **Files to Create/Modify:**
> - Backend Router: `backend/src/routers/[router].ts` (create or add endpoints)
> - Backend Service: `backend/src/services/[service].ts` (create or add functions)
> - Frontend Pages: `frontend/client/src/pages/[path]/[Component].tsx` (create)
> - Audit Logging: Add log entries for sensitive mutations
>
> **Testing:**
> - Build and run: `npm run build` (backend), `npm run build` (frontend)
> - Verify RBAC: Write tests that confirm role X cannot access resource of role Y
> - Integration test: End-to-end flow from UI through API to DB
>
> **Reference Docs:**
> - For RBAC patterns, see `19_RBAC_ENFORCEMENT_PATTERNS.md`
> - For table schemas, see `drizzle/schema.ts`
> - For completed examples, see existing routers (e.g., `student.ts`, `faculty.ts`)

---

**Last Updated:** September 17, 2026  
**For:** Coding Agents (Kiro or external)  
**Status:** Ready for Phase 7 handoff
