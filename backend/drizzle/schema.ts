import { pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

// ============================================================================
// 1. ENUMS
// ============================================================================
export const userRoleEnum = pgEnum("user_role", [
  "STUDENT",
  "FACULTY",
  "HOD",
  "TNP_COORDINATOR",
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

// ============================================================================
// 2. FOUNDATIONAL TABLES (Phase 00 Foundation, expanded in Phase 01)
// ============================================================================

export const institutions = pgTable("institutions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const departments = pgTable("departments", {
  id: uuid("id").primaryKey().defaultRandom(),
  institutionId: uuid("institution_id")
    .references(() => institutions.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  code: varchar("code", { length: 32 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable("users", {
  /** Matches Supabase auth.users(id) */
  id: uuid("id").primaryKey(),
  institutionId: uuid("institution_id").references(() => institutions.id, {
    onDelete: "set null",
  }),
  departmentId: uuid("department_id").references(() => departments.id, {
    onDelete: "set null",
  }),
  email: varchar("email", { length: 320 }).notNull().unique(),
  fullName: text("full_name").notNull(),
  role: userRoleEnum("role").notNull().default("STUDENT"),
  avatarUrl: text("avatar_url"),
  isActive: text("is_active").notNull().default("true"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Institution = typeof institutions.$inferSelect;
export type Department = typeof departments.$inferSelect;
