# PRAGATI — Smart Student Internship & Career Management Platform

> **From Student Progress to Career Readiness**  
> *Problem Statement ED-06: Smart Internship Management and Monitoring System*

---

## 📌 Overview

**PRAGATI** is an institution-centric platform designed to manage and monitor the complete student journey—from foundation skill development and continuous assessment, through faculty intervention and verified internships, to transparent placement eligibility.

Rather than treating career readiness as a chaotic final-year scramble across disparate spreadsheets, email threads, and paper forms, PRAGATI establishes a continuous, auditable, evidence-backed career lifecycle:

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

---

## 🎯 Core Problem & Mission

### Current Institutional Challenges
* **Fragmented Data**: Academic marks trapped in legacy ERPs, certificates scattered in WhatsApp/Google Drive, internship records handled manually.
* **Late Discovery**: Student skill deficiencies discovered during placement interviews—when it is too late to remediate.
* **Informal Interventions**: Faculty mentorship conducted informally without tracking, accountability, or closure.
* **Unverified Claims**: Resumes filled with self-reported credentials without cryptographic integrity or institutional review.
* **Opaque Placements**: Placement cells calculate eligibility using manual spreadsheets, causing errors, distrust, and student frustration.

### PRAGATI's Principle
PRAGATI is not merely a record-keeping system or a CRUD interface. It is an:
$$\mathbf{Evidence + Monitoring + Intervention + Verification + Eligibility\ Platform}$$

---

## 🌟 Key Differentiators

| Feature | Description |
| :--- | :--- |
| **Evidence-First Records** | Credentials are never just checkboxes. Every claim carries an explicit verification state (`SELF_REPORTED`, `PENDING`, `INSTITUTION_VERIFIED`, `ISSUER_VERIFIED`, `REJECTED`) and cryptographic SHA-256 file-integrity tracking. |
| **Explainable Intelligence** | Deterministic rule engines detect skill gaps and evaluate placement eligibility. AI is strictly assistive—used to summarize trends and draft recommendations. Humans decide; algorithms remain explainable. |
| **Closed-Loop Mentoring** | Faculty intervention is accountable: `Flagged → Assigned → Mentoring Session → Measured Outcome → Resolved / Reopened`. |
| **Transparent Eligibility** | Placement criteria are deterministic and transparent. Students can view exactly why they qualified or why they were disqualified (e.g., *“DSA score 62 is below required 70”*). |
| **Portable Career Passport** | A unified, tamper-evident career record detailing academic progression, certified skills, verified internships, and placement achievements. |

---

## 👥 User Roles & RBAC Matrix

PRAGATI enforces strict, server-side Role-Based Access Control (RBAC) across 5 core personas:

```
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

### Role Permissions Summary

* **Student (`STUDENT`)**:
  * *Allowed*: View own profile & academics, take assessments, submit achievements, upload internship evidence, view eligibility reasons, apply for published drives, export Career Passport.
  * *Forbidden*: Cannot modify official academics, cannot self-approve internships, cannot view peers' private data (IDOR protected).
* **Faculty / Mentor (`FACULTY`)**:
  * *Allowed*: View assigned ward roster, inspect skill-gap alerts, create and log mentoring interventions, review internship evidence completeness, issue `INSTITUTION_VERIFIED` status.
  * *Forbidden*: Cannot alter official academic marks, cannot access unassigned departmental cohorts without authorization.
* **Department Head (`HOD`)**:
  * *Allowed*: Department-wide analytics, skill progression heatmaps, faculty intervention velocity reports, audit trail inspection.
* **Training & Placement Officer (`TNP_COORDINATOR`)**:
  * *Allowed*: Create recruitment drives, build multi-variable eligibility rules (CGPA, backlogs, skills, verified internships), trigger deterministic eligibility runs, view candidate pipelines.
  * *Forbidden*: Cannot tamper with source academic or assessment records.
* **System Administrator (`ADMIN`)**:
  * *Allowed*: Manage institutions, user accounts, departments, skill taxonomies, system configurations, and security audit logs.

---

## 🏗️ System Architecture

PRAGATI is built as a **Modular Monolith** optimized for reliability, maintainability, low operational complexity, and strict data security.

```text
                              ┌─────────────────────────┐
                              │     CLIENT INTERFACE    │
                              │ React / Next.js SPA/PWA │
                              └────────────┬────────────┘
                                           │ HTTPS (REST / JSON)
                                           ▼
                              ┌─────────────────────────┐
                              │      API GATEWAY        │
                              │   FastAPI (Python 3.10) │
                              └────────────┬────────────┘
                                           │
         ┌─────────────────────────────────┼─────────────────────────────────┐
         ▼                                 ▼                                 ▼
┌──────────────────┐             ┌──────────────────┐             ┌──────────────────┐
│   Auth & RBAC    │             │  Domain Engines  │             │ Storage & Files  │
│ JWT + Argon2id   │             │ Skill Gap Engine │             │ Upload Handler   │
│ IDOR Protection  │             │ Placement Rules  │             │ SHA-256 Hashing  │
└────────┬─────────┘             └────────┬─────────┘             └────────┬─────────┘
         │                                 │                                 │
         └─────────────────────────────────┼─────────────────────────────────┘
                                           │
                ┌──────────────────────────┴──────────────────────────┐
                ▼                                                     ▼
    ┌───────────────────────────┐                         ┌───────────────────────┐
    │     MongoDB Atlas         │                         │     Redis Instance    │
    │  (Primary Source of Truth)│                         │ (Cache & Rate Limiter)│
    │ Structured collections &  │                         │ Dashboards, TTL-based │
    │ Document Relationships    │                         │ cache, Token limits   │
    └───────────┬───────────────┘                         └───────────────────────┘
                │
                ▼
    ┌───────────────────────────┐                         ┌───────────────────────┐
    │   Secure Object Store     │                         │   AI Advisory Layer   │
    │ Evidence Documents & PDFs │                         │ Explainable Narratives│
    │ (Strict MIME/Size checks) │                         │ (Human-in-the-Loop)   │
    └───────────────────────────┘                         └───────────────────────┘
```

### Technology Stack
* **Backend**: Python 3.10+, FastAPI (Modular Architecture, Pydantic schemas, Dependency Injection).
* **Database**: MongoDB Atlas (PyMongo / Motor async driver, indexed document schemas).
* **Cache & Rate Limiting**: Redis (Key-scoped caching, sliding window rate limits, graceful degradation).
* **Frontend**: React / Next.js, Vanilla CSS / Component design system, Charting (for meaningful questions).
* **Security**: Argon2id password hashing, JWT authentication, SHA-256 cryptographic document integrity.
* **AI Integration**: Explanatory LLM layer with strict prompt versioning and fallback protection.

---

## 🗄️ Database Collections (MongoDB Atlas)

Application state is managed in MongoDB Atlas with structured schemas and explicit indexing:

```text
institutions             -> College & university master config
departments              -> Department structures & branches
users                    -> Auth credentials, roles, email hashes
student_profiles         -> Profile data, bio, roll number, assigned faculty
academic_records         -> Semester GPAs, cumulative CGPA, active/cleared backlogs
subjects                 -> Course definitions & department mappings
skills                   -> Taxonomy of recognized technical/soft skills
skill_history            -> Time-series progression of student proficiencies
assessments              -> Quizzes, coding challenges, internal evaluations
assessment_submissions   -> Student answers, scores, timestamps (immutable)
achievements             -> Certifications, hackathons, extracurriculars
evidence                 -> Uploaded documents, SHA-256 hashes, file locations
skill_gaps               -> System-detected performance drops & flags
interventions            -> Faculty mentoring actions, tasks, resolutions
internships              -> Company, role, duration, stipend, lifecycle states
verifications            -> Review history, verification badge, faculty audit
recruitment_drives       -> Company placement listings & timelines
placement_rules          -> Deterministic eligibility expression trees
applications             -> Student job applications and statuses
notifications            -> In-app alerts for gaps, actions, and drive openings
audit_logs               -> Immutable security and compliance log stream
```

---

## 🛡️ Verification & Evidence Integrity Model

```text
Upload File (PDF/PNG) 
  → Strict MIME/Size/Extension Check 
  → Compute SHA-256 Hash 
  → Store Isolated Document 
  → Assign Verification State:
      ├── 1. SELF_REPORTED        (Initial student upload)
      ├── 2. PENDING              (Under faculty queue review)
      ├── 3. INSTITUTION_VERIFIED (Faculty signed off on evidence)
      ├── 4. ISSUER_VERIFIED      (Directly confirmed by issuer API)
      └── 5. REJECTED             (Invalid / insufficient documentation)
```

> **The Cryptographic Integrity Rule**:
> SHA-256 hashing proves **file integrity** (the file has not been altered since upload). It does **not** prove authenticity or truthfulness. Authenticity requires authorized human/institutional verification. PRAGATI never misleads stakeholders on this distinction.

---

## ⚡ Non-Negotiable Engineering Rules

PRAGATI follows strict engineering standards defined in [brain/STRICT.MD](file:///c:/Users/Lenovo/Desktop/Pragati/brain/STRICT.MD):

1. **Database is the Source of Truth**: Frontend state is strictly presentation; backend services enforce business logic and permissions.
2. **Never Fake Functionality**: No mocked stats, hardcoded eligibility counts, or fake success toasts. Mocks are restricted to documented seed fixtures.
3. **Prevent IDOR & Privilege Escalation**: Never trust user-supplied IDs from client payloads. Authenticated identity $\ne$ authorized permission.
4. **Deterministic Placement & Gaps**: Rule engines calculate eligibility and gaps deterministically with audit trails. AI *explains*, rules *decide*, humans *approve*.
5. **AI Never Acts Unilaterally**: AI never grades students, rejects applications, or approves internships. If the AI service fails, fallback rules maintain core operations without degradation.
6. **Graceful Cache Degradation**: If Redis is offline, the system degrades in speed by querying MongoDB directly—never crashing or returning stale/corrupt data.

---

## 🎬 Hackathon Hero Demo Flow (5–7 Mins)

The demo showcases one complete vertical slice following **Rahul Sharma (Year 3 CS Student)**:

```text
[Scene 1] Rahul logs in → Views student dashboard (CGPA 8.1, DSA 61, OS Backlog: 1)
   │
[Scene 2] Skill Gap Flag → Rule engine detects: 2 consecutive DSA drops (78→70→61) + OS Backlog
   │
[Scene 3] AI Explanation → Explains root cause & drafts recommended intervention
   │
[Scene 4] Faculty Login → Mentor views alert, creates structured "DSA Remediation" session
   │
[Scene 5] Improvement → Rahul re-assesses (61→78) → Gap automatically transitions to RESOLVED
   │
[Scene 6] Internship → Rahul submits 8-week TechCorp Software Engineering internship evidence
   │
[Scene 7] SHA-256 Tamper Demo → Original PDF hash validated; modified PDF flagged as TAMPERED
   │
[Scene 8] Faculty Verification → Mentor inspects documents and marks INSTITUTION_VERIFIED
   │
[Scene 9] T&P Coordinator → Creates "ABC Tech" drive: CGPA ≥ 7.5, Backlogs = 0, Verified Internship
   │
[Scene 10] Eligibility Engine → Runs deterministic evaluation: Rahul ELIGIBLE; peers rejected with reasons
   │
[Scene 11] Drive Application → Rahul views transparent eligibility and applies in one click
   │
[Scene 12] Career Passport → Complete verified profile generated ready for export
```

---

## 🧠 Documentation Index (`brain/`)

All system architecture, design rules, and contracts are documented in the [brain](file:///c:/Users/Lenovo/Desktop/Pragati/brain) directory:

| Specification Document | Focus Area |
| :--- | :--- |
| [00_PROJECT_CONTEXT.md](file:///c:/Users/Lenovo/Desktop/Pragati/brain/00_PROJECT_CONTEXT.md) | Problem Statement ED-06, core philosophy, non-goals, truthfulness principle |
| [01_PRODUCT_VISION.md](file:///c:/Users/Lenovo/Desktop/Pragati/brain/01_PRODUCT_VISION.md) | 4-Year student career journey, 18 modules, core differentiators |
| [02_SYSTEM_DESIGN.md](file:///c:/Users/Lenovo/Desktop/Pragati/brain/02_SYSTEM_DESIGN.md) | Modular monolith architecture, service layers, request lifecycle |
| [03_DATABASE_DESIGN.md](file:///c:/Users/Lenovo/Desktop/Pragati/brain/03_DATABASE_DESIGN.md) | MongoDB Atlas schema specifications, indexes, document structures |
| [04_API_CONTRACT.md](file:///c:/Users/Lenovo/Desktop/Pragati/brain/04_API_CONTRACT.md) | `/api/v1` REST contract, response envelope, error schemas, pagination |
| [05_SECURITY.md](file:///c:/Users/Lenovo/Desktop/Pragati/brain/05_SECURITY.md) | Threat modeling, IDOR prevention, file security, secrets governance |
| [06_AUTH_RBAC.md](file:///c:/Users/Lenovo/Desktop/Pragati/brain/06_AUTH_RBAC.md) | 5 system roles, detailed permission matrices, token handling |
| [07_CACHING.md](file:///c:/Users/Lenovo/Desktop/Pragati/brain/07_CACHING.md) | Redis caching strategy, key namespacing, invalidation hooks, fallback |
| [08_RATE_LIMITING.md](file:///c:/Users/Lenovo/Desktop/Pragati/brain/08_RATE_LIMITING.md) | Endpoint rate limiting thresholds (Auth, AI, Uploads, Public) |
| [09_AI_RULES.md](file:///c:/Users/Lenovo/Desktop/Pragati/brain/09_AI_RULES.md) | AI boundaries, prompt templates, output validation, human oversight |
| [10_VERIFICATION.md](file:///c:/Users/Lenovo/Desktop/Pragati/brain/10_VERIFICATION.md) | 5 verification states, SHA-256 integrity rules, tamper testing |
| [11_FRONTEND_RULES.md](file:///c:/Users/Lenovo/Desktop/Pragati/brain/11_FRONTEND_RULES.md) | Institutional design guidelines, role dashboards, accessibility |
| [12_BACKEND_RULES.md](file:///c:/Users/Lenovo/Desktop/Pragati/brain/12_BACKEND_RULES.md) | Route-service-repo separation, Pydantic schemas, idempotency |
| [13_TESTING.md](file:///c:/Users/Lenovo/Desktop/Pragati/brain/13_TESTING.md) | Unit, API, RBAC, IDOR, tamper, cache, and regression test suites |
| [14_DEVOPS_DEPLOYMENT.md](file:///c:/Users/Lenovo/Desktop/Pragati/brain/14_DEVOPS_DEPLOYMENT.md) | Environment configuration, health endpoints, CI/CD, backup & rollback |
| [15_DEMO_FLOW.md](file:///c:/Users/Lenovo/Desktop/Pragati/brain/15_DEMO_FLOW.md) | Step-by-step 12-scene hackathon script for judges |
| [16_SCOPE_CONTROL.md](file:///c:/Users/Lenovo/Desktop/Pragati/brain/16_SCOPE_CONTROL.md) | Tier 1 (Must Build) vs. Tier 2/3/Future features to prevent scope creep |
| [17_PROGRESS.md](file:///c:/Users/Lenovo/Desktop/Pragati/brain/17_PROGRESS.md) | 15-Phase implementation checklist tracking development progress |
| [STRICT.MD](file:///c:/Users/Lenovo/Desktop/Pragati/brain/STRICT.MD) | 25 Non-negotiable engineering mandates for coding agents and contributors |

---

## 🚀 Getting Started

### 1. Prerequisites
* **Python 3.10+** (with `pip` and `virtualenv`)
* **Node.js 18+** (with `npm`)
* **MongoDB Atlas** connection string (or local MongoDB 6.0+)
* **Redis 6.2+** instance (local or Redis Cloud)

### 2. Environment Configuration
Create a `.env` file in the backend root based on the template:
```env
# Server Configuration
PORT=8000
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:3000

# Database & Cache
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/pragati?retryWrites=true&w=majority
REDIS_URL=redis://localhost:6379/0

# Security & Tokens
JWT_SECRET=replace_with_a_secure_random_64_char_hex_secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Storage
UPLOAD_STORAGE_PATH=./uploads
MAX_UPLOAD_SIZE_MB=10

# AI Provider (Optional / Assistive)
AI_API_KEY=your_llm_api_key_here
AI_MODEL_NAME=gemini-1.5-flash
```

### 3. Backend Setup
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database seed (creates demo users, hero student, skills, and drives)
python -m app.scripts.seed

# Start backend dev server
uvicorn app.main:app --reload --port 8000
```
Backend will be available at `http://localhost:8000` with interactive API docs at `http://localhost:8000/docs`.

### 4. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start frontend dev server
npm run dev
```
Frontend will be available at `http://localhost:3000`.

---

## 🧪 Testing & Verification

Execute the test suites to ensure both functionality and security boundaries hold:

```bash
# Run backend test suite
pytest tests/ -v

# Run security and RBAC authorization tests
pytest tests/test_security_rbac.py -v

# Run deterministic eligibility engine tests
pytest tests/test_eligibility_engine.py -v

# Run SHA-256 tamper verification tests
pytest tests/test_evidence_hashing.py -v
```

### Definition of Done
A module or feature is marked complete in [brain/17_PROGRESS.md](file:///c:/Users/Lenovo/Desktop/Pragati/brain/17_PROGRESS.md) only when:
$$\mathbf{Implemented + Integrated + Tested + Security\ Reviewed + Documented + Verified}$$

---

## ⚖️ License
This project is developed for educational and hackathon demonstration purposes under Problem Statement ED-06.
All rights reserved © 2026 PRAGATI Team.
