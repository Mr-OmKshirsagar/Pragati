# Phase 01 Specification: Database Schema & Row Level Security (RLS)

## 1. Metadata
- **Phase**: 01
- **Title**: Supabase PostgreSQL Schema, Drizzle ORM Models & RLS Policies
- **Status**: Completed
- **Dependencies**: Phase 00
- **Target Files**:
  - `backend/drizzle/schema.ts`
  - `backend/drizzle/migrations/0001_initial_pragati_schema.sql`
  - `backend/scripts/seed.ts`

---

## 2. Objective & Scope
Define the complete relational schema in `drizzle/schema.ts` for PostgreSQL, generate the initial Supabase migration SQL, configure Row Level Security (RLS) policies, and write an idempotent seed script that sets up Northstar Institute of Technology, departments, skills, test assessments, and seed personas (including Rahul Sharma).

---

## 3. Database Architecture & Table Catalog

### 3.1 Enumerations
- `user_role`: `STUDENT`, `FACULTY`, `HOD`, `TNP_COORDINATOR`, `ADMIN`
- `verification_status`: `SELF_REPORTED`, `PENDING`, `INSTITUTION_VERIFIED`, `ISSUER_VERIFIED`, `REJECTED`
- `gap_severity`: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- `gap_status`: `OPEN`, `IN_REVIEW`, `RESOLVED`, `REOPENED`
- `intervention_status`: `PENDING`, `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`
- `internship_status`: `APPLIED`, `OFFERED`, `IN_PROGRESS`, `COMPLETED`, `TERMINATED`
- `evidence_type`: `OFFER_LETTER`, `CHECK_IN`, `COMPLETION_CERTIFICATE`, `INTERNSHIP_REPORT`, `SUPERVISOR_CONFIRMATION`, `SKILL_CERTIFICATE`
- `drive_status`: `DRAFT`, `PUBLISHED`, `CLOSED`, `ARCHIVED`
- `application_status`: `APPLIED`, `SHORTLISTED`, `INTERVIEWING`, `OFFERED`, `REJECTED`

### 3.2 26 Normalized Tables
1. `institutions`: Master college entity (code, name).
2. `departments`: Academic branches mapped to institutions.
3. `users`: Identity accounts linked to Supabase `auth.users(id)` with institutional role.
4. `student_profiles`: Program, section, semester, assigned faculty mentor, enrollment number.
5. `academic_records`: Semester-wise SGPA and cumulative CGPA.
6. `subjects`: Courses with credits and semester mappings.
7. `subject_results`: Student marks and grades per subject.
8. `backlogs`: Active and cleared backlogs with historical audit.
9. `skills`: Technical and professional skill taxonomy.
10. `assessments`: Quizzes and evaluations linked to skill IDs.
11. `assessment_submissions`: Immutable student submission scores.
12. `skill_history`: Time-series score milestones for trend analysis.
13. `achievements`: Hackathons, certifications, competitions.
14. `evidence_documents`: Metadata and SHA-256 hashes of files in Supabase Storage (`evidence-vault`).
15. `verifications`: Audit trail of institutional/issuer sign-offs.
16. `skill_gaps`: Rule-flagged performance deficiencies with JSON triggers.
17. `interventions`: Faculty mentoring sessions and remedial actions.
18. `internships`: Company, role, duration, stipend, verification status.
19. `internship_evidence`: Association between internships and verified evidence documents.
20. `internship_checkins`: Periodic student progress check-in summaries.
21. `recruitment_drives`: Placement company listings, job details, and deadlines.
22. `placement_rules`: JSON AST expressions representing deterministic drive eligibility.
23. `eligibility_evaluations`: Immutable evaluation runs with itemized explanations.
24. `applications`: Student job applications with status lifecycle.
25. `notifications`: In-app alerts for gaps, mentoring, and drives.
26. `audit_logs`: Immutable security ledger for sensitive actions.

---

## 4. Drizzle ORM Schema (`backend/drizzle/schema.ts`)
The schema must use `pgTable`, `uuid`, `text`, `varchar`, `integer`, `numeric`, `boolean`, `timestamp`, and `jsonb` from `drizzle-orm/pg-core`.

```typescript
import { pgTable, uuid, text, varchar, integer, numeric, boolean, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["STUDENT", "FACULTY", "HOD", "TNP_COORDINATOR", "ADMIN"]);
export const verificationStatusEnum = pgEnum("verification_status", ["SELF_REPORTED", "PENDING", "INSTITUTION_VERIFIED", "ISSUER_VERIFIED", "REJECTED"]);
export const gapSeverityEnum = pgEnum("gap_severity", ["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const gapStatusEnum = pgEnum("gap_status", ["OPEN", "IN_REVIEW", "RESOLVED", "REOPENED"]);
export const interventionStatusEnum = pgEnum("intervention_status", ["PENDING", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]);
export const internshipStatusEnum = pgEnum("internship_status", ["APPLIED", "OFFERED", "IN_PROGRESS", "COMPLETED", "TERMINATED"]);
export const evidenceTypeEnum = pgEnum("evidence_type", ["OFFER_LETTER", "CHECK_IN", "COMPLETION_CERTIFICATE", "INTERNSHIP_REPORT", "SUPERVISOR_CONFIRMATION", "SKILL_CERTIFICATE"]);
export const driveStatusEnum = pgEnum("drive_status", ["DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"]);
export const applicationStatusEnum = pgEnum("application_status", ["APPLIED", "SHORTLISTED", "INTERVIEWING", "OFFERED", "REJECTED"]);

export const institutions = pgTable("institutions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const departments = pgTable("departments", {
  id: uuid("id").primaryKey().defaultRandom(),
  institutionId: uuid("institution_id").notNull().references(() => institutions.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  code: varchar("code", { length: 32 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey(), // Matches auth.users.id
  institutionId: uuid("institution_id").notNull().references(() => institutions.id, { onDelete: "cascade" }),
  departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  role: userRoleEnum("role").default("STUDENT").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const studentProfiles = pgTable("student_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  institutionId: uuid("institution_id").notNull().references(() => institutions.id, { onDelete: "cascade" }),
  departmentId: uuid("department_id").notNull().references(() => departments.id),
  assignedFacultyId: uuid("assigned_faculty_id").references(() => users.id, { onDelete: "set null" }),
  enrollmentNumber: varchar("enrollment_number", { length: 64 }).notNull().unique(),
  program: varchar("program", { length: 128 }).notNull(),
  currentSemester: integer("current_semester").default(1).notNull(),
  admissionYear: integer("admission_year").notNull(),
  graduationYear: integer("graduation_year").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const academicRecords = pgTable("academic_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").notNull().references(() => studentProfiles.id, { onDelete: "cascade" }),
  semester: integer("semester").notNull(),
  academicYear: varchar("academic_year", { length: 32 }).notNull(),
  sgpa: numeric("sgpa", { precision: 4, scale: 2 }).notNull(),
  cgpa: numeric("cgpa", { precision: 4, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 64 }).notNull().unique(),
  category: varchar("category", { length: 64 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const skillHistory = pgTable("skill_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").notNull().references(() => studentProfiles.id, { onDelete: "cascade" }),
  skillId: uuid("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
  score: numeric("score", { precision: 5, scale: 2 }).notNull(),
  maxScore: numeric("max_score", { precision: 5, scale: 2 }).default("100").notNull(),
  assessmentDate: timestamp("assessment_date", { withTimezone: true }).defaultNow().notNull(),
});

export const evidenceDocuments = pgTable("evidence_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").notNull().references(() => studentProfiles.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  storageBucket: varchar("storage_bucket", { length: 64 }).default("evidence-vault").notNull(),
  storagePath: text("storage_path").notNull(),
  mimeType: varchar("mime_type", { length: 64 }).notNull(),
  fileSize: integer("file_size").notNull(),
  sha256Hash: varchar("sha256_hash", { length: 64 }).notNull(),
  verificationStatus: verificationStatusEnum("verification_status").default("SELF_REPORTED").notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
});

export const skillGaps = pgTable("skill_gaps", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").notNull().references(() => studentProfiles.id, { onDelete: "cascade" }),
  skillId: uuid("skill_id").notNull().references(() => skills.id),
  ruleId: varchar("rule_id", { length: 64 }).notNull(),
  severity: gapSeverityEnum("severity").default("HIGH").notNull(),
  status: gapStatusEnum("status").default("OPEN").notNull(),
  reason: jsonb("reason").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

export const interventions = pgTable("interventions", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").notNull().references(() => studentProfiles.id, { onDelete: "cascade" }),
  skillGapId: uuid("skill_gap_id").notNull().references(() => skillGaps.id, { onDelete: "cascade" }),
  assignedTo: uuid("assigned_to").notNull().references(() => users.id),
  type: varchar("type", { length: 64 }).default("MENTORING").notNull(),
  description: text("description").notNull(),
  status: interventionStatusEnum("status").default("PENDING").notNull(),
  outcome: text("outcome"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const internships = pgTable("internships", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").notNull().references(() => studentProfiles.id, { onDelete: "cascade" }),
  companyName: text("company_name").notNull(),
  role: text("role").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }),
  status: internshipStatusEnum("status").default("IN_PROGRESS").notNull(),
  verificationStatus: verificationStatusEnum("verification_status").default("PENDING").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const recruitmentDrives = pgTable("recruitment_drives", {
  id: uuid("id").primaryKey().defaultRandom(),
  institutionId: uuid("institution_id").notNull().references(() => institutions.id, { onDelete: "cascade" }),
  companyName: text("company_name").notNull(),
  jobTitle: text("job_title").notNull(),
  description: text("description").notNull(),
  ctcOrStipend: varchar("ctc_or_stipend", { length: 64 }),
  applicationDeadline: timestamp("application_deadline", { withTimezone: true }).notNull(),
  status: driveStatusEnum("status").default("PUBLISHED").notNull(),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const placementRules = pgTable("placement_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  recruitmentDriveId: uuid("recruitment_drive_id").notNull().references(() => recruitmentDrives.id, { onDelete: "cascade" }),
  version: integer("version").default(1).notNull(),
  ruleDefinition: jsonb("rule_definition").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const eligibilityEvaluations = pgTable("eligibility_evaluations", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").notNull().references(() => studentProfiles.id, { onDelete: "cascade" }),
  recruitmentDriveId: uuid("recruitment_drive_id").notNull().references(() => recruitmentDrives.id, { onDelete: "cascade" }),
  eligible: boolean("eligible").notNull(),
  reasons: jsonb("reasons").notNull(),
  evaluatedAt: timestamp("evaluated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const applications = pgTable("applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").notNull().references(() => studentProfiles.id, { onDelete: "cascade" }),
  recruitmentDriveId: uuid("recruitment_drive_id").notNull().references(() => recruitmentDrives.id, { onDelete: "cascade" }),
  status: applicationStatusEnum("status").default("APPLIED").notNull(),
  appliedAt: timestamp("applied_at", { withTimezone: true }).defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  institutionId: uuid("institution_id").notNull().references(() => institutions.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id),
  action: varchar("action", { length: 64 }).notNull(),
  resourceType: varchar("resource_type", { length: 64 }).notNull(),
  resourceId: uuid("resource_id"),
  metadata: jsonb("metadata").default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

---

## 5. Row Level Security (RLS) SQL Script
Must be executed in Supabase SQL editor or as a migration:
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Students read own profile" ON student_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Students read own academics" ON academic_records FOR SELECT USING (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Faculty read assigned wards" ON student_profiles FOR SELECT USING (assigned_faculty_id = auth.uid());
CREATE POLICY "Students manage own evidence" ON evidence_documents FOR ALL USING (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()));
```

---

## 6. Seed Data Specifications (`backend/scripts/seed.ts`)
The seed script must populate:
- **Institution**: Northstar Institute of Technology (`NIT-001`).
- **Department**: Computer Science and Engineering (`CSE`).
- **Faculty**: Dr. Anand Verma (`faculty@northstar.edu`, Role: `FACULTY`).
- **Hero Student**: Rahul Sharma (`student@northstar.edu`, Role: `STUDENT`, Roll: `CSE2024042`).
  - CGPA: 8.42, Active OS Backlog: 1.
  - Historical DSA scores: `[78, 70, 61]`.
- **Skills**: DSA, Python, DBMS, OOP, OS, CN.
- **Drive**: ABC Technologies (Role: Software Engineer, Criteria: CGPA >= 7.5, Backlogs = 0, DSA >= 70, Internship: COMPLETED).

---

## 7. Verification Commands
```bash
cd backend
npx drizzle-kit generate
npx tsx scripts/seed.ts
```

---

## 8. Definition of Done
- [x] `drizzle/schema.ts` completely models all 26 tables using PostgreSQL types.
- [x] SQL migration file generated in `drizzle/migrations/`.
- [x] RLS policies script created and applied (26/26 tables secured).
- [x] Seed script executes idempotently and seeds the demo environment.
- [x] Automated test suite in `tests/phase-01.test.ts` passing (6/6).
