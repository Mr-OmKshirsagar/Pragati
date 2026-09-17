import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// ============================================================================
// 1. ENUMERATIONS
// ============================================================================

export const userRoleEnum = pgEnum("user_role", [
  "STUDENT",
  "FACULTY",
  "HOD",
  "ADMIN",
]);

export const verificationStatusEnum = pgEnum("verification_status", [
  "SELF_REPORTED",
  "PENDING",
  "INSTITUTION_VERIFIED",
  "ISSUER_VERIFIED",
  "REJECTED",
]);

export const gapSeverityEnum = pgEnum("gap_severity", [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);

export const gapStatusEnum = pgEnum("gap_status", [
  "OPEN",
  "IN_REVIEW",
  "RESOLVED",
  "REOPENED",
]);

export const interventionStatusEnum = pgEnum("intervention_status", [
  "PENDING",
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

export const internshipStatusEnum = pgEnum("internship_status", [
  "APPLIED",
  "OFFERED",
  "IN_PROGRESS",
  "COMPLETED",
  "TERMINATED",
]);

export const evidenceTypeEnum = pgEnum("evidence_type", [
  "OFFER_LETTER",
  "CHECK_IN",
  "COMPLETION_CERTIFICATE",
  "INTERNSHIP_REPORT",
  "SUPERVISOR_CONFIRMATION",
  "SKILL_CERTIFICATE",
]);

export const driveStatusEnum = pgEnum("drive_status", [
  "DRAFT",
  "PUBLISHED",
  "CLOSED",
  "ARCHIVED",
]);

export const applicationStatusEnum = pgEnum("application_status", [
  "APPLIED",
  "SHORTLISTED",
  "INTERVIEWING",
  "OFFERED",
  "REJECTED",
]);

// ============================================================================
// 2. 26 NORMALIZED TABLES
// ============================================================================

// 1. INSTITUTIONS
export const institutions = pgTable("institutions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 2. DEPARTMENTS
export const departments = pgTable("departments", {
  id: uuid("id").primaryKey().defaultRandom(),
  institutionId: uuid("institution_id")
    .notNull()
    .references(() => institutions.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  code: varchar("code", { length: 32 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 3. USERS (Matches Supabase auth.users(id))
export const users = pgTable("users", {
  id: uuid("id").primaryKey(), // Matches Supabase auth.users.id
  institutionId: uuid("institution_id")
    .notNull()
    .references(() => institutions.id, { onDelete: "cascade" }),
  departmentId: uuid("department_id").references(() => departments.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  role: userRoleEnum("role").default("STUDENT").notNull(),
  avatarUrl: text("avatar_url"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 4. STUDENT PROFILES
export const studentProfiles = pgTable("student_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  institutionId: uuid("institution_id")
    .notNull()
    .references(() => institutions.id, { onDelete: "cascade" }),
  departmentId: uuid("department_id")
    .notNull()
    .references(() => departments.id, { onDelete: "restrict" }),
  assignedFacultyId: uuid("assigned_faculty_id").references(() => users.id, {
    onDelete: "set null",
  }),
  enrollmentNumber: varchar("enrollment_number", { length: 64 }).notNull().unique(),
  program: varchar("program", { length: 128 }).notNull(),
  section: varchar("section", { length: 32 }),
  currentSemester: integer("current_semester").default(1).notNull(),
  admissionYear: integer("admission_year").notNull(),
  graduationYear: integer("graduation_year").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 5. ACADEMIC RECORDS (Semester GPAs & Cumulative CGPA)
export const academicRecords = pgTable(
  "academic_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => studentProfiles.id, { onDelete: "cascade" }),
    semester: integer("semester").notNull(),
    academicYear: varchar("academic_year", { length: 32 }).notNull(),
    sgpa: numeric("sgpa", { precision: 4, scale: 2 }).notNull(),
    cgpa: numeric("cgpa", { precision: 4, scale: 2 }).notNull(),
    totalCredits: integer("total_credits").default(20).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique("student_semester_unique").on(table.studentId, table.semester)]
);

// 6. SUBJECTS
export const subjects = pgTable("subjects", {
  id: uuid("id").primaryKey().defaultRandom(),
  departmentId: uuid("department_id")
    .notNull()
    .references(() => departments.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 32 }).notNull(),
  name: text("name").notNull(),
  credits: integer("credits").default(3).notNull(),
  semester: integer("semester").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 7. SUBJECT RESULTS
export const subjectResults = pgTable(
  "subject_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => studentProfiles.id, { onDelete: "cascade" }),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "restrict" }),
    semester: integer("semester").notNull(),
    marks: numeric("marks", { precision: 5, scale: 2 }).notNull(),
    grade: varchar("grade", { length: 8 }).notNull(),
    status: varchar("status", { length: 16 }).default("PASSED").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique("student_subject_semester_unique").on(table.studentId, table.subjectId, table.semester)]
);

// 8. BACKLOGS
export const backlogs = pgTable("backlogs", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => studentProfiles.id, { onDelete: "cascade" }),
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "restrict" }),
  semester: integer("semester").notNull(),
  status: varchar("status", { length: 16 }).default("ACTIVE").notNull(), // 'ACTIVE', 'CLEARED'
  clearedAt: timestamp("cleared_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 9. SKILLS TAXONOMY
export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 64 }).notNull().unique(),
  category: varchar("category", { length: 64 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 10. ASSESSMENTS
export const assessments = pgTable("assessments", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  departmentId: uuid("department_id").references(() => departments.id, {
    onDelete: "set null",
  }),
  skillIds: jsonb("skill_ids").$type<string[]>().default([]).notNull(),
  maxScore: integer("max_score").default(100).notNull(),
  durationMinutes: integer("duration_minutes").default(60).notNull(),
  status: varchar("status", { length: 16 }).default("PUBLISHED").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 11. ASSESSMENT SUBMISSIONS
export const assessmentSubmissions = pgTable("assessment_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  assessmentId: uuid("assessment_id")
    .notNull()
    .references(() => assessments.id, { onDelete: "cascade" }),
  studentId: uuid("student_id")
    .notNull()
    .references(() => studentProfiles.id, { onDelete: "cascade" }),
  score: numeric("score", { precision: 5, scale: 2 }).notNull(),
  maxScore: numeric("max_score", { precision: 5, scale: 2 }).default("100").notNull(),
  attemptNumber: integer("attempt_number").default(1).notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
});

// 12. SKILL PROGRESSION HISTORY
export const skillHistory = pgTable("skill_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => studentProfiles.id, { onDelete: "cascade" }),
  skillId: uuid("skill_id")
    .notNull()
    .references(() => skills.id, { onDelete: "cascade" }),
  assessmentId: uuid("assessment_id").references(() => assessments.id, {
    onDelete: "set null",
  }),
  score: numeric("score", { precision: 5, scale: 2 }).notNull(),
  maxScore: numeric("max_score", { precision: 5, scale: 2 }).default("100").notNull(),
  assessmentDate: timestamp("assessment_date", { withTimezone: true }).defaultNow().notNull(),
});

// 13. ACHIEVEMENTS
export const achievements = pgTable("achievements", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => studentProfiles.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  type: varchar("type", { length: 32 }).notNull(),
  issuer: text("issuer").notNull(),
  date: date("date").notNull(),
  verificationStatus: verificationStatusEnum("verification_status")
    .default("SELF_REPORTED")
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 14. EVIDENCE DOCUMENTS (Cryptographic Vault)
export const evidenceDocuments = pgTable("evidence_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => studentProfiles.id, { onDelete: "cascade" }),
  achievementId: uuid("achievement_id").references(() => achievements.id, {
    onDelete: "set null",
  }),
  filename: text("filename").notNull(),
  storageBucket: varchar("storage_bucket", { length: 64 })
    .default("evidence-vault")
    .notNull(),
  storagePath: text("storage_path").notNull(),
  mimeType: varchar("mime_type", { length: 64 }).notNull(),
  fileSize: integer("file_size").notNull(),
  sha256Hash: varchar("sha256_hash", { length: 64 }).notNull(),
  verificationStatus: verificationStatusEnum("verification_status")
    .default("SELF_REPORTED")
    .notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
});

// 15. VERIFICATIONS AUDIT
export const verifications = pgTable("verifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  evidenceId: uuid("evidence_id")
    .notNull()
    .references(() => evidenceDocuments.id, { onDelete: "cascade" }),
  verifierUserId: uuid("verifier_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  verificationType: varchar("verification_type", { length: 32 })
    .default("INSTITUTION")
    .notNull(),
  status: varchar("status", { length: 32 }).default("VERIFIED").notNull(),
  notes: text("notes"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }).defaultNow().notNull(),
});

// 16. SKILL GAPS
export const skillGaps = pgTable("skill_gaps", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => studentProfiles.id, { onDelete: "cascade" }),
  skillId: uuid("skill_id")
    .notNull()
    .references(() => skills.id, { onDelete: "restrict" }),
  ruleId: varchar("rule_id", { length: 64 }).notNull(),
  severity: gapSeverityEnum("severity").default("HIGH").notNull(),
  status: gapStatusEnum("status").default("OPEN").notNull(),
  reason: jsonb("reason").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

// 17. FACULTY INTERVENTIONS (Closed-Loop Mentoring)
export const interventions = pgTable("interventions", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => studentProfiles.id, { onDelete: "cascade" }),
  skillGapId: uuid("skill_gap_id")
    .notNull()
    .references(() => skillGaps.id, { onDelete: "cascade" }),
  assignedTo: uuid("assigned_to")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  type: varchar("type", { length: 64 }).default("MENTORING").notNull(),
  description: text("description").notNull(),
  status: interventionStatusEnum("status").default("PENDING").notNull(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  outcome: text("outcome"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 18. INTERNSHIPS
export const internships = pgTable("internships", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => studentProfiles.id, { onDelete: "cascade" }),
  companyName: text("company_name").notNull(),
  role: text("role").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  stipend: numeric("stipend", { precision: 10, scale: 2 }),
  status: internshipStatusEnum("status").default("IN_PROGRESS").notNull(),
  supervisorName: text("supervisor_name"),
  supervisorEmail: varchar("supervisor_email", { length: 320 }),
  verificationStatus: verificationStatusEnum("verification_status")
    .default("PENDING")
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 19. INTERNSHIP EVIDENCE
export const internshipEvidence = pgTable("internship_evidence", {
  id: uuid("id").primaryKey().defaultRandom(),
  internshipId: uuid("internship_id")
    .notNull()
    .references(() => internships.id, { onDelete: "cascade" }),
  evidenceType: evidenceTypeEnum("evidence_type").notNull(),
  evidenceDocumentId: uuid("evidence_document_id")
    .notNull()
    .references(() => evidenceDocuments.id, { onDelete: "cascade" }),
  status: verificationStatusEnum("status").default("PENDING").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 20. INTERNSHIP CHECKINS
export const internshipCheckins = pgTable("internship_checkins", {
  id: uuid("id").primaryKey().defaultRandom(),
  internshipId: uuid("internship_id")
    .notNull()
    .references(() => internships.id, { onDelete: "cascade" }),
  studentId: uuid("student_id")
    .notNull()
    .references(() => studentProfiles.id, { onDelete: "cascade" }),
  checkInDate: date("check_in_date").defaultNow().notNull(),
  summary: text("summary").notNull(),
  status: varchar("status", { length: 32 }).default("SUBMITTED").notNull(),
  reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 21. RECRUITMENT DRIVES
export const recruitmentDrives = pgTable("recruitment_drives", {
  id: uuid("id").primaryKey().defaultRandom(),
  institutionId: uuid("institution_id")
    .notNull()
    .references(() => institutions.id, { onDelete: "cascade" }),
  companyName: text("company_name").notNull(),
  jobTitle: text("job_title").notNull(),
  description: text("description").notNull(),
  ctcOrStipend: varchar("ctc_or_stipend", { length: 64 }),
  applicationDeadline: timestamp("application_deadline", { withTimezone: true }).notNull(),
  status: driveStatusEnum("status").default("PUBLISHED").notNull(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 22. PLACEMENT RULES (AST JSON Expression Trees)
export const placementRules = pgTable("placement_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  recruitmentDriveId: uuid("recruitment_drive_id")
    .notNull()
    .references(() => recruitmentDrives.id, { onDelete: "cascade" }),
  version: integer("version").default(1).notNull(),
  ruleDefinition: jsonb("rule_definition").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 23. ELIGIBILITY EVALUATIONS (Deterministic Audit Trail)
export const eligibilityEvaluations = pgTable(
  "eligibility_evaluations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => studentProfiles.id, { onDelete: "cascade" }),
    recruitmentDriveId: uuid("recruitment_drive_id")
      .notNull()
      .references(() => recruitmentDrives.id, { onDelete: "cascade" }),
    eligible: boolean("eligible").notNull(),
    reasons: jsonb("reasons").$type<string[]>().default([]).notNull(),
    evaluatedAt: timestamp("evaluated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique("student_drive_evaluation_unique").on(table.studentId, table.recruitmentDriveId)]
);

// 24. APPLICATIONS
export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => studentProfiles.id, { onDelete: "cascade" }),
    recruitmentDriveId: uuid("recruitment_drive_id")
      .notNull()
      .references(() => recruitmentDrives.id, { onDelete: "cascade" }),
    status: applicationStatusEnum("status").default("APPLIED").notNull(),
    appliedAt: timestamp("applied_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique("student_drive_application_unique").on(table.studentId, table.recruitmentDriveId)]
);

// 25. NOTIFICATIONS
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 64 }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  link: text("link"),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 26. AUDIT LOGS (Immutable Compliance Ledger)
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  institutionId: uuid("institution_id")
    .notNull()
    .references(() => institutions.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 64 }).notNull(),
  resourceType: varchar("resource_type", { length: 64 }).notNull(),
  resourceId: uuid("resource_id"),
  metadata: jsonb("metadata").default({}).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// 3. INFERRED TYPES
// ============================================================================

export type Institution = typeof institutions.$inferSelect;
export type InsertInstitution = typeof institutions.$inferInsert;

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = typeof departments.$inferInsert;

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type StudentProfile = typeof studentProfiles.$inferSelect;
export type InsertStudentProfile = typeof studentProfiles.$inferInsert;

export type AcademicRecord = typeof academicRecords.$inferSelect;
export type InsertAcademicRecord = typeof academicRecords.$inferInsert;

export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = typeof subjects.$inferInsert;

export type SubjectResult = typeof subjectResults.$inferSelect;
export type InsertSubjectResult = typeof subjectResults.$inferInsert;

export type Backlog = typeof backlogs.$inferSelect;
export type InsertBacklog = typeof backlogs.$inferInsert;

export type Skill = typeof skills.$inferSelect;
export type InsertSkill = typeof skills.$inferInsert;

export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = typeof assessments.$inferInsert;

export type AssessmentSubmission = typeof assessmentSubmissions.$inferSelect;
export type InsertAssessmentSubmission = typeof assessmentSubmissions.$inferInsert;

export type SkillHistory = typeof skillHistory.$inferSelect;
export type InsertSkillHistory = typeof skillHistory.$inferInsert;

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;

export type EvidenceDocument = typeof evidenceDocuments.$inferSelect;
export type InsertEvidenceDocument = typeof evidenceDocuments.$inferInsert;

export type Verification = typeof verifications.$inferSelect;
export type InsertVerification = typeof verifications.$inferInsert;

export type SkillGap = typeof skillGaps.$inferSelect;
export type InsertSkillGap = typeof skillGaps.$inferInsert;

export type Intervention = typeof interventions.$inferSelect;
export type InsertIntervention = typeof interventions.$inferInsert;

export type Internship = typeof internships.$inferSelect;
export type InsertInternship = typeof internships.$inferInsert;

export type InternshipEvidence = typeof internshipEvidence.$inferSelect;
export type InsertInternshipEvidence = typeof internshipEvidence.$inferInsert;

export type InternshipCheckin = typeof internshipCheckins.$inferSelect;
export type InsertInternshipCheckin = typeof internshipCheckins.$inferInsert;

export type RecruitmentDrive = typeof recruitmentDrives.$inferSelect;
export type InsertRecruitmentDrive = typeof recruitmentDrives.$inferInsert;

export type PlacementRule = typeof placementRules.$inferSelect;
export type InsertPlacementRule = typeof placementRules.$inferInsert;

export type EligibilityEvaluation = typeof eligibilityEvaluations.$inferSelect;
export type InsertEligibilityEvaluation = typeof eligibilityEvaluations.$inferInsert;

export type Application = typeof applications.$inferSelect;
export type InsertApplication = typeof applications.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ============================================================================
// 27. SUBJECT ENROLLMENT & TEACHER TRACKING TABLES (NEW)
// ============================================================================

// 27. FACULTY SUBJECT ASSIGNMENTS (Faculty ↔ Subjects)
export const facultySubjectAssignments = pgTable(
  "faculty_subject_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    facultyId: uuid("faculty_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    semester: integer("semester").notNull(),
    academicYear: varchar("academic_year", { length: 32 }).notNull(),
    role: varchar("role", { length: 32 }).default("INSTRUCTOR").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique("faculty_subject_semester_unique").on(table.facultyId, table.subjectId, table.semester)]
);

// 28. SUBJECT ENROLLMENTS (Students ↔ Subjects)
export const subjectEnrollments = pgTable(
  "subject_enrollments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => studentProfiles.id, { onDelete: "cascade" }),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    semester: integer("semester").notNull(),
    academicYear: varchar("academic_year", { length: 32 }).notNull(),
    enrollmentStatus: varchar("enrollment_status", { length: 32 })
      .default("REGISTERED")
      .notNull(),
    enrollmentDate: date("enrollment_date").defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique("student_subject_semester_unique").on(table.studentId, table.subjectId, table.semester)]
);

// 29. SUBJECT ATTENDANCE
export const subjectAttendance = pgTable(
  "subject_attendance",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => studentProfiles.id, { onDelete: "cascade" }),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    date: date("date").defaultNow().notNull(),
    status: varchar("status", { length: 32 }).notNull(), // 'PRESENT', 'ABSENT', 'LATE'
    recordedBy: uuid("recorded_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique("student_subject_date_unique").on(table.studentId, table.subjectId, table.date)]
);

// 30. ASSIGNMENTS (Subject Assignments)
export const assignments = pgTable("assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  facultyId: uuid("faculty_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  maxMarks: integer("max_marks").default(100).notNull(),
  dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
  status: varchar("status", { length: 32 }).default("ACTIVE").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 31. ASSIGNMENT SUBMISSIONS (Student Submissions - Different from assessment_submissions)
export const assignmentSubmissions = pgTable("assignment_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  assignmentId: uuid("assignment_id")
    .notNull()
    .references(() => assignments.id, { onDelete: "cascade" }),
  studentId: uuid("student_id")
    .notNull()
    .references(() => studentProfiles.id, { onDelete: "cascade" }),
  submissionText: text("submission_text"),
  filePath: text("file_path"),
  marks: numeric("marks", { precision: 5, scale: 2 }),
  feedback: text("feedback"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
  gradedAt: timestamp("graded_at", { withTimezone: true }),
  status: varchar("status", { length: 32 }).default("SUBMITTED").notNull(),
});

// 32. SUBJECT ANNOUNCEMENTS
export const subjectAnnouncements = pgTable("subject_announcements", {
  id: uuid("id").primaryKey().defaultRandom(),
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  facultyId: uuid("faculty_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  priority: varchar("priority", { length: 32 }).default("NORMAL").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// 4. INFERRED TYPES FOR NEW TABLES
// ============================================================================

export type FacultySubjectAssignment = typeof facultySubjectAssignments.$inferSelect;
export type InsertFacultySubjectAssignment = typeof facultySubjectAssignments.$inferInsert;

export type SubjectEnrollment = typeof subjectEnrollments.$inferSelect;
export type InsertSubjectEnrollment = typeof subjectEnrollments.$inferInsert;

export type SubjectAttendance = typeof subjectAttendance.$inferSelect;
export type InsertSubjectAttendance = typeof subjectAttendance.$inferInsert;

export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = typeof assignments.$inferInsert;

export type AssignmentSubmission = typeof assignmentSubmissions.$inferSelect;
export type InsertAssignmentSubmission = typeof assignmentSubmissions.$inferInsert;

export type SubjectAnnouncement = typeof subjectAnnouncements.$inferSelect;
export type InsertSubjectAnnouncement = typeof subjectAnnouncements.$inferInsert;