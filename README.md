# PRAGATI — Smart Student Internship & Career Management Platform

> **From Student Progress to Verifiable Career Readiness**  
> *Problem Statement ED-06: Smart Internship Management and Monitoring System*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?logo=react)](https://react.dev/)
[![tRPC v11](https://img.shields.io/badge/tRPC-v11-2596be?logo=trpc)](https://trpc.io/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%7C%20Auth%20%7C%20Storage-3ECF8E?logo=supabase)](https://supabase.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle%20ORM-0.44-C5F74F?logo=drizzle)](https://orm.drizzle.team/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?logo=tailwindcss)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Tests-150%2F150%20Passing%20(15%20Suites)-green?logo=vitest)](https://vitest.dev/)
[![Security](https://img.shields.io/badge/Security-RLS%20%2B%20Zero--IDOR%20%2B%20SHA--256-blueviolet)](https://supabase.com/docs/guides/database/postgres/row-level-security)
[![Vercel Frontend](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel)](https://pragati-1.vercel.app/)
[![Render Backend](https://img.shields.io/badge/Render-API%20Live-46E3B7?logo=render)](https://pragati-dm6s.onrender.com/health)

---

## 🌐 Live Production Deployments

* **Frontend Web Application (Vercel)**: [https://pragati-1.vercel.app/](https://pragati-1.vercel.app/)
* **Backend API & Health Monitor (Render)**: [https://pragati-dm6s.onrender.com/health](https://pragati-dm6s.onrender.com/health)
* **Super Admin Governance Portal**: [https://pragati-1.vercel.app/super-admin-pragati01](https://pragati-1.vercel.app/super-admin-pragati01) *(Secured with Master Key & SMTP 2FA)*
* **Comprehensive Deployment Guide**: See [deploy.md](deploy.md) for full step-by-step instructions for Vercel, Render, and Supabase.

---

## 📌 Executive Overview

**PRAGATI** is an enterprise institutional platform engineered to monitor, mentor, and verify the complete student career lifecycle—from foundational curriculum academics and continuous skill assessments, through closed-loop faculty mentoring interventions and cryptographic internship verification, to deterministic corporate placement eligibility and verifiable Career Passports.

Rather than treating career readiness as a frantic final-year scramble across fragmented spreadsheets, email threads, and paper forms, PRAGATI establishes a **continuous, auditable, and mathematically explainable career pipeline**:

```text
Student Academic Ledger 
  ──► Continuous Skill Assessments (DSA, Python, DBMS, OS)
        ──► Deterministic Skill-Gap Trigger (RULE_GAP_01)
              ──► Assistive AI Contextual Explanation (Google Gemini)
                    ──► Faculty Closed-Loop Mentoring Intervention
                          ──► Re-Assessment & Automated Gap Resolution
                                ──► Internship Lifecycle & Milestones
                                      ──► Dual-Layer SHA-256 Cryptographic Vault
                                            ──► Institutional Mentor Sign-Off (INSTITUTION_VERIFIED)
                                                  ──► Deterministic Placement Rule AST Engine
                                                        ──► 1-Click Transparent Recruitment Application
                                                              ──► Verifiable Portable Career Passport
```

---

## 🎯 Core Problem & Mission

### Institutional Pain Points Solved
* **Siloed Academic Data**: Marks, backlogs, and assessments trapped in legacy ERPs or paper ledgers.
* **Late Deficiencies**: Skill gaps identified during placement interviews when it is too late to remediate.
* **Informal Mentoring**: Mentorship carried out as untracked chats without institutional accountability or closure.
* **Unverified Resumes**: Student resumes filled with self-reported claims lacking cryptographic proof or faculty sign-off.
* **Opaque Placements**: Placement cells manual-filtering candidate spreadsheets, breeding student distrust and errors.

### The PRAGATI Truthfulness Principle
PRAGATI is not an arbitrary AI evaluator or a generic CRUD tool. It is an:
$$\mathbf{Evidence + Monitoring + Intervention + Verification + Eligibility\ Platform}$$

* **AI Explains, Never Decides**: Google Gemini drafts natural-language diagnostics and remedial plans; deterministic algorithms evaluate rules, and authorized humans make all institutional decisions.
* **Integrity vs. Authenticity**: Cryptographic SHA-256 hashing guarantees **file integrity** (bit-level tamper prevention). Institutional faculty sign-off validates **authenticity**.

---

## 🌟 Key Platform Innovations

| Innovation | Technical Implementation | Impact |
| :--- | :--- | :--- |
| **Deterministic Career Readiness Scorecard** | $\text{Score} = (A \times 0.30) + (S \times 0.30) + (I \times 0.20) + (E \times 0.20)$ | 100% explainable student gauge displaying the exact formula. Zero opaque AI scoring. |
| **Deterministic Skill-Gap Rule Engine** | `RULE_GAP_01`: Evaluates consecutive score drops + active backlogs ($S_t < S_{t-1} < S_{t-2} \land \text{Backlogs} > 0$) | Catches declining competencies early in Year 2/3 instead of final-year placement season. |
| **Assistive AI Diagnostic Layer** | Google Gemini API integration with versioned prompt templates and zero-crash deterministic fallback | Contextualizes root causes for faculty mentors without platform failure risks if external APIs stall. |
| **Closed-Loop Faculty Mentoring** | State machine: `SCHEDULED` $\rightarrow$ `IN_REVIEW` $\rightarrow$ `COMPLETED` / `RESOLVED` | Automated resolution hook flips skill gaps to `RESOLVED` when re-assessment score $\ge 75\%$. |
| **Dual-Layer SHA-256 Evidence Vault** | Client-side Web Crypto API + Server-side Node.js `crypto` with Supabase Storage tenant isolation | 10MB limit, strict MIME filtering (PDF, PNG, JPEG), and instant tamper warnings on single-byte mutations. |
| **Deterministic AST Placement Engine** | Pure functional recursive AST tree evaluator with boolean `AND`/`OR` nesting | Real-time candidate evaluation comparing actual vs. required values with itemized `[PASS]` and `[FAIL]` tags. |
| **Portable Career Passport** | Official Northstar Institute transcript with certified ledger, verified skills, and 64-char SHA-256 hash | Replaces unverified paper resumes with a tamper-evident dossier formatted for web and `@media print` PDF export. |
| **Department Analytics Hub** | Cohort skill heatmap matrix (S3–S6 vs Core Skills), intervention velocity, and placement histograms | Gives Department Heads (HODs) macro-level visibility into academic and employability health. |
| **Super Admin Platform Governance** | Unlinked security portal (`/super-admin-pragati01`) with SMTP 2FA, tenant provisioning, and soft-delete recovery pool | Enables platform owners to manage institutions, monitor tenant health, and execute emergency lockouts. |
| **Production Transactional SMTP** | Direct TLS/STARTTLS SMTP dispatcher for 2FA OTP codes, credential welcome emails, and first-login password resets | Delivers institutional emails via Gmail App Passwords or enterprise SMTP with in-memory fallback. |

---

## 👥 5-Role Institutional RBAC Matrix

PRAGATI enforces strict, server-side Role-Based Access Control (RBAC) via tRPC middleware and Supabase Row Level Security (RLS) across 26 PostgreSQL tables:

```text
                  ┌─────────────────────────────────────────┐
                  │            SUPER ADMIN PORTAL           │
                  │   Multi-Tenant Governance, 2FA, Lockout │
                  └────────────────────┬────────────────────┘
                                       │
                  ┌────────────────────▼────────────────────┐
                  │            INSTITUTION ADMIN            │
                  │   Users, Depts, Master Taxonomy, Audit  │
                  └────────────────────┬────────────────────┘
                                       │
            ┌──────────────────────────┼──────────────────────────┐
            │                          │                          │
            ▼                          ▼                          ▼
┌───────────────────────┐  ┌───────────────────────┐  ┌───────────────────────┐
│          HOD          │  │    T&P COORDINATOR    │  │    FACULTY / MENTOR   │
│ Cohort Skill Heatmaps │  │ Drives, AST Rules &   │  │ Ward Roster, Gaps,    │
│ Intervention Velocity │  │ Candidate Pipelines   │  │ Verification Desk     │
└───────────────────────┘  └───────────────────────┘  └───────────┬───────────┘
                                                                  │
                                                                  ▼
                                                      ┌───────────────────────┐
                                                      │        STUDENT        │
                                                      │ Portfolio, Evidence,  │
                                                      │ Career Passport, Apps │
                                                      └───────────────────────┘
```

### Role Permissions & Governance

* **Student (`STUDENT`)**:
  * *Access*: Personal dashboard, semester GPA/CGPA ledger, continuous assessments, milestone evidence submission, transparent drive eligibility, 1-click apply, Career Passport export.
  * *Anti-IDOR Guard*: Server derives student profile strictly from validated JWT session context (`ctx.user.studentProfile.id`). Spoofed client IDs are rejected.
* **Faculty Mentor (`FACULTY`)**:
  * *Access*: Assigned ward roster (`Teacher-Guardian` scope), view skill-gap alerts, create and log mentoring sessions, review internship evidence, approve with `INSTITUTION_VERIFIED`.
  * *Forbidden*: Cannot modify academic marks, cannot self-assign unassigned cohorts.
* **Department Head (`HOD`)**:
  * *Access*: Department-wide analytics, semester-wise skill heatmaps (S3–S6), faculty intervention velocity, placement distribution histograms.
* **Training & Placement Officer (`TNP_COORDINATOR` / `ADMIN`)**:
  * *Access*: Create and publish recruitment drives, build multi-variable AST rules (CGPA, backlogs, skills, verified internships), run candidate roster evaluations, manage applicant pipelines.
* **System Administrator (`ADMIN`)**:
  * *Access*: Manage institutions, user accounts, departments, master skill taxonomy, system health, and immutable audit logs.
* **Super Admin / Platform Owner (`SUPER_ADMIN`)**:
  * *Access*: `/super-admin-pragati01` portal, multi-institution tenant provisioning, soft-delete recovery pool (30-day lifecycle), tenant suspension/lockout, platform-wide metrics.

---

## 🏗️ System Architecture & Technology Stack

PRAGATI separates client presentation from backend domain engines into a clean decoupled monorepo:

```text
d:\Project\Pragati\
├── backend/                  # Express + tRPC v11 + Drizzle ORM + Supabase PostgreSQL
│   ├── src/
│   │   ├── _core/            # Supabase admin client, context, auth, storage, tRPC setup
│   │   ├── db.ts             # PostgreSQL client connection via postgres.js & Drizzle ORM
│   │   ├── routers/          # tRPC API routers (auth, student, faculty, superAdmin, etc.)
│   │   ├── rules/            # Deterministic engines (skillGapEngine, eligibilityEngine)
│   │   └── services/         # Domain services (email, 2fa, dashboard, internship, audit, ai)
│   ├── drizzle/              # PostgreSQL schema (26 tables), migrations & RLS policies
│   ├── scripts/              # Idempotent database seed fixtures (seed.ts)
│   └── tests/                # 15 Vitest automated test suites (150 passing tests)
├── frontend/                 # React 19 + Vite + Tailwind CSS v4 + Radix UI
│   ├── client/src/
│   │   ├── components/       # UI library, PersonaSwitcher, ProtectedRoute, modals
│   │   ├── contexts/         # AuthContext with 1-click persona switching, ThemeContext
│   │   └── pages/            # Home, FacultyWards, CareerPassport, SuperAdminPortal, etc.
│   └── server/               # Full-stack dev runtime & client tRPC proxies
├── specs/                    # 15 Independent Phase-Wise Technical Specifications
├── deploy.md                 # Production deployment manual for Vercel, Render & Supabase
└── README.md                 # Project documentation & reference
```

### Core Technologies

* **Backend Engine**: Node.js 20+, Express.js, tRPC v11 (end-to-end type-safe RPCs), Drizzle ORM.
* **Database & Cloud Storage**: Supabase PostgreSQL (26 tables with foreign keys and RLS policies), Supabase Auth, Supabase Storage (`evidence-vault` bucket).
* **Frontend Application**: React 19, Vite, TypeScript 5.7, Tailwind CSS v4, Radix UI primitives, Lucide React icons, Sonner notifications, Wouter routing.
* **Deterministic Rule Engines**: Pure functional AST tree walkers evaluating boolean corporate criteria with zero opaque machine learning.
* **Assistive AI**: Google Gemini API with system prompt versioning and zero-crash deterministic fallback.
* **Transactional Email**: Native Node.js SMTP service supporting TLS (port 465) and STARTTLS (port 587) with RFC 2822 compliance.
* **Automated Testing**: Vitest 3.0+ running 15 backend test suites (**150 tests, 100% passing**) and frontend suites.

---

## 🗄️ Relational Database Schema (26 Tables)

All tables are defined in [`backend/drizzle/schema.ts`](backend/drizzle/schema.ts) with strict foreign key constraints and Row Level Security:

| Category | Tables | Primary Responsibilities |
| :--- | :--- | :--- |
| **Core Master Data** | `institutions`, `departments`, `users` | Multi-tenant college config, departments, 5-role user credentials |
| **Student Profiles & Academics** | `student_profiles`, `academic_records`, `subjects`, `subject_results`, `backlogs` | Bio, semester SGPA/CGPA progression, course enrollments, active backlogs |
| **Skills & Continuous Assessments** | `skills`, `assessments`, `assessment_submissions`, `skill_history` | Recognized skill taxonomy, continuous assessments, immutable score progressions |
| **Evidence & Cryptographic Vault** | `achievements`, `evidence_documents`, `verifications` | Uploaded certificates, dual-layer SHA-256 hashes, faculty review trails |
| **Skill Gaps & Closed-Loop Mentoring** | `skill_gaps`, `interventions` | `RULE_GAP_01` flags, faculty mentoring sessions, resolution status |
| **Smart Internship Lifecycle** | `internships`, `internship_evidence`, `internship_checkins` | 4-milestone completeness tracking, bi-weekly check-ins, faculty verification |
| **Placement Drives & AST Eligibility** | `recruitment_drives`, `placement_rules`, `eligibility_evaluations`, `applications` | Corporate recruitment drives, JSON rule AST trees, evaluations, 1-click apps |
| **Audit & System Communication** | `notifications`, `audit_logs` | Real-time in-app alerts, immutable security & compliance ledger |

---

## 🎬 12-Scene Hackathon Hero Demo Flow

The definitive 5–7 minute walkthrough follows student **Rahul Sharma (Year 3 CSE)** from skill gap to verified career placement:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ SCENE 01: Student Dashboard Overview                                                   │
│ Rahul logs into /dashboard. Views 4-pillar readiness score (76%) & transparent formula. │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ SCENE 02: Deterministic Skill-Gap Trigger                                              │
│ RULE_GAP_01 flags OS decline (78 -> 70 -> 61) with active backlog in CS401.            │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ SCENE 03: Assistive AI Explanation                                                     │
│ Google Gemini explains root causes & recommends faculty mentoring. Human remains in control. │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ SCENE 04: Faculty Mentoring Session Creation                                           │
│ Dr. Anand Verma views ward roster (/faculty/wards) and schedules remedial mentoring.   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ SCENE 05: Progress Measurement & Gap Resolution                                        │
│ Rahul re-assesses on /skills (61 -> 78). Score >= 75% auto-resolves gap to RESOLVED.   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ SCENE 06: Internship Lifecycle & Milestones                                            │
│ Rahul submits TechCorp completion certificate. Evidence completeness updates to 100%. │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ SCENE 07: Cryptographic SHA-256 Tamper Demo                                            │
│ Valid PDF matches recorded hash. Altering 1 byte triggers instant [TAMPER DETECTED] alert. │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ SCENE 08: Faculty Institutional Verification                                           │
│ Dr. Verma inspects certificate and signs off: status becomes INSTITUTION_VERIFIED.     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ SCENE 09: T&P Placement Rule Builder                                                   │
│ Prof. Sunita Rao inspects ABC Tech drive AST: CGPA >= 7.5, Backlogs = 0, DSA >= 70.     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ SCENE 10: Deterministic Candidate Eligibility Run                                      │
│ Roster evaluated: Rahul is ELIGIBLE (all 5 PASS). Peer Priya is DISQUALIFIED (DSA 62 < 70). │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ SCENE 11: 1-Click Transparent Application                                              │
│ Rahul inspects green checkmarks on /opportunities and applies. Duplicate call rejected.│
├────────────────────────────────────────────────────────────────────────────────────────┤
│ SCENE 12: Verifiable Portable Career Passport                                          │
│ Rahul exports Career Passport on /career-passport with NIT Seal and 64-char SHA-256 hash.│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
* **Node.js**: v20.x or higher
* **npm**: v10.x or higher
* **Supabase Project**: Active Supabase project with PostgreSQL database and Storage bucket

### 2. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/Mr-OmKshirsagar/Pragati.git
cd Pragati

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Configuration

#### Backend Configuration (`backend/.env`)
Create `backend/.env` based on `backend/.env.example`:

```env
PORT=3001
NODE_ENV=development

# Supabase PostgreSQL Connection Pooler
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres

# Supabase Project Credentials
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]
SUPABASE_STORAGE_BUCKET=evidence-vault

# Super Admin Platform Governance
SUPER_ADMIN_EMAIL=platform-owner@northstar.edu
SUPER_ADMIN_PASSWORD=replace-with-a-long-random-password
SUPER_ADMIN_MASTER_KEY=pragati_master_secret_super_admin_key_2026

# SMTP Transactional Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM=your-email@gmail.com
EMAIL_FROM=PRAGATI Platform

# Google Gemini API (Assistive AI Diagnostics)
GEMINI_API_KEY=[YOUR-GEMINI-KEY]
GEMINI_MODEL=gemini-1.5-flash

# CORS Whitelist (Comma-separated)
FRONTEND_URL=http://localhost:3000,https://pragati-1.vercel.app
VITE_APP_URL=http://localhost:3000
```

#### Frontend Configuration (`frontend/.env`)
Create `frontend/.env` based on `frontend/.env.example`:

```env
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=https://[PROJECT-REF].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
VITE_APP_URL=http://localhost:3000
```

### 4. Database Schema Push & Seed Fixtures

```bash
cd backend

# Push schema directly to Supabase PostgreSQL
npm run db:push

# Populate institutional master data and hero student journey
npm run seed
```

### 5. Start Development Servers

Open two terminal windows:

```bash
# Terminal 1: Backend Server (Express + tRPC)
cd backend
npm run dev

# Terminal 2: Frontend Server (Vite + React 19)
cd frontend
npm run dev
```

* **Frontend UI**: [http://localhost:3000](http://localhost:3000)
* **Backend API / Health**: [http://localhost:3001/health](http://localhost:3001/health)

---

## 🔑 Demo Personas (Floating Fast Switcher)

The application includes an interactive floating **Persona Switcher** in the bottom-right corner of every page for seamless live evaluation:

| Role | Name | Email | Password | Primary Demo Screen |
| :--- | :--- | :--- | :--- | :--- |
| **STUDENT** | Rahul Sharma | `student@northstar.edu` | `password123` | `/dashboard`, `/career-passport`, `/opportunities` |
| **FACULTY** | Dr. Anand Verma | `faculty@northstar.edu` | `password123` | `/faculty`, `/faculty/wards`, `/internship` |
| **HOD** | Prof. Sunita Rao | `hod.cse@northstar.edu` | `password123` | `/hod` (Cohort Heatmaps & Velocity) |
| **ADMIN** | Platform Administrator | `admin@northstar.edu` | `password123` | `/admin/overview`, `/admin/users`, `/admin/placement` |
| **SUPER ADMIN** | Platform Owner | *Configured via `.env`* | *Configured via `.env`* | `/super-admin-pragati01` (Protected by 2FA) |

---

## 🧪 Automated Testing & Security Verification

PRAGATI includes an extensive automated test suite with **15 backend suites (150 passing tests)**:

```bash
# Run all backend Vitest suites
cd backend
npm test

# Run frontend test suite
cd ../frontend
npm test

# Run strict TypeScript type checks across both workspaces
cd ../backend && npm run check
cd ../frontend && npm run check
```

### Test Coverage Breakdown

```
Test Files  15 passed (15)
     Tests  150 passed (150)
  Duration  25.93s

✓ tests/phase-00.test.ts          - Foundation architecture & health endpoint (4 tests)
✓ tests/phase-01.test.ts          - Schema definition, 26 tables & RLS policies (6 tests)
✓ tests/auth_rbac.test.ts         - 5-Role RBAC, zero-IDOR, tenant boundaries (10 tests)
✓ tests/phase-03.test.ts          - Student profile, academics, continuous assessments (6 tests)
✓ tests/phase-04.test.ts          - RULE_GAP_01 deterministic engine & Gemini fallback (12 tests)
✓ tests/phase-05.test.ts          - Faculty ward roster & closed-loop interventions (7 tests)
✓ tests/phase-06.test.ts          - Evidence vault, dual-layer SHA-256, tamper demo (11 tests)
✓ tests/phase-07.test.ts          - Smart internship lifecycle & faculty verification (19 tests)
✓ tests/phase-08.test.ts          - AST placement rule builder & eligibility engine (17 tests)
✓ tests/phase-09.test.ts          - Recruitment drives, 1-click apps, candidate pipeline (13 tests)
✓ tests/phase-10.test.ts          - Readiness formula, Career Passport, HOD heatmaps (8 tests)
✓ tests/phase-11.test.ts          - Security hardening, immutable audit logs, SQL injection (9 tests)
✓ tests/evidence_hashing.test.ts  - SHA-256 avalanche effect & file policy enforcement (8 tests)
✓ tests/eligibility_engine.test.ts- AST boolean evaluation pass/fail diagnostics (8 tests)
✓ tests/phase-12.test.ts          - Full 12-scene contiguous hero demo validation (12 tests)
```

---

## 🚢 Deployment Architecture

PRAGATI is architected to run across modern edge and container clouds:

* **Frontend**: Hosted on [Vercel](https://vercel.com) Edge CDN with SPA client-side rewrite rules via `frontend/vercel.json`.
* **Backend**: Hosted on [Render](https://render.com) as a Node.js Web Service running `node dist/src/index.js` with active health monitoring at `/health`.
* **Database & Storage**: Powered by [Supabase](https://supabase.com) with AWS PostgreSQL pooling and S3-compatible private evidence storage.

For complete, step-by-step production setup, CORS configuration, and environment secrets management, refer to the [Production Deployment Guide](deploy.md).

---

## ⚖️ License & Acknowledgments

Developed under **Problem Statement ED-06: Smart Internship Management and Monitoring System**.  
All rights reserved © 2026 PRAGATI Platform Team.
