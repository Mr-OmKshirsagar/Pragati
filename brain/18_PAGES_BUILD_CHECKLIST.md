# PRAGATI — Pages Build Checklist

**Grounded in:** 26-table Drizzle schema (schema.ts) + RBAC matrix (06_AUTH_RBAC.md) + Active routers

**Key Rule:** All procedures MUST enforce server-side RBAC scoping — NOT just hide UI. Protect against IDOR by deriving user scope from `ctx.user` and validating ownership before returning data.

---

## ✅ COMPLETED (Phases 0–6)

### SHARED / PUBLIC

| Page | Router Endpoint | Status | RBAC Notes |
|---|---|---|---|
| Landing (`Landing.tsx`) | None | ✅ | Static, no auth needed |
| Login (`Login.tsx`) | `auth.login` | ✅ | Public, session created |
| Persona Switcher (in Login) | N/A | ✅ | Frontend-only role selector for demo |
| 404 | None | ✅ | Static |

### STUDENT

| Page | Router Endpoint | Status | RBAC Notes |
|---|---|---|---|
| Dashboard (`Home.tsx`) | `student.getProfile` | ✅ | Uses `studentProcedure` → auto-scoped to logged-in student |
| Academic Progress (`Progress.tsx`) | `student.progress` | ✅ | Uses `studentProcedure` → auto-scoped to logged-in student |
| Skills (`Skills.tsx`) | `student.skills` | ✅ | Uses `studentProcedure` → auto-scoped to logged-in student |
| Achievements (`Achievements.tsx`) | `evidence.*` | ✅ | Student can view/upload own evidence (schema scoped by `userId`) |
| Mentoring (in `WorkspacePages.tsx`) | `student.getInterventions` | ✅ | Uses `studentProcedure` → auto-scoped to logged-in student |

### FACULTY

| Page | Router Endpoint | Status | RBAC Notes |
|---|---|---|---|
| Ward Roster (`FacultyWards.tsx`) | `faculty.getWards` | ✅ | Uses `facultyProcedure` + `getAssignedWards(ctx.user.id)` → scoped to assigned wards only |
| Intervention Modal (in Ward detail) | `faculty.createIntervention` | ✅ | Uses `facultyProcedure` + validates `studentId` is assigned ward; `interventionService.createIntervention()` enforces scope |

### TNP_COORDINATOR

| Page | Router Endpoint | Status | RBAC Notes |
|---|---|---|---|
| Drive Management (`PlacementDashboard.tsx`) | `tnp.getPlacements`, `tnp.createPlacement`, etc. | ✅ | Uses `tnpProcedure` → role-gated. **Gap:** `getPlacements` returns ALL drives; should be institutionScoped. See Phase 8 note. |

---

## 🔲 TO BUILD (Phases 7–9)

### PHASE 7: Internship Workspace (STUDENT)

| Feature | Endpoint(s) Needed | Table(s) | RBAC Strategy |
|---|---|---|---|
| **Internship Registration Form** | `student.registerInternship` | `internships` (new) | Input: `companyName`, `role`, `startDate`, `endDate`, `ctcOrStipend`; writes as `studentId: ctx.user.studentProfile.id` |
| **Upload Internship Milestones** | `student.uploadInternshipEvidence` | `internship_evidence` (new) + `evidence_documents` | Input: `internshipId`, `evidenceType` (OFFER_LETTER, CHECKUP_REPORT, etc.); scoped to logged-in student's internship |
| **View Completion Checklist** | `student.getInternshipProgress` | `internships` + `internship_evidence` + `evidence_documents` | Join `internships` where `studentId = ctx.user.studentProfile.id`; count evidence by type to compute % complete |
| **Internship Query (read-only view)** | `student.getInternships` | `internships`, `evidence_documents` (via `internship_evidence`) | Filter by `studentId = ctx.user.studentProfile.id` |

**RBAC Pattern:**
```typescript
// studentProcedure already enforces STUDENT role + derives studentId from ctx.user
// Every mutation/query uses: filter/join WHERE studentId = ctx.user.studentProfile.id
// Reject if studentId from input doesn't match ctx.user.studentProfile.id
```

### PHASE 7: Internship Verification Desk (FACULTY)

| Feature | Endpoint(s) Needed | Table(s) | RBAC Strategy |
|---|---|---|---|
| **Review Internship Evidence** | `faculty.getVerificationQueue` | `internship_evidence` + `evidence_documents` + `internships` | Faculty can only verify evidence for their assigned students. Joins: `internship_evidence.internshipId` → `internships.studentId` → (must be faculty's ward); validates `internships.verificationStatus = PENDING` |
| **Verify & Approve Evidence** | `faculty.verifyInternshipEvidence` | `verifications` (create); `internship_evidence.verificationStatus` (update) | Input: `evidenceId`, `approvalStatus` (APPROVED/REJECTED), `notes`; writer `verifierUserId = ctx.user.id`; checks ward ownership; updates `internship_evidence.verificationStatus` |
| **Bulk Verification Report** | `faculty.getVerificationStats` | `verifications` + `internship_evidence` + `internships` | Scoped: only count for faculty's assigned students |

**RBAC Pattern:**
```typescript
// facultyProcedure enforces FACULTY role
// getVerificationQueue: 
//   - Fetch faculty's assigned students (via ctx.user.id)
//   - Only return evidence for those students' internships
// verifyInternshipEvidence:
//   - Validate evidenceId → internshipId → studentId is in faculty's ward list
//   - Reject if not
```

**Cryptographic Verification:**
- When faculty approves, read `evidence_documents.sha256Hash` from DB
- Optionally: have frontend compute SHA256 on upload to validate file integrity

### PHASE 7: Assessment Creation & Management (FACULTY/ADMIN)

| Feature | Endpoint(s) Needed | Table(s) | RBAC Strategy |
|---|---|---|---|
| **List Assessments** | `faculty.getAssessments` (faculty views own) or `admin.getAssessments` (admin views all) | `assessments` | Faculty: filter by `createdBy = ctx.user.id`; Admin: no filter |
| **Create Assessment** | `faculty.createAssessment` or `admin.createAssessment` | `assessments` + `assessment_skills` (junction) | Input: `name`, `skillIds[]`, `maxScore`, `durationMinutes`, `questions[]`; writer: `createdBy = ctx.user.id`, `status: DRAFT` |
| **Publish Assessment** | `faculty.publishAssessment` or `admin.publishAssessment` | `assessments.status` → PUBLISHED | Only creator or ADMIN can publish; check `createdBy = ctx.user.id` |
| **Link Skills to Assessment** | (part of create/update) | `assessment_skills` | Bidirectional: many-to-many junction already in schema |

**RBAC Pattern:**
```typescript
// facultyProcedure for faculty creators
// adminProcedure for admin overrides
// Validate ownership before publish/delete
```

---

### PHASE 8: Placement Rule Builder & Pipeline (TNP_COORDINATOR)

| Feature | Endpoint(s) Needed | Table(s) | RBAC Strategy |
|---|---|---|---|
| **Create/Edit Placement Drive** | `tnp.createPlacement`, `tnp.updatePlacement` | `recruitment_drives` | ✅ Already exists (Phase 6). Scoped by `institutionId` (from ctx). **Gap:** currently not checking institutionId in service. |
| **Build Eligibility Rule** | `tnp.createRule`, `tnp.updateRule` | `placement_rules` | Input: `driveId`, `ruleAST` (JSON tree), `isActive`; scoped: verify `driveId` belongs to TNP's institution |
| **Evaluate Eligibility (Bulk)** | `tnp.evaluateEligibility` | `eligibility_evaluations` (write); reads: `student_profiles`, `academic_records`, `backlogs`, `skill_history`, `internships` | Reads students filtered by institution + department (TNP scope); for each student, evaluates rule AST against their academic data; writes `eligibility_evaluations` (drivId, studentId, eligible, reasons[]) |
| **View Candidate Pipeline** | `tnp.getCandidatePipeline` | `eligibility_evaluations` + `applications` + `student_profiles` | Scoped: filter by TNP's recruitment drives; for each drive, show: all eligible candidates, who applied, application status (APPLIED, OFFER_RECEIVED, REJECTED, etc.) |
| **Publish/Close Drive** | `tnp.togglePublish` | `recruitment_drives.status` (DRAFT → PUBLISHED → CLOSED) | ✅ Endpoint exists. Validate TNP owns drive. |

**RBAC & Scoping:**
```typescript
// tnpProcedure enforces TNP_COORDINATOR role
// All endpoints: validate drive.institutionId matches ctx.user.institutionId
// evaluateEligibility:
//   - Query students WHERE institution_id = ctx.user.institutionId
//   - For each: read academic_records, backlogs, skill_history, internships
//   - Eval rule AST
//   - Bulk-insert eligibility_evaluations
// getCandidatePipeline:
//   - Filter applications by drives TNP manages
//   - Join to eligible_evaluations to show match status
```

### PHASE 8: Applications Pipeline & Status Tracking (TNP_COORDINATOR + ADMIN)

| Feature | Endpoint(s) Needed | Table(s) | RBAC Strategy |
|---|---|---|---|
| **View All Applications for a Drive** | `tnp.getApplications` | `applications` + `student_profiles` + `eligibility_evaluations` | Scoped to drives TNP manages; show student name, applied date, current status (APPLIED/SHORTLISTED/OFFER/REJECTED/etc.) |
| **Update Application Status** | `tnp.updateApplicationStatus` | `applications.status` | Input: `applicationId`, `newStatus`; validate application belongs to TNP's drive; reject invalid transitions |
| **Bulk Status Update** | `tnp.bulkUpdateApplicationStatus` | `applications.status` | Input: `applicationIds[]`, `newStatus`; same ownership check |
| **Export Pipeline** | (use existing Excel export) | `applications` + `student_profiles` | Filter to TNP's drives; export with current status |

**RBAC Pattern:**
```typescript
// tnpProcedure
// All reads/writes on applications: validate drive owner first
```

---

### PHASE 9: HOD & ADMIN Pages (ADMIN + HOD)

#### HOD Pages

| Feature | Endpoint(s) Needed | Table(s) | RBAC Strategy |
|---|---|---|---|
| **Department Analytics Dashboard** | `hod.getDepartmentStats` | `academic_records`, `backlogs`, `skill_gaps` (aggregated) | Filter by `departmentId = ctx.user.departmentId`; compute: avg CGPA, backlog count, skill gaps by severity |
| **Skill Heatmap** | `hod.getSkillHeatmap` | `skill_history` (grouped by skillId × cohortSemester) | Scoped to department; show avg score per skill per semester across all students in dept |
| **Faculty Intervention Report** | `hod.getInterventionVelocity` | `interventions` (grouped by faculty), `skill_gaps` | Scoped to department; compute: avg time from start→end per faculty, status breakdown (COMPLETED, ACTIVE, CANCELLED), impact (skill score before→after) |
| **Audit Trail (Dept Scope)** | `hod.getDepartmentAudit` | `audit_logs` | Filter by `departmentId = ctx.user.departmentId`; show actions, resources, timestamps |

**RBAC Pattern:**
```typescript
// hodProcedure
// All queries: WHERE departmentId = ctx.user.departmentId
// Protect against cross-department access
```

#### ADMIN Pages

| Feature | Endpoint(s) Needed | Table(s) | RBAC Strategy |
|---|---|---|---|
| **Institution Setup** | `admin.getInstitution`, `admin.updateInstitution`, `admin.getDepartments`, `admin.createDepartment`, `admin.updateDepartment` | `institutions`, `departments` | No scope filter (ADMIN is org-wide); can see/modify all institutions and depts |
| **User Management** | `admin.getUsers`, `admin.createUser`, `admin.updateUser`, `admin.deactivateUser` | `users` + `student_profiles` (if student) | No filter; but enforce: ADMIN cannot self-demote; cannot create duplicate email; cannot activate without valid role |
| **Skill Taxonomy** | `admin.getSkills`, `admin.createSkill`, `admin.archiveSkill`, `admin.getSubjects`, `admin.createSubject` | `skills`, `subjects` | No scope; org-wide catalog |
| **Audit Logs (Full)** | `admin.getAuditLogs` | `audit_logs` | No departmentId filter; full institution audit trail |
| **System Configuration** | (skip for demo — not schema-backed) | N/A | Not needed unless judges ask |

**RBAC Pattern:**
```typescript
// adminProcedure
// No scope filtering — ADMIN sees everything
// Enforce write guards: can't duplicate email, can't self-demote, etc.
```

---

## 🔴 CRITICAL RBAC GAPS (To Close Before Production)

### Gap 1: Institution Scoping

**Problem:** `tnp.getPlacements` returns ALL drives, but should only return drives for TNP's institution.

**Impact:** TNP from Institution A could see Institution B's drives.

**Fix:**
```typescript
// In placementService.getTnpPlacements():
// Accept institutionId as param (from ctx.user.institutionId)
// Filter: WHERE recruitment_drives.institutionId = ?
```

**Affected Endpoints:**
- `tnp.getPlacements` → add institutionId filter
- `tnp.evaluateEligibility` → validate students belong to same institution
- `tnp.getCandidatePipeline` → scope to institution

### Gap 2: Ward Ownership Validation

**Problem:** `faculty.createIntervention` accepts `studentId` from input but doesn't validate faculty is assigned to that student.

**Impact:** Faculty could create interventions for any student.

**Fix:**
```typescript
// In interventionService.createIntervention():
// 1. Fetch faculty's assigned students: getAssignedWards(ctx.user.id)
// 2. Validate input.studentId is in that list
// 3. Reject if not found
```

**Affected Endpoints:**
- `faculty.createIntervention` → add ward validation
- `faculty.recordOutcome` → add intervention ownership check (verify interventionId belongs to faculty's ward)
- `faculty.getWardInterventions` → already scoped ✅

### Gap 3: Evidence Verification Scope

**Problem:** `faculty.verifyInternshipEvidence` doesn't validate faculty can verify for this student.

**Impact:** Faculty could verify evidence for non-assigned students.

**Fix:**
```typescript
// In verificationService or faculty router:
// 1. Fetch evidenceId → internshipId → studentId
// 2. Validate studentId is faculty's assigned ward
// 3. Proceed only if true
```

**Affected Endpoints:**
- `faculty.verifyInternshipEvidence` (Phase 7) → add ward + evidence scope check

### Gap 4: Department Boundaries (HOD)

**Problem:** `hod.*` endpoints don't exist yet, but when built must filter by `departmentId`.

**Impact:** HOD from Dept A could see Dept B's students.

**Fix:**
```typescript
// In all HOD endpoints:
// Filter by departmentId = ctx.user.departmentId
// Example: getStudents() → 
//   SELECT student_profiles WHERE 
//     departmentId = ctx.user.departmentId 
//     AND isActive = true
```

**Affected Endpoints (Phase 9):**
- `hod.getDepartmentStats` → add deptId filter
- `hod.getSkillHeatmap` → add deptId filter
- `hod.getInterventionVelocity` → add deptId filter

---

## 📋 PHASE-BY-PHASE BUILD ORDER

### Phase 7 (Internship + Assessment)
1. Create `internships` endpoints (student.registerInternship, student.getInternships)
2. Create `internship_evidence` endpoints + verification desk (faculty.getVerificationQueue, faculty.verifyInternshipEvidence)
3. Create `assessments` CRUD endpoints (faculty.createAssessment, admin.getAssessments, etc.)
4. **Key RBAC Rule:** Every endpoint validates user scope before returning data

### Phase 8 (Placement Pipeline)
1. **Close Gap 1:** Add institutionId filter to `tnp.getPlacements`
2. Create `placement_rules` endpoints (tnp.createRule, tnp.updateRule)
3. Create `tnp.evaluateEligibility` (bulk rule evaluation → writes eligibility_evaluations)
4. Create `tnp.getCandidatePipeline` (show who qualifies + who applied)
5. Create `applications` status endpoints (tnp.updateApplicationStatus, tnp.bulkUpdate)
6. **Key RBAC Rules:**
   - Validate drive belongs to TNP's institution
   - Validate students in evaluation are from same institution
   - Validate application ownership before status update

### Phase 9 (HOD + Admin)
1. **Close Gap 4:** Create HOD endpoints with departmentId filter (getDepartmentStats, getSkillHeatmap, etc.)
2. Create ADMIN endpoints (institution setup, user management, skill taxonomy)
3. Create full audit log viewer (admin.getAuditLogs with no dept filter)
4. **Key RBAC Rules:**
   - HOD: always filter by departmentId
   - ADMIN: no filter, but enforce ownership guards (no self-demote, no duplicate email, etc.)

---

## ✅ Pre-Commit Checklist (Before Each Phase)

- [ ] All procedures use correct base (`studentProcedure`, `facultyProcedure`, `hodProcedure`, `tnpProcedure`, `adminProcedure`)
- [ ] No unfiltered queries that expose cross-user/cross-department data
- [ ] All mutations validate input ownership before writing
- [ ] Services receive `userId` or `departmentId` from `ctx`, not from user input
- [ ] Integration tests include RBAC negative tests (e.g., student tries to access another student's data → 403)
- [ ] Audit logs created for sensitive mutations (user create, status updates, verifications)

---

## Summary Table: Phases & Feature Parity

| Role | Phase Completed | Next Phase | Key Building Blocks |
|---|---|---|---|
| **STUDENT** | 0–6 | 7 (Internship WS) | registerInternship, uploadEvidence, getProgress |
| **FACULTY** | 0–6 | 7 (Verify Internship) | verifyInternshipEvidence, getVerificationQueue |
| **HOD** | — | 9 (Analytics) | getDepartmentStats, getSkillHeatmap, getInterventionVelocity |
| **TNP** | 6 (Basic CRUD) | 8 (Rule + Pipeline) | createRule, evaluateEligibility, getCandidatePipeline |
| **ADMIN** | — | 9 (Setup + Audit) | institution setup, user mgmt, full audit trail |

---

**Last Updated:** September 17, 2026  
**Status:** Production-ready framework + 🔴 3 gaps identified, closable per spec
