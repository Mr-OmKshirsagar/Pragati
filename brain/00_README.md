# PRAGATI Brain — Documentation Index

**Purpose:** Central hub for system design, build plans, and operational knowledge.

**Last Updated:** September 17, 2026  
**System Status:** Phases 0–6 complete; Phases 7–9 planned and documented

---

## Quick Links by Use Case

### "I need to understand PRAGATI's vision"
→ Start with **01_PRODUCT_VISION.md** (goals, user personas, success metrics)

### "I need to understand the data model"
→ Read **03_DATABASE_DESIGN.md** (26 tables, relationships, why each table exists)

### "I need to understand the API"
→ Read **04_API_CONTRACT.md** (all endpoints, request/response schemas)

### "I need to understand security"
→ Read **05_SECURITY.md** (password hashing, SHA256, encryption) + **06_AUTH_RBAC.md** (roles, permissions, auth layers)

### "I need to build the next phase"
→ Read **20_AGENT_HANDOFF_GUIDE.md** (file structure, endpoints, code patterns)

### "I need to understand RBAC enforcement"
→ Read **19_RBAC_ENFORCEMENT_PATTERNS.md** (9 concrete code patterns, anti-patterns)

### "I need a build checklist"
→ Read **18_PAGES_BUILD_CHECKLIST.md** (what's done ✅, what's next 🔲, what's broken 🔴)

### "I need a quick reference"
→ Read **SPEC_QUICK_REFERENCE.md** (print & tape to monitor)

### "I need to know what's next"
→ Read **21_SUMMARY_AND_NEXT_STEPS.md** (status summary, phase roadmap, demo flow)

---

## Document Map

### Vision & Strategy (Start Here)

| Doc | Purpose | Read Time |
|---|---|---|
| **01_PRODUCT_VISION.md** | Product goals, personas, success metrics, UX philosophy | 5 min |
| **02_SYSTEM_DESIGN.md** | Architecture (3-tier), role-based flows, integrations | 8 min |

### Implementation Guides

| Doc | Purpose | Read Time |
|---|---|---|
| **03_DATABASE_DESIGN.md** | 26 tables, relationships, why each table, validation rules | 10 min |
| **04_API_CONTRACT.md** | All endpoint schemas (request/response), error codes | 15 min |
| **05_SECURITY.md** | Password hashing (bcrypt), SHA256 for evidence, encryption, secrets mgmt | 5 min |
| **06_AUTH_RBAC.md** | Roles (5 total), permissions per role, auth layers, token security | 8 min |
| **07_CACHING.md** | Cache strategy (Redis if deployed), TTLs, invalidation | 5 min |
| **08_RATE_LIMITING.md** | Rate limit rules per role, DDoS mitigation, burst allowance | 5 min |

### AI & Automation

| Doc | Purpose | Read Time |
|---|---|---|
| **09_AI_RULES.md** | Skill gap detection rules, eligibility evaluation rules (RuleAST format) | 8 min |
| **10_VERIFICATION.md** | How to verify academic records, evidence documents, internship evidence | 5 min |

### Implementation Standards

| Doc | Purpose | Read Time |
|---|---|---|
| **11_FRONTEND_RULES.md** | Component conventions, styling (TailwindCSS + role colors), accessibility | 8 min |
| **12_BACKEND_RULES.md** | API conventions, error handling, logging, response format | 5 min |
| **13_TESTING.md** | Test strategy (unit, integration, RBAC negative tests), commands | 8 min |
| **14_DEVOPS_DEPLOYMENT.md** | Env setup (Supabase, AWS S3), CI/CD, monitoring, prod checklist | 10 min |

### Demos & Communication

| Doc | Purpose | Read Time |
|---|---|---|
| **15_DEMO_FLOW.md** | Full demo script (10 min), flow per role, key points to highlight | 5 min |
| **16_SCOPE_CONTROL.md** | What's in scope (phases), what's out, decisions made, trade-offs | 5 min |
| **17_PROGRESS.md** | Session-by-session build progress, completed features, blockers | 3 min |

### Phase 7–9 Planning (New — September 17, 2026)

| Doc | Purpose | Read Time |
|---|---|---|
| **18_PAGES_BUILD_CHECKLIST.md** | Role-by-role page spec; maps every page to tables/columns; marks ✅ vs 🔲 vs 🔴 | 12 min |
| **19_RBAC_ENFORCEMENT_PATTERNS.md** | 9 concrete RBAC code patterns (copy-paste ready); correct vs ❌ wrong examples | 15 min |
| **20_AGENT_HANDOFF_GUIDE.md** | File structure reference; phase-by-phase table-to-endpoint mapping; frontend checklist | 15 min |
| **21_SUMMARY_AND_NEXT_STEPS.md** | What was done this session; where you are now; recommended build order; pre-build checklist | 10 min |

---

## Key Concepts (One-Liners)

### Architecture
- **3-Tier:** Frontend (React) ↔ Backend (Hono + tRPC) ↔ DB (Supabase/Postgres)
- **Stateless API:** All state in Supabase; session managed via JWT tokens
- **Role-Based Routing:** Frontend routes and backend endpoints enforced by role

### Data Model
- **26 Tables:** 4 identity, 6 academic, 8 feature (assessments, evidence, interventions), 2 placement (Phase 8), 2 internship (Phase 7), 2 operational
- **Normalized:** No denormalization; JOINs for views; materialized summary views in Phase 9
- **Audit Trail:** Every sensitive mutation logged to `audit_logs` (action, resource, user, timestamp)

### Security
- **RBAC:** 5 roles; every procedure enforces role + scope (student-scoped, faculty-scoped, institution-scoped, etc.)
- **IDOR Prevention:** Scope always derived from `ctx.user`, never from input; server-side validation mandatory
- **Evidence Integrity:** SHA256 hash stored for each uploaded document; verified by faculty on download
- **Secrets:** Never in code; all env-backed; .env.example shows structure without values

### Roles & Permissions
- **STUDENT:** View self, submit assessments, upload evidence, view eligible opportunities, apply
- **FACULTY:** View assigned students, create interventions, verify evidence, create assessments
- **HOD:** View department analytics, skill trends, intervention metrics
- **TNP_COORDINATOR:** Create drives, define eligibility rules, evaluate candidates, track applications
- **ADMIN:** Manage institution, users, skills, full audit trail (no scope filter)

### RBAC Enforcement
- **Procedure Base:** 5 base procedures (`studentProcedure`, `facultyProcedure`, `hodProcedure`, `tnpProcedure`, `adminProcedure`) enforce role
- **Scope Validation:** Router checks ownership before mutating; service trusts router; no re-checks
- **Audit Logging:** Every sensitive mutation logged; used for compliance + debugging

### Testing Strategy
- **Unit Tests:** Service functions in isolation (rule evaluation, eligibility, etc.)
- **Integration Tests:** End-to-end flows (student applies → TNP evaluates → student sees result)
- **RBAC Negative Tests:** Student A tries to access Student B → 403; Faculty A tries to verify non-assigned student → 403
- **Load Tests:** (Optional for demo) Bulk student creation, bulk eligibility evaluation

---

## Build Roadmap

### Phases 0–6: ✅ COMPLETE
- Auth (login, persona switcher)
- Student dashboard, progress, skills, achievements
- Faculty wards + interventions
- Skill gaps + gap remediation
- Assessments + submissions
- Evidence upload + verification framework
- Placement drives (TNP CRUD + publish) — NEW Phase 6
- Excel export — NEW Phase 6

### Phase 7: Internship Workspace (2–3 days)
- Student registers internship, uploads milestones/evidence
- Faculty verifies internship evidence + SHA256 validation
- Assessment creation + publishing (faculty/admin)

**Key RBAC:** Student self-scoped; faculty ward-scoped; evidence ownership validated

### Phase 8: Placement Pipeline (2–3 days)
- TNP builds eligibility rules (JSON AST rule engine)
- Bulk evaluate students against rule
- View candidate pipeline (who qualifies + who applied)
- Application status tracking

**Key RBAC:** Institution-scoped evaluation; drive ownership validation

### Phase 9: HOD & Admin (2–3 days)
- HOD: Department analytics, skill heatmap, intervention velocity
- Admin: Institution setup, user management, skill taxonomy, full audit trail

**Key RBAC:** HOD department-scoped; admin org-wide

**4 RBAC Gaps (15 min before any phase):**
1. `tnp.getPlacements` missing institutionId filter → FIX in Phase 8
2. `faculty.createIntervention` missing ward validation → FIX before Phase 7
3. `faculty.verifyInternshipEvidence` missing scope check → FIX during Phase 7 build
4. `hod.*` queries need departmentId filter → FIX during Phase 9 build

---

## Completion Status

### Phases 0–6: ✅ Ready for Demo
- [x] Login + role switching (demo-ready)
- [x] Student dashboard (data-backed)
- [x] Student progress (semester trend chart)
- [x] Skills (assessment integration)
- [x] Achievements (evidence upload)
- [x] Faculty wards (role-scoped)
- [x] Interventions (create + outcome logging)
- [x] Placement drives (TNP CRUD)
- [x] Excel export (formatted, timestamped)
- [x] RBAC middleware (all 5 procedures)
- [x] Audit logging (infrastructure ready)

### Phases 7–9: 🔲 Planned & Documented
- [x] Phase 7 spec (endpoints, RBAC rules, code patterns)
- [x] Phase 8 spec (rule engine, evaluation, pipeline)
- [x] Phase 9 spec (HOD analytics, admin setup)
- [x] RBAC enforcement guide (9 patterns)
- [x] Agent handoff guide (file structure, mappings)
- [x] Build checklist (what's next, what's broken)

---

## How to Read These Docs

### For Product Managers
1. Start: **01_PRODUCT_VISION.md**
2. Then: **02_SYSTEM_DESIGN.md**
3. Demo: **15_DEMO_FLOW.md**

### For Backend Developers
1. Start: **03_DATABASE_DESIGN.md**
2. Then: **04_API_CONTRACT.md** + **06_AUTH_RBAC.md**
3. Build: **20_AGENT_HANDOFF_GUIDE.md** + **19_RBAC_ENFORCEMENT_PATTERNS.md**
4. Test: **13_TESTING.md**

### For Frontend Developers
1. Start: **02_SYSTEM_DESIGN.md** (architecture)
2. Then: **11_FRONTEND_RULES.md** (conventions)
3. Build: **20_AGENT_HANDOFF_GUIDE.md** (components per phase)
4. Reference: **06_AUTH_RBAC.md** (routing by role)

### For DevOps / Deployment
1. Start: **14_DEVOPS_DEPLOYMENT.md**
2. Then: **05_SECURITY.md** (secrets, encryption)
3. Run: **13_TESTING.md** (test before deploy)

### For Demo / Sales
1. Start: **01_PRODUCT_VISION.md**
2. Run: **15_DEMO_FLOW.md**
3. Backup: **21_SUMMARY_AND_NEXT_STEPS.md** (if questions on roadmap)

### For Code Agents (Kiro or External)
1. Start: **18_PAGES_BUILD_CHECKLIST.md** (what to build)
2. Learn: **19_RBAC_ENFORCEMENT_PATTERNS.md** (how to enforce RBAC)
3. Implement: **20_AGENT_HANDOFF_GUIDE.md** (where to code, exact endpoints)
4. Reference: **03_DATABASE_DESIGN.md** (table schemas)

---

## Critical Files in Codebase

| File | Purpose | Last Modified |
|---|---|---|
| `backend/src/_core/trpc.ts` | RBAC middleware | Phase 6 |
| `backend/src/routers/student.ts` | Student endpoints | Phase 6 |
| `backend/src/routers/faculty.ts` | Faculty endpoints | Phase 6 |
| `backend/src/routers/tnp.ts` | TNP endpoints (drive CRUD) | Phase 6 |
| `backend/src/services/placementService.ts` | Placement logic | Phase 6 |
| `drizzle/schema.ts` | All 26 tables (read-only) | Phase 6 |
| `frontend/client/src/App.tsx` | Role-based routing | Phase 6 |
| `frontend/client/src/utils/excelExport.ts` | Excel export utility | Phase 6 |
| `frontend/client/src/pages/tnp/PlacementDashboard.tsx` | TNP dashboard | Phase 6 |

---

## Next Steps

### Immediate (This Week)
1. **Close RBAC Gaps (15 min):** Fixes for institution scoping, ward validation, evidence scope
2. **Build Phase 7 (2–3 days):** Internship workspace + verification + assessments
3. **Test RBAC (parallel):** Write negative tests to ensure scope enforcement

### Short Term (Next Week)
1. Build Phase 8: Eligibility rules + pipeline
2. Build Phase 9: HOD + admin pages
3. Integration test all phases together
4. Prepare demo flow

### Before Production
1. All RBAC gaps closed + tested
2. Audit logging on all sensitive mutations
3. Error messages generic (no info disclosure)
4. Token security reviewed (short-lived + refresh)
5. Secrets in env only (never in code)
6. Rate limiting configured (if high-traffic demo)
7. HTTPS enforced (deployment phase)

---

## Key Differentiators (What Makes PRAGATI Unique)

1. **Full RBAC Scoping:** Every query/mutation enforces role + institutional + departmental boundaries (not just UI hiding)
2. **Audit Trail:** Every sensitive action logged (who did what, when, to what resource)
3. **IDOR Prevention:** Server-side validation on all sensitive operations
4. **Cryptographic Evidence:** SHA256 hashing for internship evidence; verified by faculty
5. **Role-Specific Views:** Students, faculty, HOD, TNP, admin each see their own domain
6. **Rule-Based Eligibility:** TNP can define custom eligibility rules; bulk evaluation on students
7. **One-Click Export:** Placement drives to Excel with formatting

---

## Questions?

- **"How do I build X?"** → Read `20_AGENT_HANDOFF_GUIDE.md` (exact endpoints, files, code patterns)
- **"How do I enforce RBAC?"** → Read `19_RBAC_ENFORCEMENT_PATTERNS.md` (9 patterns)
- **"What do I build next?"** → Read `21_SUMMARY_AND_NEXT_STEPS.md` (roadmap)
- **"Why is Y designed this way?"** → Read `16_SCOPE_CONTROL.md` (trade-offs) or specific design doc
- **"How do I test?"** → Read `13_TESTING.md` (test strategy + commands)

---

**Generated:** September 17, 2026  
**System:** PRAGATI (Placement, Research & Assessment Growth Through AI)  
**Status:** Phases 0–6 ✅ | Phases 7–9 📋 | Production 🎯
