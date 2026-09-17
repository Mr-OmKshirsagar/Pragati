# PRAGATI Build Spec — Quick Reference Card

**Print this & tape to your monitor.**

---

## Phase Status at a Glance

```
PHASES 0–6: ✅ COMPLETE
├─ STUDENT: Dashboard, Progress, Skills, Achievements, Interventions
├─ FACULTY: Ward Roster, Interventions
├─ TNP: Drive CRUD + Publish (+ Excel export ✅)
└─ SHARED: Login, Landing

PHASE 7: 🔲 NEXT (Internship + Assessment)
├─ STUDENT: registerInternship, uploadEvidence, getProgress
├─ FACULTY: Verify evidence, Create assessments
└─ NEW TABLES: internships, internship_evidence

PHASE 8: 🔲 THEN (Placement Pipeline)
├─ TNP: Create rules, Evaluate eligibility, View candidates
└─ NEW TABLE: placement_rules, eligibility_evaluations

PHASE 9: 🔲 AFTER (HOD + Admin)
├─ HOD: Analytics, Skill heatmap, Intervention velocity
└─ ADMIN: Institution setup, User management, Audit logs
```

---

## 4 RBAC Gaps to Close (15 min total)

| Gap | Location | Fix | Impact |
|---|---|---|---|
| **Gap 1** | `services/placementService.ts` | Add `WHERE institutionId = ?` to `getTnpPlacements()` | TNP IDOR |
| **Gap 2** | `routers/faculty.ts` | Add ward validation to `createIntervention()` | Faculty IDOR |
| **Gap 3** | `routers/faculty.ts` (Phase 7) | Add scope check to `verifyInternshipEvidence()` | Faculty IDOR |
| **Gap 4** | `routers/hod.ts` (Phase 9) | Add `WHERE departmentId = ?` to all HOD queries | HOD IDOR |

**Before demo:** Close gaps 1–3 (now). Gap 4 happens during Phase 9 build.

---

## Key Files (Read in This Order)

1. **`brain/18_PAGES_BUILD_CHECKLIST.md`** — What to build (mapped to schema)
2. **`brain/19_RBAC_ENFORCEMENT_PATTERNS.md`** — How to enforce RBAC (9 patterns)
3. **`brain/20_AGENT_HANDOFF_GUIDE.md`** — File structure + endpoints (for coding)
4. **`brain/21_SUMMARY_AND_NEXT_STEPS.md`** — Next steps + demo flow

---

## Schema Tables (26 Total)

**Core Identity:**
- `users`, `student_profiles`, `departments`, `institutions`

**Academic:**
- `academic_records`, `backlogs`, `subjects`, `skill_history`, `skills`

**Features:**
- `skill_gaps`, `interventions`, `assessments`, `assessment_skills`, `assessment_submissions`
- `achievements`, `evidence_documents`, `verifications`
- `recruitment_drives` (Phase 6), `applications`, `placement_rules` (Phase 8), `eligibility_evaluations` (Phase 8)
- `internships` (Phase 7), `internship_evidence` (Phase 7)

**Operational:**
- `audit_logs`, `notifications`

---

## RBAC Procedures (Use These!)

```typescript
// Public
publicProcedure

// Protected (any authenticated user)
protectedProcedure

// Role-specific
studentProcedure       // STUDENT only → auto-scoped to self
facultyProcedure       // FACULTY, HOD, ADMIN
hodProcedure           // HOD, ADMIN
tnpProcedure           // TNP_COORDINATOR, ADMIN
adminProcedure         // ADMIN only
```

**Template:** Every endpoint uses one of the above. ❌ Never use `publicProcedure` or `protectedProcedure` for role-specific logic.

---

## Endpoint Checklist (Phases 7–9)

### Phase 7

**Student Endpoints:**
- `student.registerInternship` (input: company, role, dates, ctc; write: `internships`)
- `student.uploadInternshipEvidence` (input: internshipId, evidenceType, file; write: `internship_evidence` + S3)
- `student.getInternships` (read: `internships` WHERE `studentId = ctx.user`)
- `student.getInternshipProgress` (read: `internship_evidence`, count by type, return %)

**Faculty Endpoints:**
- `faculty.getVerificationQueue` (read: `internship_evidence` for assigned students)
- `faculty.verifyInternshipEvidence` (input: evidenceId, status, notes; write: `verifications` + update `internship_evidence`)

**Faculty/Admin Endpoints:**
- `faculty.createAssessment` (input: name, skillIds[], maxScore, duration; write: `assessments` + `assessment_skills`)
- `faculty.publishAssessment` (input: assessmentId; update: `assessments.status` DRAFT→PUBLISHED)
- `admin.getAssessments` (read: `assessments`)

### Phase 8

**TNP Endpoints:**
- `tnp.createRule` (input: driveId, ruleAST; write: `placement_rules`) ← **[NEW]**
- `tnp.updateRule` (input: ruleId, ruleAST; update: `placement_rules`) ← **[NEW]**
- `tnp.evaluateEligibility` (input: driveId; read: student data; write: `eligibility_evaluations`) ← **[NEW]**
- `tnp.getCandidatePipeline` (input: driveId; read: `eligibility_evaluations` + `applications`) ← **[NEW]**
- `tnp.updateApplicationStatus` (input: appId, status; update: `applications`) ← **[NEW]**
- `tnp.getPlacements` ← **[FIX GAP 1: add institutionId filter]**

### Phase 9

**HOD Endpoints:**
- `hod.getDepartmentStats` (read aggregates WHERE `departmentId = ctx.user`)
- `hod.getSkillHeatmap` (read: `skill_history` grouped, WHERE dept)
- `hod.getInterventionVelocity` (read: `interventions` grouped by faculty, WHERE dept)
- `hod.getDepartmentAudit` (read: `audit_logs` WHERE dept)

**Admin Endpoints:**
- `admin.getInstitutions`, `admin.createDepartment`
- `admin.getUsers`, `admin.createUser`, `admin.deactivateUser`
- `admin.getSkills`, `admin.createSkill`
- `admin.getAuditLogs` (no dept filter — org-wide)

---

## Testing Checklist (Before Each Phase)

```
RBAC Negative Tests (should return 403):
[ ] Student A tries to access Student B's profile
[ ] Faculty A tries to create intervention for non-assigned student
[ ] Faculty A tries to verify evidence for non-assigned student
[ ] TNP from Inst A tries to access Inst B's drives
[ ] HOD from Dept A tries to access Dept B's analytics
[ ] Student tries to call admin endpoint

RBAC Positive Tests (should return 200):
[ ] Student accesses own profile
[ ] Faculty accesses assigned student's data
[ ] TNP accesses own institution's drives
[ ] HOD accesses own department's analytics
[ ] Admin accesses everything

AUDIT LOGGING Tests:
[ ] Create intervention → logged to audit_logs
[ ] Verify evidence → logged
[ ] Create rule → logged
[ ] Update application status → logged
[ ] Create user → logged
```

---

## Demo Script (10 min)

```
1. STUDENT (2 min)
   - Log in as student
   - Dashboard → show SGPA/CGPA, skill gaps, interventions
   - Progress → show semester trend
   - Skills → take an assessment
   - Achievements → upload evidence
   - Opportunities → check eligibility + apply

2. FACULTY (2 min)
   - Log in as faculty
   - Ward Roster → view assigned students
   - Click student → view interventions + create one
   - Record outcome → mark COMPLETED

3. TNP_COORDINATOR (2 min)
   - Log in as TNP
   - Placement Dashboard → view drives
   - Create Drive → fill form → submit
   - Publish → toggle visibility
   - EXPORT → show Excel file ✅

4. HOD (2 min) [Phase 9]
   - Log in as HOD
   - Department Analytics → show stats
   - Skill Heatmap → show grid
   - Intervention Velocity → show faculty table

5. ADMIN (1 min) [Phase 9]
   - Log in as admin
   - Audit Logs → show trail of actions
   - User Management → show create user form
```

---

## Common Mistakes to Avoid

❌ **Accepting user ID from input:**
```typescript
getProfile: studentProcedure
  .input(z.object({ studentId: z.string() }))
  .query(async ({ input }) => getProfile(input.studentId)); // IDOR!
```

✅ **Derive from context:**
```typescript
getProfile: studentProcedure.query(async ({ ctx }) => {
  return getProfile(ctx.user.studentProfile.id); // ✅ SAFE
});
```

---

❌ **Unfiltered bulk query:**
```typescript
getDepartmentStats: hodProcedure.query(async () => {
  return db.query.academicRecords.findMany(); // Cross-dept access!
});
```

✅ **Scoped query:**
```typescript
getDepartmentStats: hodProcedure.query(async ({ ctx }) => {
  return db.query.academicRecords.findMany({
    where: inArray(
      academicRecords.studentId,
      await getStudentsInDepartment(ctx.user.departmentId)
    ),
  });
});
```

---

❌ **Trust user role in input:**
```typescript
createUser: adminProcedure
  .input(z.object({ email, role: z.string() }))
  .mutation(async ({ input }) => createUser(input.email, input.role)); // Any role!
```

✅ **Enforce role enum:**
```typescript
createUser: adminProcedure
  .input(z.object({ 
    email, 
    role: z.enum(["STUDENT", "FACULTY", "HOD", "TNP_COORDINATOR", "ADMIN"]) 
  }))
  .mutation(async ({ input }) => createUser(input.email, input.role));
```

---

## Frontend Routing (App.tsx)

```typescript
export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      
      {/* STUDENT */}
      <Route path="/" component={Home} {...requireRole("STUDENT")} />
      <Route path="/progress" component={Progress} {...requireRole("STUDENT")} />
      <Route path="/skills" component={Skills} {...requireRole("STUDENT")} />
      <Route path="/achievements" component={Achievements} {...requireRole("STUDENT")} />
      <Route path="/workspace" component={WorkspacePages} {...requireRole("STUDENT")} />
      
      {/* FACULTY */}
      <Route path="/faculty" component={FacultyWards} {...requireRole("FACULTY")} />
      
      {/* TNP */}
      <Route path="/tnp" component={PlacementDashboard} {...requireRole("TNP_COORDINATOR")} />
      
      {/* HOD */}
      <Route path="/hod/analytics" component={DepartmentAnalytics} {...requireRole("HOD")} />
      
      {/* ADMIN */}
      <Route path="/admin" component={AdminDashboard} {...requireRole("ADMIN")} />
    </Routes>
  );
}
```

---

## Build Commands

```bash
# Backend
cd backend
npm run build                    # Build backend
npm run dev                      # Dev server (hot reload)

# Frontend
cd frontend
npm run build                    # Build frontend (Vite)
npm run dev                      # Dev server (Vite)
npm test                         # Run tests

# Both
npm run build && npm start       # Production
```

---

## Key Metrics

| Metric | Value |
|---|---|
| **Total Tables** | 26 |
| **RBAC Roles** | 5 (STUDENT, FACULTY, HOD, TNP_COORDINATOR, ADMIN) |
| **Completed Phases** | 0–6 |
| **Next Phases** | 7, 8, 9 |
| **RBAC Gaps** | 4 (closable in 15 min) |
| **Frontend Build Time** | 16.83s |
| **Frontend Modules** | 2,825 |
| **Frontend Output Size** | 1,951 KB (gzip: 515 KB) |

---

**Last Updated:** September 17, 2026  
**Status:** ✅ Ready for Phase 7  
**Next Action:** Close 4 RBAC gaps (15 min), then build Phase 7 (2–3 days)
