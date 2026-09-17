# PRAGATI — Next Actions Checklist

**Pick ONE to start:**

## 🔴 Option A: Close Critical RBAC Gaps (15 min)
*[For production security & IDOR prevention]*

### Step 1: Fix Institution Scoping (5 min)
- [ ] Open `backend/src/services/placementService.ts`
- [ ] Find `getTnpPlacements()` function
- [ ] Add `institutionId` parameter
- [ ] Add `WHERE recruitment_drives.institutionId = ?` to query
- [ ] Update `tnpRouter.getPlacements` to pass `ctx.user.institutionId`

### Step 2: Fix Ward Validation (10 min)
- [ ] Open `backend/src/routers/faculty.ts`
- [ ] Find `createIntervention()` endpoint
- [ ] Add function to check if `studentId` is in faculty's assigned wards
- [ ] Reject with 403 if not assigned
- [ ] Test: faculty tries to create intervention for non-assigned student → 403

### Step 3: Verify Build
- [ ] Run: `cd backend; npm run build`
- [ ] Run: `cd frontend; npm run build`
- [ ] Confirm: No errors, builds successful

### ✅ Result:
- **IDOR vulnerabilities eliminated**
- **TNP cross-institution access blocked**
- **Faculty cross-ward access blocked**
- **Production security hardened**

---

## 🔧 Option B: Build Phase 7 (2–3 days)
*[For feature completion]*

### Step 1: Read Handoff Guide (15 min)
- [ ] Read `brain/20_AGENT_HANDOFF_GUIDE.md` (Phase 7 section)
- [ ] Note: 8 endpoints, 3 frontend pages, 3 tables to use

### Step 2: Create Internship Endpoints (4 hours)
- [ ] Create `student.registerInternship` endpoint
- [ ] Create `student.uploadInternshipEvidence` endpoint
- [ ] Create `student.getInternships` endpoint
- [ ] Create `student.getInternshipProgress` endpoint

### Step 3: Create Verification Endpoints (4 hours)
- [ ] Create `faculty.getVerificationQueue` endpoint
- [ ] Create `faculty.verifyInternshipEvidence` endpoint
- [ ] Add ward scope validation (fix Gap 3 here)

### Step 4: Create Assessment Endpoints (2 hours)
- [ ] Create `faculty.createAssessment` endpoint
- [ ] Create `faculty.publishAssessment` endpoint
- [ ] Create `admin.getAssessments` endpoint

### Step 5: Build Frontend Pages (8 hours)
- [ ] Create `InternshipWorkspace.tsx` (student)
- [ ] Create `VerificationDesk.tsx` (faculty)
- [ ] Create `AssessmentBuilder.tsx` (faculty/admin)

### Step 6: Test RBAC (1 hour)
- [ ] Write negative tests: student A can't access student B's internships
- [ ] Write negative tests: faculty can't verify non-assigned student evidence
- [ ] Write integration test: internship → upload → verify → status update

### ✅ Result:
- **Internship workspace complete**
- **Verification desk operational**
- **Assessment creation ready**
- **Phase 7 demo-ready**

---

## 🎪 Option C: Demo Preparation (30 min)
*[For showing current features]*

### Step 1: Run Demo Script (15 min)
- [ ] Read `brain/15_DEMO_FLOW.md` (10 min script)
- [ ] Log in as each of 5 roles
- [ ] Follow script step-by-step
- [ ] Time each section

### Step 2: Test Excel Export (5 min)
- [ ] Log in as TNP_COORDINATOR
- [ ] Go to Placement Dashboard
- [ ] Click "Export" → "Export All Placements"
- [ ] Verify .xlsx downloads with formatting
- [ ] Open in Excel, verify header styling + data

### Step 3: Verify RBAC Flows (10 min)
- [ ] Student tries to access faculty page → 403 or redirect
- [ ] Faculty tries to access TNP page → 403 or redirect
- [ ] Verify each role sees only their authorized pages
- [ ] Test "Persona Switcher" works (demo feature)

### ✅ Result:
- **Polished 10-min demo**
- **Excel export verified**
- **RBAC flows confirmed**
- **Ready for presentation**

---

## 📋 Quick Start (If Unsure)

### For Developers/Agents:
```
1. Read: brain/20_AGENT_HANDOFF_GUIDE.md
2. Build: Follow Phase 7 checklist above
3. Test: Write RBAC negative tests
```

### For Project Managers:
```
1. Read: EXECUTIVE_SUMMARY.md
2. Decide: Close gaps now or build features
3. Schedule: 4-week timeline to complete all phases
```

### For Demo/Sales:
```
1. Read: brain/15_DEMO_FLOW.md
2. Practice: 10-min demo script
3. Highlight: RBAC differentiator + Excel export
```

---

## 🚨 Critical Path (Recommended)

### Week 1: Security + Demo
- [ ] **Day 1:** Close RBAC gaps (15 min)
- [ ] **Day 1:** Rehearse demo (30 min)
- [ ] **Day 1:** Show current system to stakeholders

### Week 2–4: Feature Build
- [ ] **Week 2:** Build Phase 7 (internship)
- [ ] **Week 3:** Build Phase 8 (placement pipeline)
- [ ] **Week 4:** Build Phase 9 (HOD + admin)
- [ ] **Week 4:** Integration test + final demo prep

**Total:** 4 weeks to complete ✅ all features

---

## 🔧 Tools to Use

### For Building:
- **Backend:** `cd backend; npm run dev` (hot reload)
- **Frontend:** `cd frontend; npm run dev` (Vite dev server)
- **DB Schema:** `drizzle/schema.ts` (all 26 tables)

### For Testing:
- **RBAC Tests:** Write in `backend/tests/` folder
- **Integration Tests:** Use existing test files as patterns
- **Build Check:** `npm run build` in both directories

### For Reference:
- **Schema:** `brain/03_DATABASE_DESIGN.md`
- **RBAC Patterns:** `brain/19_RBAC_ENFORCEMENT_PATTERNS.md`
- **API Endpoints:** `brain/04_API_CONTRACT.md`
- **Page Spec:** `brain/18_PAGES_BUILD_CHECKLIST.md`
- **Quick Ref:** `SPEC_QUICK_REFERENCE.md`

---

## ⚠️ Common Pitfalls to Avoid

### Code:
- ❌ Don't accept `studentId` from input without validation
- ❌ Don't use unfiltered `findMany()` queries
- ❌ Don't trust user role from input
- ✅ Do use `ctx.user.id` for scope
- ✅ Do validate ownership before mutating
- ✅ Do log sensitive actions to audit_logs

### Testing:
- ❌ Don't skip RBAC negative tests
- ❌ Don't assume endpoints work without scope validation
- ✅ Do test cross-role access (should return 403)
- ✅ Do test cross-institution access (should return empty or 403)
- ✅ Do test cross-department access (Phase 9)

### Build:
- ❌ Don't push code without `npm run build` check
- ❌ Don't forget audit logging on sensitive mutations
- ✅ Do verify frontend builds (16.83s target)
- ✅ Do run integration tests after each phase
- ✅ Do update progress in `brain/17_PROGRESS.md`

---

## ✅ Completion Checklist (Any Option)

After your chosen option, verify:

### Code Quality:
- [ ] All endpoints use correct procedure base (student/faculty/hod/tnp/admin)
- [ ] No TypeScript errors
- [ ] No eslint warnings (if configured)
- [ ] Proper error handling

### RBAC Security:
- [ ] Cross-role access returns 403
- [ ] Cross-institution access blocked
- [ ] Cross-ward access blocked
- [ ] Scope derived from `ctx.user`, not input

### Build Status:
- [ ] `cd backend; npm run build` → success
- [ ] `cd frontend; npm run build` → success (< 30s)
- [ ] No runtime errors in console

### Documentation:
- [ ] Update `brain/17_PROGRESS.md` with completion
- [ ] Mark completed features ✅ in `brain/18_PAGES_BUILD_CHECKLIST.md`
- [ ] Add notes on any decisions/changes made

---

## 🏁 Ready to Start?

**Copy-paste commands:**

```bash
# Option A (Close RBAC Gaps)
cd backend
npm run build  # Verify no errors
# Then edit placementService.ts + faculty.ts as above

# Option B (Start Phase 7)
# Read brain/20_AGENT_HANDOFF_GUIDE.md Phase 7 section first

# Option C (Demo Prep)
# Read brain/15_DEMO_FLOW.md and practice 10-min flow
```

**When done:** Update progress in `brain/17_PROGRESS.md`

---

**Last Updated:** September 17, 2026  
**System Status:** ✅ Ready for next action  
**Decision Needed:** Choose Option A, B, or C above

*Pick one and start building!*
