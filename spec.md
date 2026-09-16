# Spec Driven Development
## Building PRAGATI: Smart Student Internship & Career Management Platform with SDD

---

## Table of Contents
1. [Introduction](#introduction)
   - [What Spec Driven Development Means](#what-spec-driven-development-means)
   - [Why SDD Matters](#why-sdd-matters)
   - [What We Are Going to Build Today](#what-we-are-going-to-build-today)
   - [The Parameters of a Good Specification](#the-parameters-of-a-good-specification)
2. [Complete Specification](#complete-specification)
   - [Project Overview & Tech Stack](#project-overview--tech-stack)
   - [Authentication, RBAC, and Institutional Hierarchy](#authentication-rbac-and-institutional-hierarchy)
   - [Core Domain Engines](#core-domain-engines)
   - [Integrations, Storage, and Real-Time Layer](#integrations-storage-and-real-time-layer)
   - [Frontend Pages & UI Architecture](#frontend-pages--ui-architecture)
   - [Backend Architecture & Supabase Database Tables](#backend-architecture--supabase-database-tables)
   - [API & tRPC Contracts](#api--trpc-contracts)
   - [Folder Structure & Development Phases](#folder-structure--development-phases)
   - [UI, Security, Outcome, and Coding Agent Instructions](#ui-security-outcome-and-coding-agent-instructions)
3. [Where Each Specification Parameter Shows Up](#where-each-specification-parameter-shows-up)
4. [Setting Up Codex Chat, GitHub Copilot, or Antigravity in VS Code](#setting-up-codex-chat-github-copilot-or-antigravity-in-vs-code)
5. [How to Properly Write Specs for AI Coding Agents](#how-to-properly-write-specs-for-ai-coding-agents)
6. [How to Build the Project Using the Specification](#how-to-build-the-project-using-the-specification)
7. [Why a Single Spec Is Not Enough](#why-a-single-spec-is-not-enough)
8. [Closing Thought](#closing-thought)

---

## Introduction

### What Spec Driven Development Means
Spec Driven Development, often shortened to **SDD**, is a development methodology where the comprehensive technical specification is written, audited, and locked down before a single line of production code is produced. The governing principle is simple: **Specification first, Code second.**

In traditional software development, developers frequently open an editor and start coding from vague sketches or fragmented Jira tickets. In SDD, the engineering team pauses before implementation to write an authoritative, single source of truth that covers:
- Core product mission and anti-goals
- Non-negotiable technical constraints
- Exact technology stack and database engine (here, **Supabase PostgreSQL**)
- Server-side Role-Based Access Control (RBAC) and Row Level Security (RLS) policies
- Complete database schema definitions, relations, constraints, and indexes
- Mathematical formulas and algorithmic pseudocode for domain engines
- Detailed API endpoints and tRPC procedure contracts
- Precise folder structures and sequential delivery checkpoints
- Formal verification criteria and hackathon demonstration flows

Once this specification is established, implementation becomes a deterministic translation from the spec into verified code. Whenever an AI coding agent or human engineer is unsure of an implementation detail, they return to the specification rather than guessing or hallucinating libraries, endpoints, or data models.

### Why SDD Matters
SDD matters most when collaborating with AI coding agents (such as Antigravity, GitHub Copilot, or Codex). A vague prompt produces vague, fragile code. If an agent is told simply to "build an internship management portal," it will invent ad-hoc database schemas, mock security permissions on the client, pick conflicting ORMs, omit foreign key constraints, and hallucinate endpoints that don't match frontend state.

A rigorous specification eliminates this ambiguity. The coding agent operates under an immutable contract. It cannot swap database engines, cannot invent arbitrary routes, cannot bypass server-side authorization checks, and cannot pretend that a feature works using hardcoded frontend values.

For **PRAGATI**—a mission-critical institutional platform combining academic tracking, continuous skill assessment, deterministic skill-gap detection, faculty closed-loop mentoring, cryptographic document integrity verification, deterministic placement eligibility, and assistive AI explanations—SDD is the only discipline that guarantees system integrity and auditability.

### What We Are Going to Build Today
Today we are building **PRAGATI: Smart Student Internship & Career Management Platform**, developed specifically under **Problem Statement ED-06: Smart Internship Management and Monitoring System**.

PRAGATI bridges the chronic institutional divide between foundation academic performance, continuous skill development, faculty mentorship, verified internships, and placement recruitment drives:

```text
Student Data 
  → Academic Performance 
  → Skill Assessments 
  → Deterministic Skill-Gap Detection 
  → Faculty Mentoring Intervention 
  → Progress Measurement 
  → Internship Evidence Collection 
  → Cryptographic & Institutional Verification 
  → Configurable Placement Criteria 
  → Transparent Eligibility Evaluation 
  → Recruitment Drives 
  → Portable Career Passport
```

PRAGATI is governed by one foundational axiom:
$$\mathbf{Evidence + Monitoring + Intervention + Verification + Eligibility\ Platform}$$

Rather than waiting until the final-year placement scramble, PRAGATI establishes a continuous, auditable record. Crucially:
1. **Rule Engines decide deterministically**: Placement eligibility and skill gaps are calculated by transparent, deterministic Boolean rules.
2. **AI explains and drafts**: AI summarizes root causes and drafts mentoring plans. AI **never** unilaterally grades, rejects, or approves students.
3. **Cryptographic SHA-256 hashing**: Files uploaded to **Supabase Storage** receive client- and server-side SHA-256 integrity hashes to prove file bytes have not been tampered with since upload.
4. **Supabase PostgreSQL is the primary source of truth**: Every operation enforces multi-tenant institutional isolation and Row Level Security (RLS).

### The Parameters of a Good Specification
An authoritative SDD document must meet seven explicit quality criteria:
- **Clarity**: Unambiguous, single-meaning sentences. No vague phrases like *"etc."*, *"and so on"*, or *"as appropriate"*.
- **Completeness**: Data models, endpoints, schemas, UI pages, security matrices, and edge cases are documented explicitly.
- **Consistency**: Entity names, table columns, and status enums match 1-to-1 between client, server, and Supabase migrations.
- **Concrete Technology Choices**: Explicit versions and libraries are locked down (e.g., Supabase PostgreSQL, React 19, Vite, Tailwind CSS v4, tRPC/Express, Drizzle ORM).
- **Structured Sections**: Clean headings and reference tables for automated indexing and rapid agent parsing.
- **Phased Delivery**: Incremental, testable milestones where each phase yields a functional, verified code surface.
- **Authoritative Tone**: Direct prescriptive keywords (**MUST**, **MUST NOT**, **SHALL**, **REQUIRED**) replacing soft recommendations.

---

## Complete Specification

### Project Overview & Tech Stack

#### Project Overview
Build a high-reliability, full-stack institutional platform called **PRAGATI** that allows universities and colleges to digitally manage and monitor the complete student career readiness journey. The platform must centralize academic history, record continuous skill assessment attempts, flag skill drops via deterministic rules, enable faculty guardians to conduct closed-loop interventions, collect multi-milestone internship evidence in Supabase Storage with SHA-256 tamper detection, evaluate student eligibility for recruitment drives with clear mathematical explanations, and export a verified, tamper-evident Career Passport.

#### Tech Stack
- **Database**: **Supabase** (Managed PostgreSQL 15+, Supabase Auth, Row Level Security, Supabase Storage, and Supabase Realtime).
- **ORM & Migrations**: `drizzle-orm` with `postgres` driver (`drizzle-kit` for schema migrations) and `@supabase/supabase-js` for storage and realtime client operations.
- **Backend**: Node.js (v20+), Express, tRPC (`@trpc/server`), Zod (`zod` v3.24+) for runtime schema validation, `crypto` for SHA-256 calculation, and `dotenv`.
- **Frontend**: React 19, Vite, Tailwind CSS v4, Wouter for declarative routing, `@tanstack/react-query` v5, `@trpc/client`, Radix UI primitives, `lucide-react` icons, and `recharts` for explainable data visualization.
- **AI Assistive Layer**: Google Generative AI SDK (`@google/genai` or Gemini 1.5/2.0 API) with strict prompt versioning and a deterministic fallback template when offline.
- **Security & Integrity**: Web Crypto API / Node `crypto` for SHA-256 checksums, Supabase RLS policies for tenant data isolation, server-side RBAC middleware, and parameterized SQL queries.

---

### Authentication, RBAC, and Institutional Hierarchy

#### The 5 Institutional Personas
PRAGATI enforces strict, server-side Role-Based Access Control (RBAC) across five distinct roles:

```text
                  +-----------------------------------+
                  |         INSTITUTION ADMIN         |
                  |  Users, Depts, Skills, Audit Logs |
                  +-----------------+-----------------+
                                    |
          +-------------------------+-------------------------+
          |                         |                         |
          v                         v                         v
+-------------------+     +-------------------+     +-------------------+
|        HOD        |     |  T&P COORDINATOR  |     | FACULTY / MENTOR  |
| Dept Analytics &  |     | Drives, Rules &   |     | Interventions &   |
| Skill Heatmaps    |     | Eligibility Engine|     | Evidence Review   |
+-------------------+     +-------------------+     +---------+---------+
                                                              |
                                                              v
                                                    +-------------------+
                                                    |      STUDENT      |
                                                    | Portfolio, Proof, |
                                                    | Career Passport   |
+---------------------------------------------------+-------------------+
```

#### RBAC Permissions Matrix

| Resource / Capability | STUDENT | FACULTY | HOD | TNP_COORDINATOR | ADMIN |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Own Profile & Academics** | Read-Only | Read (Wards) | Read (Dept) | Read (All) | Read / Write |
| **Take Assessments** | Execute | None | None | None | None |
| **Submit Achievements & Evidence** | Create / Edit | Read | Read | Read | Read |
| **View Skill-Gap Flags** | Read (Own) | Read (Wards) | Read (Dept) | Read (Aggregated) | Read (All) |
| **Create / Manage Interventions** | None | Create / Update | Review | None | Audit |
| **Review / Verify Evidence** | None | Review / Sign-off | Review | None | Audit |
| **Create Recruitment Drives** | None | None | None | Create / Edit | Manage |
| **Build Placement Rules & Run Eligibility** | None | None | None | Execute | Manage |
| **Apply to Published Drives** | Apply (If Eligible) | None | None | None | None |
| **View Eligibility Reasons** | Read (Own) | Read (Wards) | Read (Dept) | Read (All) | Read (All) |
| **Manage Users & Departments** | None | None | None | None | Full Access |
| **Inspect System Audit Logs** | None | None | Read (Dept) | Read (Drives) | Full Access |

#### Non-Negotiable Authorization Directives
1. **Never trust client-supplied IDs**: A request payload specifying `{ "student_id": "uuid-xyz" }` from a user logged in as `STUDENT` must be rejected or overridden with `ctx.user.student_id`. Authenticated $\ne$ Authorized.
2. **Database Row Level Security (RLS)**: Supabase RLS policies act as the ultimate security boundary. Even if a backend bug omits an authorization check, PostgreSQL blocks cross-tenant or cross-student reads/writes.
3. **Institutional Multi-Tenancy**: Every resource (`students`, `academics`, `internships`, `drives`) carries an `institution_id` foreign key. Cross-institution access is physically prevented.

---

### Core Domain Engines

#### 1. Deterministic Skill-Gap Rule Engine
Skill-gap detection is **strictly algorithmic**. The system monitors the student's historical assessment scores and academic backlog status.

**Rule: Consecutive Performance Decline with Active Backlog (`RULE_GAP_01`)**:
```text
IF:
  1. Student has >= 2 consecutive assessment score drops in Skill S:
     Score(T-2) > Score(T-1) > Score(T)
  AND
  2. Student has Active Backlogs > 0 in any associated subject:
THEN:
  Create SkillGap record:
    - severity: HIGH
    - status: OPEN
    - trigger_data: { skill: S, score_history: [T-2, T-1, T], backlogs: count }
    - reason: "Score dropped consecutively from X to Y to Z while 1 active backlog remains open."
```

#### 2. Closed-Loop Mentoring & Intervention Engine
Mentoring is an auditable state machine that guarantees accountability:
```text
[OPEN GAP] 
    │
    ▼ Faculty notified via Supabase Realtime
[ASSIGNED TO FACULTY MENTOR] 
    │
    ▼ Mentor creates structured intervention plan (sessions, remedial material)
[IN_PROGRESS INTERVENTION] 
    │
    ▼ Student undergoes remediation & re-assesses in Skill S
[RE-ASSESSMENT EVALUATION]
    ├── IF Score(New) >= Target_Threshold:
    │       Status → RESOLVED (Outcome recorded, closed-loop verified)
    └── IF Score(New) < Target_Threshold:
            Status → REOPENED / ESCALATED (Additional action mandated)
```

#### 3. Cryptographic Evidence Integrity (SHA-256)
Every uploaded document (internship offer letter, completion certificate, milestone check-in, skill certificate) must preserve cryptographic proof of file integrity.

```text
Upload File (PDF / PNG)
  │
  ├── 1. Client computes SHA-256 hash using Web Crypto API
  ├── 2. Upload file to Supabase Storage bucket 'evidence-vault'
  ├── 3. Backend verifies SHA-256 hash from buffer
  ├── 4. Store metadata in PostgreSQL 'evidence_documents':
  │       - storage_path
  │       - sha256_hash (64 hex characters)
  │       - verification_status: 'SELF_REPORTED'
  └── 5. Verification Lifecycle:
          ├── SELF_REPORTED        (Initial student upload)
          ├── PENDING              (Under faculty queue review)
          ├── INSTITUTION_VERIFIED (Faculty signed off on evidence)
          ├── ISSUER_VERIFIED      (Directly confirmed by issuer API)
          └── REJECTED             (Invalid / insufficient documentation)
```

> **The Cryptographic Integrity Rule**:
> SHA-256 proves **file integrity** (the file has not been altered since the moment of upload). It does **not** prove issuer authenticity. PRAGATI never misleads stakeholders by claiming that a hash proves a certificate is genuine; genuineness requires institutional review.

#### 4. Deterministic Placement Eligibility Engine
T&P Coordinators define recruitment drive eligibility using a structured JSON Abstract Syntax Tree (AST). The evaluation engine is 100% deterministic and emits an itemized audit explanation for every evaluated student:

```json
{
  "operator": "AND",
  "conditions": [
    { "field": "cgpa", "operator": ">=", "value": 7.5 },
    { "field": "active_backlogs", "operator": "=", "value": 0 },
    { "field": "skill.DSA", "operator": ">=", "value": 70 },
    { "field": "skill.Python", "operator": ">=", "value": 65 },
    { "field": "internship_status", "operator": "=", "value": "COMPLETED" }
  ]
}
```

**Evaluation Output Model**:
```json
{
  "student_id": "uuid-rahul-sharma",
  "drive_id": "uuid-abc-tech",
  "eligible": true,
  "reasons": [
    "CGPA 8.42 >= 7.50 [PASS]",
    "Active backlogs 0 = 0 [PASS]",
    "DSA assessment score 78 >= 70 [PASS]",
    "Python assessment score 84 >= 65 [PASS]",
    "Internship status COMPLETED [PASS]"
  ]
}
```
If a student fails a condition (e.g., DSA score 62 is below required 70), the engine marks `eligible: false` and explicitly highlights the exact failing criterion.

#### 5. Assistive AI Explanation Layer
AI is an assistive narrative layer, never an autonomous decision-maker:
- **Allowed**: Summarizing student progress, translating skill-gap drops into natural-language mentor briefings, and drafting recommended study resources.
- **Strictly Prohibited**: Ranking students, rejecting applications, verifying credentials, or mutating academic grades.
- **Graceful Fallback**: If the LLM API is rate-limited or unreachable, the system displays deterministic rule-based strings without interruption.

---

### Integrations, Storage, and Real-Time Layer

1. **Supabase Storage (`evidence-vault`)**:
   - Private bucket with authenticated RLS.
   - Max file size: 10 MB.
   - Allowed MIME types: `application/pdf`, `image/png`, `image/jpeg`.
   - File path convention: `{institution_id}/{student_id}/{document_type}/{uuid}-{filename}`.
2. **Supabase Realtime**:
   - Broadcast and Postgres CDC subscriptions for live alerts.
   - Channels:
     - `student:{id}:notifications` — instant skill-gap alerts and drive openings.
     - `faculty:{id}:interventions` — assigned student flags.
     - `tnp:drives` — live application submissions.
3. **AI Provider (Google Gemini API / OpenRouter)**:
   - Primary: Gemini 1.5/2.0 Flash SDK (`@google/genai`).
   - Standard Prompt Versions: `SKILL_GAP_EXPLAIN_V1`, `MENTOR_BRIEF_V1`.

---

### Frontend Pages & UI Architecture

The frontend follows an institutional, high-contrast, data-dense design system built with React 19, Tailwind CSS v4, and Radix UI:

| Route | View Name | Primary Persona | Capabilities & Components |
| :--- | :--- | :--- | :--- |
| `/` | **Landing / Redirection** | Public / All | Institutional welcome, mission statement, role selector / redirection to dashboard. |
| `/login` | **Institutional Auth** | All | Role-aware email/password login, Supabase session issuance, error banners. |
| `/dashboard` | **Student Overview** | Student | Readiness Scorecard (4 indicators), Quick Metric cards, Skill Profile radar/series, Active Gap banner, Internship status preview. |
| `/academics` | **Academic Records** | Student / Faculty | Semester SGPA/CGPA progression, subject results table, backlog audit ledger. |
| `/skills` | **Skill Progression** | Student / Faculty | Skill taxonomy cards, historical assessment trajectories, take-assessment modal. |
| `/assessments` | **Assessment Center** | Student | Timed quiz/coding assessments, instant submission, immutable score recording. |
| `/achievements`| **Achievements & Proof**| Student | Certifications, hackathons, extracurriculars with verification badges (`SELF_REPORTED` to `VERIFIED`). |
| `/evidence` | **Evidence Vault** | Student / Faculty | Multi-file uploader with live SHA-256 client hashing, document viewer, tamper demonstration panel. |
| `/internships` | **Internship Manager** | Student / Faculty | 4-milestone lifecycle (Offer, Check-ins, Report, Certificate), evidence checklist, faculty review status. |
| `/opportunities`| **Recruitment Drives** | Student | Published company listings, transparent *"Check My Eligibility"* modal with itemized criteria check, 1-click apply. |
| `/career-passport`| **Career Passport** | Student / Public | Verified portable record, academic summary, verified skills, institutional seals, print/export view. |
| `/faculty/wards`| **Faculty Ward Roster**| Faculty / Mentor | Assigned student table, skill-gap alerts (`Needs Attention`), intervention creator dialog. |
| `/faculty/review`| **Evidence Review Desk**| Faculty | Review queue for internship documents, SHA-256 comparison badge, Approve/Reject controls. |
| `/tnp/drives` | **Drive Management** | T&P Officer | Drive creation wizard, AST placement rule builder, bulk eligibility evaluation runner, candidate pipeline. |
| `/hod/analytics`| **Dept Analytics Hub** | HOD | Skill progression heatmap across semesters, faculty mentoring velocity, department placement readiness stats. |
| `/admin/settings`| **Admin Console** | Admin | Institution master settings, department configuration, user roles, audit log viewer. |

---

### Backend Architecture & Supabase Database Tables

#### Database Architecture Principles
- **Relational Integrity**: 26 normalized PostgreSQL tables with foreign keys and cascade rules.
- **UUID Primary Keys**: `gen_random_uuid()` used for all entities to prevent ID enumeration attacks.
- **Row Level Security (RLS)**: Enabled on every table. Users only see records belonging to their institution and role.
- **Auditability**: Critical institutional decisions record timestamps, verifier UUIDs, and immutable change logs.

#### Complete PostgreSQL Schema (Supabase DDL)

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('STUDENT', 'FACULTY', 'HOD', 'TNP_COORDINATOR', 'ADMIN');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
CREATE TYPE verification_status AS ENUM ('SELF_REPORTED', 'PENDING', 'INSTITUTION_VERIFIED', 'ISSUER_VERIFIED', 'REJECTED');
CREATE TYPE gap_severity AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE gap_status AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED', 'REOPENED');
CREATE TYPE intervention_status AS ENUM ('PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE internship_status AS ENUM ('APPLIED', 'OFFERED', 'IN_PROGRESS', 'COMPLETED', 'TERMINATED');
CREATE TYPE evidence_type AS ENUM ('OFFER_LETTER', 'CHECK_IN', 'COMPLETION_CERTIFICATE', 'INTERNSHIP_REPORT', 'SUPERVISOR_CONFIRMATION', 'SKILL_CERTIFICATE');
CREATE TYPE drive_status AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED');
CREATE TYPE application_status AS ENUM ('APPLIED', 'SHORTLISTED', 'INTERVIEWING', 'OFFERED', 'REJECTED');

-- 2. INSTITUTIONS
CREATE TABLE institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code VARCHAR(32) NOT NULL UNIQUE,
    website TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. DEPARTMENTS
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(institution_id, code)
);

-- 4. USERS (Profiles tied to Supabase Auth)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email VARCHAR(320) NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'STUDENT',
    status user_status NOT NULL DEFAULT 'ACTIVE',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. STUDENT PROFILES
CREATE TABLE student_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    assigned_faculty_id UUID REFERENCES users(id) ON DELETE SET NULL,
    enrollment_number VARCHAR(64) NOT NULL UNIQUE,
    program VARCHAR(128) NOT NULL,
    section VARCHAR(32),
    current_semester INT NOT NULL DEFAULT 1,
    admission_year INT NOT NULL,
    graduation_year INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. ACADEMIC RECORDS (Semester GPAs & Cumulative CGPA)
CREATE TABLE academic_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    semester INT NOT NULL,
    academic_year VARCHAR(32) NOT NULL,
    sgpa NUMERIC(4, 2) NOT NULL CHECK (sgpa >= 0.0 AND sgpa <= 10.0),
    cgpa NUMERIC(4, 2) NOT NULL CHECK (cgpa >= 0.0 AND cgpa <= 10.0),
    total_credits INT NOT NULL DEFAULT 20,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, semester)
);

-- 7. SUBJECTS
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    code VARCHAR(32) NOT NULL,
    name TEXT NOT NULL,
    credits INT NOT NULL DEFAULT 3,
    semester INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. SUBJECT RESULTS
CREATE TABLE subject_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    semester INT NOT NULL,
    marks NUMERIC(5, 2) NOT NULL,
    grade VARCHAR(8) NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'PASSED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, subject_id, semester)
);

-- 9. BACKLOGS
CREATE TABLE backlogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    semester INT NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'CLEARED'
    cleared_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. SKILLS TAXONOMY
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(64) NOT NULL UNIQUE,
    category VARCHAR(64) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. ASSESSMENTS
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    skill_ids UUID[] NOT NULL DEFAULT '{}',
    max_score INT NOT NULL DEFAULT 100,
    duration_minutes INT NOT NULL DEFAULT 60,
    status VARCHAR(16) NOT NULL DEFAULT 'PUBLISHED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. ASSESSMENT SUBMISSIONS
CREATE TABLE assessment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    score NUMERIC(5, 2) NOT NULL,
    max_score NUMERIC(5, 2) NOT NULL DEFAULT 100,
    attempt_number INT NOT NULL DEFAULT 1,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. SKILL PROGRESSION HISTORY
CREATE TABLE skill_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL,
    score NUMERIC(5, 2) NOT NULL,
    max_score NUMERIC(5, 2) NOT NULL DEFAULT 100,
    assessment_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. ACHIEVEMENTS
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type VARCHAR(32) NOT NULL,
    issuer TEXT NOT NULL,
    date DATE NOT NULL,
    verification_status verification_status NOT NULL DEFAULT 'SELF_REPORTED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. EVIDENCE DOCUMENTS (Cryptographic Vault)
CREATE TABLE evidence_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE SET NULL,
    filename TEXT NOT NULL,
    storage_bucket VARCHAR(64) NOT NULL DEFAULT 'evidence-vault',
    storage_path TEXT NOT NULL,
    mime_type VARCHAR(64) NOT NULL,
    file_size INT NOT NULL,
    sha256_hash CHAR(64) NOT NULL,
    verification_status verification_status NOT NULL DEFAULT 'SELF_REPORTED',
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. VERIFICATIONS AUDIT
CREATE TABLE verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id UUID NOT NULL REFERENCES evidence_documents(id) ON DELETE CASCADE,
    verifier_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    verification_type VARCHAR(32) NOT NULL DEFAULT 'INSTITUTION',
    status VARCHAR(32) NOT NULL DEFAULT 'VERIFIED',
    notes TEXT,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. SKILL GAPS
CREATE TABLE skill_gaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE RESTRICT,
    rule_id VARCHAR(64) NOT NULL,
    severity gap_severity NOT NULL DEFAULT 'HIGH',
    status gap_status NOT NULL DEFAULT 'OPEN',
    reason JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 18. FACULTY INTERVENTIONS
CREATE TABLE interventions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    skill_gap_id UUID NOT NULL REFERENCES skill_gaps(id) ON DELETE CASCADE,
    assigned_to UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    type VARCHAR(64) NOT NULL DEFAULT 'MENTORING',
    description TEXT NOT NULL,
    status intervention_status NOT NULL DEFAULT 'PENDING',
    start_date DATE,
    end_date DATE,
    outcome TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. INTERNSHIPS
CREATE TABLE internships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    role TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    stipend NUMERIC(10, 2),
    status internship_status NOT NULL DEFAULT 'IN_PROGRESS',
    supervisor_name TEXT,
    supervisor_email VARCHAR(320),
    verification_status verification_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. INTERNSHIP EVIDENCE
CREATE TABLE internship_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    internship_id UUID NOT NULL REFERENCES internships(id) ON DELETE CASCADE,
    evidence_type evidence_type NOT NULL,
    evidence_document_id UUID NOT NULL REFERENCES evidence_documents(id) ON DELETE CASCADE,
    status verification_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. INTERNSHIP CHECKINS
CREATE TABLE internship_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    internship_id UUID NOT NULL REFERENCES internships(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
    summary TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'SUBMITTED',
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 22. RECRUITMENT DRIVES
CREATE TABLE recruitment_drives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    job_title TEXT NOT NULL,
    description TEXT NOT NULL,
    ctc_or_stipend VARCHAR(64),
    application_deadline TIMESTAMPTZ NOT NULL,
    status drive_status NOT NULL DEFAULT 'PUBLISHED',
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 23. PLACEMENT RULES
CREATE TABLE placement_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recruitment_drive_id UUID NOT NULL REFERENCES recruitment_drives(id) ON DELETE CASCADE,
    version INT NOT NULL DEFAULT 1,
    rule_definition JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 24. ELIGIBILITY EVALUATIONS
CREATE TABLE eligibility_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    recruitment_drive_id UUID NOT NULL REFERENCES recruitment_drives(id) ON DELETE CASCADE,
    eligible BOOLEAN NOT NULL,
    reasons JSONB NOT NULL DEFAULT '[]',
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, recruitment_drive_id)
);

-- 25. APPLICATIONS
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    recruitment_drive_id UUID NOT NULL REFERENCES recruitment_drives(id) ON DELETE CASCADE,
    status application_status NOT NULL DEFAULT 'APPLIED',
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, recruitment_drive_id)
);

-- 26. NOTIFICATIONS
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(64) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 27. AUDIT LOGS (Immutable Compliance Ledger)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(64) NOT NULL,
    resource_type VARCHAR(64) NOT NULL,
    resource_id UUID,
    metadata JSONB NOT NULL DEFAULT '{}',
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### Row Level Security (RLS) Policies Sample

```sql
-- Enable RLS on all sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" 
ON users FOR SELECT 
USING (auth.uid() = id);

-- Policy: Students can only view their own profile & academics
CREATE POLICY "Students can view own profile" 
ON student_profiles FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Students can view own academic records" 
ON academic_records FOR SELECT 
USING (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()));

-- Policy: Faculty can view assigned wards
CREATE POLICY "Faculty view assigned student profiles" 
ON student_profiles FOR SELECT 
USING (assigned_faculty_id = auth.uid());

-- Policy: Students can insert their own evidence
CREATE POLICY "Students can upload own evidence" 
ON evidence_documents FOR INSERT 
WITH CHECK (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()));
```

---

### API & tRPC Contracts

PRAGATI exposes type-safe procedures over **tRPC** (`/api/trpc`), supplemented by standard REST routes for file uploads and health probes:

```text
/api/trpc
  ├── auth
  │   ├── me                      (Query: Current User Profile + Session Role)
  │   └── logout                  (Mutation: Clear Session)
  ├── student
  │   ├── dashboard               (Query: Full Student Dashboard shape)
  │   ├── academics               (Query: SGPA/CGPA history, Subjects, Backlogs)
  │   ├── skills                  (Query: Taxonomy, Verified counts, Scores)
  │   ├── submitAssessment        (Mutation: Score submission, triggers gap check)
  │   ├── achievements            (Query & Mutation: Certifications & proof)
  │   ├── internships             (Query & Mutation: Internship records & checkins)
  │   ├── checkEligibility        (Query: Evaluate against Drive ID)
  │   ├── applyDrive              (Mutation: Submit 1-click application)
  │   └── careerPassport          (Query: Consolidated verified dossier)
  ├── faculty
  │   ├── wards                   (Query: Assigned students, CGPA, risk status)
  │   ├── skillGaps               (Query: Open skill-gap alerts)
  │   ├── createIntervention      (Mutation: Log mentoring action)
  │   ├── closeIntervention       (Mutation: Record outcome & resolve gap)
  │   └── verifyEvidence          (Mutation: Review & sign-off on SHA-256 evidence)
  ├── tnp
  │   ├── drives                  (Query: All recruitment drives)
  │   ├── createDrive             (Mutation: Company, role, deadline)
  │   ├── setRules                (Mutation: Define AST placement rules)
  │   ├── evaluateRoster          (Query: Bulk student eligibility calculation)
  │   └── applicants              (Query: Candidate pipeline per drive)
  ├── ai
  │   ├── explainGap              (Query: Generate natural-language mentor brief)
  │   └── draftIntervention       (Query: Recommend remedial plan)
  └── system
      ├── health                  (Query: Heartbeat & Supabase DB connectivity)
      └── auditLogs               (Query: Immutable security log stream)
```

#### Standard API Envelope & Error Codes
Every response guarantees predictable shaping:
```typescript
type ApiResponse<T> = 
  | { success: true; data: T; timestamp: string }
  | { success: false; error: { code: string; message: string; details?: unknown }; timestamp: string };
```

**Standard Error Codes**:
- `UNAUTHORIZED` (401): Missing or expired Supabase JWT.
- `FORBIDDEN` (403): Role lacks authorization to access this institutional scope.
- `IDOR_ATTEMPT` (403): Student attempted to access or modify another student's record.
- `TAMPER_DETECTED` (422): Uploaded file hash does not match computed payload hash.
- `RULE_VIOLATION` (400): Placement criteria or assessment validation failure.
- `NOT_FOUND` (404): Resource does not exist within the tenant institution.

---

### Folder Structure & Development Phases

```text
d:\Project\Pragati\
├── spec.md                          # Master Spec Driven Development Specification
├── specs/                           # Modular Phase-wise SDD Specs
│   ├── README.md                    # Roadmap Index & Dependency Matrix
│   ├── phase-00-architecture-supabase.spec.md
│   ├── phase-01-database-schema-rls.spec.md
│   ├── phase-02-auth-rbac.spec.md
│   ├── phase-03-student-academics-skills.spec.md
│   ├── phase-04-skill-gap-rules-ai.spec.md
│   ├── phase-05-faculty-mentoring-interventions.spec.md
│   ├── phase-06-evidence-sha256-storage.spec.md
│   ├── phase-07-internship-verification.spec.md
│   ├── phase-08-placement-rules-eligibility.spec.md
│   ├── phase-09-recruitment-applications.spec.md
│   ├── phase-10-dashboards-career-passport.spec.md
│   ├── phase-11-security-audit-testing.spec.md
│   └── phase-12-demo-flow-validation.spec.md
├── brain/                           # Architectural rules & design records
├── backend/                         # Dedicated Backend Service (Express + tRPC + Supabase)
│   ├── src/                         # Backend source code
│   │   ├── _core/                   # Server bootstrap, context, Supabase client, storage
│   │   ├── db.ts                    # Supabase Client & PostgreSQL connection
│   │   ├── routers/                 # tRPC root & domain procedure routers
│   │   │   ├── auth.ts              # Session & profile resolution
│   │   │   ├── student.ts           # Student academics, skills, assessments
│   │   │   ├── faculty.ts           # Wards, interventions, mentoring
│   │   │   ├── tnp.ts               # Placement drives, rules, evaluations
│   │   │   ├── evidence.ts          # SHA-256 evidence metadata
│   │   │   └── dashboard.ts         # Multi-role aggregates & Career Passport
│   │   ├── services/                # Pure business logic services
│   │   └── rules/                   # Deterministic engines (Gap & Placement)
│   ├── drizzle/                     # PostgreSQL Migrations & Schema
│   │   ├── schema.ts                # Drizzle ORM PostgreSQL tables
│   │   └── migrations/              # Generated SQL migrations
│   ├── scripts/                     # Seed & maintenance scripts
│   │   └── seed.ts                  # Idempotent master seed fixture
│   ├── tests/                       # Vitest automated test suites
│   ├── drizzle.config.ts            # Drizzle configuration
│   ├── package.json                 # Backend dependencies
│   └── .env                         # Backend environment variables
├── frontend/                        # Dedicated Frontend Client (React 19 + Vite + Tailwind)
│   ├── client/                      # React 19 Frontend SPA
│   │   ├── src/
│   │   │   ├── components/          # Reusable UI & Institutional primitives
│   │   │   ├── contexts/            # Theme & Supabase Auth context
│   │   │   ├── hooks/               # tRPC & state hooks
│   │   │   ├── pages/               # Role-specific views & Dashboards
│   │   │   └── App.tsx              # Wouter routing & layout shells
│   │   └── index.html               # Main HTML entry
│   ├── package.json                 # Frontend dependencies
│   └── vite.config.ts               # Vite configuration
└── shared/                          # Isomorphic TypeScript models & Zod schemas
    └── pragati.ts                   # Complete type definitions
```

---

### UI, Security, Outcome, and Coding Agent Instructions

#### UI & UX Directives
1. **Institutional Dignity**: The visual tone must feel like a modern, serious academic enterprise platform (Northstar Institute of Technology). Avoid playful consumer styling or decorative AI shimmer.
2. **Explainable Visualizations**: Charts (`recharts`) must answer specific operational questions (e.g., *“DSA score dropped from 78 to 61 across 3 cycles”*).
3. **No Fake Data**: Components must strictly render data delivered by backend endpoints. Hardcoded metrics (`const eligible = 67`) are strictly forbidden.
4. **Verification State Badges**: Every student claim must render an explicit badge:
   - `[✓ ISSUER VERIFIED]` (Emerald)
   - `[✓ INSTITUTION VERIFIED]` (Indigo)
   - `[◐ SELF REPORTED]` (Slate)
   - `[! PENDING REVIEW]` (Amber)
   - `[✕ REJECTED]` (Rose)

#### Security & Compliance Mandates
1. **Never Log Passwords or Decrypted Tokens**.
2. **Never Execute Raw Dynamic SQL**: Use Drizzle ORM or parameterized queries.
3. **Enforce SHA-256 Integrity Checks**: Reject files that fail checksum comparison.
4. **IDOR Defense**: All tenant operations must query by authenticated `institution_id` and verified user ownership.

#### Coding Agent Operating Instructions
When executing implementation phases:
1. **Read the corresponding phase spec in `specs/` first**.
2. **Do not modify schemas or endpoints outside the active phase**.
3. **Keep tRPC routers thin**: Move business logic into `/server/services/`.
4. **Verify tests pass before marking a phase complete**.

---

## Where Each Specification Parameter Shows Up
- **Clarity**: Unambiguous rule definitions in [Core Domain Engines](#core-domain-engines) specifying exact arithmetic and state transitions.
- **Completeness**: All 26 tables, columns, constraints, and RLS policies provided in [Backend Architecture & Supabase Database Tables](#backend-architecture--supabase-database-tables).
- **Consistency**: The five roles and five verification states match identically across UI badges, TypeScript types, and PostgreSQL enums.
- **Concrete Technology Choices**: Supabase PostgreSQL, Drizzle ORM, React 19, Vite, Tailwind CSS v4, and tRPC locked down in [Project Overview & Tech Stack](#project-overview--tech-stack).
- **Phased Delivery**: Clean 13-phase roadmap outlined in [Folder Structure & Development Phases](#folder-structure--development-phases) and expanded in the `specs/` directory.

---

## Setting Up Codex Chat, GitHub Copilot, or Antigravity in VS Code
1. Open the project root `d:\Project\Pragati\` in VS Code / Antigravity IDE.
2. Verify that `spec.md` exists at the root and `specs/` contains all phase-wise specs.
3. Reference `#file:spec.md` or `@spec.md` in prompts to anchor the coding agent directly to this specification.
4. Instruct the agent: *"Execute Phase 1 per specs/phase-01-database-schema-rls.spec.md"*.

---

## How to Properly Write Specs for AI Coding Agents
1. **Define Anti-Goals**: Explicitly state what the agent must **not** build (no microservices, no blockchain, no fake mocks).
2. **Provide Concrete Signatures**: Give exact Zod schemas and PostgreSQL column types.
3. **State Invariants**: Declare rules that can never be broken (e.g., *"AI never approves an internship"*).

---

## How to Build the Project Using the Specification
Execute one phase at a time:
```text
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 
  → Phase 6 → Phase 7 → Phase 8 → Phase 9 → Phase 10 → Phase 11 → Phase 12
```
At the conclusion of each phase:
- Run automated tests (`npm run test` / `vitest`).
- Verify database migrations.
- Update `brain/17_PROGRESS.md` with checked boxes only when verified.

---

## Why a Single Spec Is Not Enough
While this master `spec.md` establishes the overall architecture and system contract, a single massive document can overflow agent context windows and blur granular boundaries during active coding. 

Therefore, PRAGATI pairs this master document with **13 dedicated phase specifications** in the [`specs/`](specs/README.md) directory. Each phase spec defines:
- Exact file modifications and additions
- Step-by-step implementation procedures
- TypeScript interfaces and SQL migration scripts
- Verification and test commands
- Strict phase exit criteria

---

## Closing Thought
PRAGATI is not an exercise in speculative architecture. It is an **evidence-first, deterministic, institution-grade platform** designed to provide verifiable career readiness under Problem Statement ED-06. By following Spec Driven Development, every component built is secure, explainable, testable, and directly demonstrable to evaluators.
