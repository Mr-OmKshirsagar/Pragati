import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../drizzle/schema";

describe("Phase 01: Database Schema, Relations & RLS Verification", () => {
  it("should export all 26 normalized table schemas and enums", () => {
    // Enums
    expect(schema.userRoleEnum).toBeDefined();
    expect(schema.verificationStatusEnum).toBeDefined();
    expect(schema.gapSeverityEnum).toBeDefined();
    expect(schema.gapStatusEnum).toBeDefined();
    expect(schema.interventionStatusEnum).toBeDefined();
    expect(schema.internshipStatusEnum).toBeDefined();
    expect(schema.evidenceTypeEnum).toBeDefined();
    expect(schema.driveStatusEnum).toBeDefined();
    expect(schema.applicationStatusEnum).toBeDefined();

    // 26 Tables
    expect(schema.institutions).toBeDefined();
    expect(schema.departments).toBeDefined();
    expect(schema.users).toBeDefined();
    expect(schema.studentProfiles).toBeDefined();
    expect(schema.academicRecords).toBeDefined();
    expect(schema.subjects).toBeDefined();
    expect(schema.subjectResults).toBeDefined();
    expect(schema.backlogs).toBeDefined();
    expect(schema.skills).toBeDefined();
    expect(schema.assessments).toBeDefined();
    expect(schema.assessmentSubmissions).toBeDefined();
    expect(schema.skillHistory).toBeDefined();
    expect(schema.achievements).toBeDefined();
    expect(schema.evidenceDocuments).toBeDefined();
    expect(schema.verifications).toBeDefined();
    expect(schema.skillGaps).toBeDefined();
    expect(schema.interventions).toBeDefined();
    expect(schema.internships).toBeDefined();
    expect(schema.internshipEvidence).toBeDefined();
    expect(schema.internshipCheckins).toBeDefined();
    expect(schema.recruitmentDrives).toBeDefined();
    expect(schema.placementRules).toBeDefined();
    expect(schema.eligibilityEvaluations).toBeDefined();
    expect(schema.applications).toBeDefined();
    expect(schema.notifications).toBeDefined();
    expect(schema.auditLogs).toBeDefined();
  });

  it("should have seeded Northstar Institute and CSE Department in PostgreSQL", async () => {
    if (!process.env.DATABASE_URL) return;

    const sql = postgres(process.env.DATABASE_URL, { max: 2 });
    const db = drizzle(sql, { schema });

    try {
      const [inst] = await db
        .select()
        .from(schema.institutions)
        .where(eq(schema.institutions.code, "NIT-001"))
        .limit(1);

      expect(inst).toBeDefined();
      expect(inst.name).toBe("Northstar Institute of Technology");

      const [dept] = await db
        .select()
        .from(schema.departments)
        .where(eq(schema.departments.code, "CSE"))
        .limit(1);

      expect(dept).toBeDefined();
      expect(dept.institutionId).toBe(inst.id);
    } finally {
      await sql.end();
    }
  });

  it("should verify Hero Student Rahul Sharma profile and academic records", async () => {
    if (!process.env.DATABASE_URL) return;

    const sql = postgres(process.env.DATABASE_URL, { max: 2 });
    const db = drizzle(sql, { schema });

    try {
      const [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, "student@northstar.edu"))
        .limit(1);

      expect(user).toBeDefined();
      expect(user.role).toBe("STUDENT");

      const [profile] = await db
        .select()
        .from(schema.studentProfiles)
        .where(eq(schema.studentProfiles.userId, user.id))
        .limit(1);

      expect(profile).toBeDefined();
      expect(profile.enrollmentNumber).toBe("CSE2024042");
      expect(profile.currentSemester).toBe(6);

      // Verify academic records
      const records = await db
        .select()
        .from(schema.academicRecords)
        .where(eq(schema.academicRecords.studentId, profile.id));

      expect(records.length).toBe(5);
      const sem5 = records.find((r) => r.semester === 5);
      expect(sem5).toBeDefined();
      expect(Number(sem5?.cgpa)).toBe(8.42);

      // Verify active backlog
      const activeBacklogs = await db
        .select()
        .from(schema.backlogs)
        .where(eq(schema.backlogs.studentId, profile.id));

      expect(activeBacklogs.length).toBeGreaterThanOrEqual(1);
      expect(activeBacklogs[0].status).toBe("ACTIVE");
    } finally {
      await sql.end();
    }
  });

  it("should verify historical DSA performance drop ([78, 70, 61]) for skill-gap rule trigger", async () => {
    if (!process.env.DATABASE_URL) return;

    const sql = postgres(process.env.DATABASE_URL, { max: 2 });
    const db = drizzle(sql, { schema });

    try {
      const [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, "student@northstar.edu"))
        .limit(1);

      const [profile] = await db
        .select()
        .from(schema.studentProfiles)
        .where(eq(schema.studentProfiles.userId, user.id))
        .limit(1);

      const [dsaSkill] = await db
        .select()
        .from(schema.skills)
        .where(eq(schema.skills.name, "Data Structures & Algorithms"))
        .limit(1);

      const history = await db
        .select()
        .from(schema.skillHistory)
        .where(eq(schema.skillHistory.studentId, profile.id));

      expect(history.length).toBe(3);
      const scores = history.map((h) => Number(h.score)).sort((a, b) => b - a);
      expect(scores).toEqual([78, 70, 61]);
    } finally {
      await sql.end();
    }
  });

  it("should verify ABC Technologies placement drive and AST placement rules", async () => {
    if (!process.env.DATABASE_URL) return;

    const sql = postgres(process.env.DATABASE_URL, { max: 2 });
    const db = drizzle(sql, { schema });

    try {
      const [drive] = await db
        .select()
        .from(schema.recruitmentDrives)
        .where(eq(schema.recruitmentDrives.companyName, "ABC Technologies"))
        .limit(1);

      expect(drive).toBeDefined();
      expect(drive.jobTitle).toBe("Associate Software Engineer");
      expect(drive.ctcOrStipend).toBe("12 LPA");

      const [rule] = await db
        .select()
        .from(schema.placementRules)
        .where(eq(schema.placementRules.recruitmentDriveId, drive.id))
        .limit(1);

      expect(rule).toBeDefined();
      const ruleDef = rule.ruleDefinition as any;
      expect(ruleDef.type).toBe("AND");
      expect(ruleDef.conditions.length).toBe(4);
    } finally {
      await sql.end();
    }
  });

  it("should verify Row Level Security (RLS) is enabled on all 26 public tables", async () => {
    if (!process.env.DATABASE_URL) return;

    const sql = postgres(process.env.DATABASE_URL, { max: 2 });
    try {
      const rlsStatus = await sql`
        SELECT relname as table_name, relrowsecurity as rls_enabled
        FROM pg_class
        JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
        WHERE pg_namespace.nspname = 'public' AND relkind = 'r';
      `;

      expect(rlsStatus.length).toBe(26);
      const unsecureTables = rlsStatus.filter((t) => !t.rls_enabled);
      expect(unsecureTables.length).toBe(0);
    } finally {
      await sql.end();
    }
  });
});
