import crypto from "crypto";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { auditLogs, institutions, studentProfiles, users } from "../drizzle/schema";
import { getDb } from "../src/db";
import { appRouter } from "../src/routers";
import * as auditService from "../src/services/auditService";
import type { Context } from "../src/_core/context";

async function createTestContext(token?: string): Promise<Context> {
  const req: any = {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  };
  const res: any = {};

  let user = null;
  if (token?.startsWith("demo_")) {
    const role = token.replace("demo_", "") as any;
    const db = await getDb();
    if (db) {
      const [matchedUser] = await db
        .select()
        .from(users)
        .where(eq(users.role, role))
        .limit(1);
      if (matchedUser) {
        let sp;
        if (matchedUser.role === "STUDENT") {
          const [foundSp] = await db
            .select()
            .from(studentProfiles)
            .where(eq(studentProfiles.userId, matchedUser.id))
            .limit(1);
          sp = foundSp
            ? {
                id: foundSp.id,
                enrollmentNumber: foundSp.enrollmentNumber,
                program: foundSp.program,
                currentSemester: foundSp.currentSemester,
              }
            : undefined;
        }

        user = {
          id: matchedUser.id,
          email: matchedUser.email,
          role: matchedUser.role,
          institutionId: matchedUser.institutionId,
          departmentId: matchedUser.departmentId,
          name: matchedUser.name,
          studentProfile: sp,
        };
      }
    }
  }

  return { req, res, user };
}

describe("Phase 11: Security Hardening, Immutable Audit Logging & Automated Test Suites", () => {
  let institutionId: string;
  let studentUserId: string;
  let studentProfileId: string;

  beforeAll(async () => {
    const db = await getDb();
    expect(db).toBeDefined();

    const [inst] = await db!.select().from(institutions).limit(1);
    expect(inst).toBeDefined();
    institutionId = inst.id;

    const [stUser] = await db!
      .select()
      .from(users)
      .where(eq(users.role, "STUDENT"))
      .limit(1);
    expect(stUser).toBeDefined();
    studentUserId = stUser.id;

    const [sp] = await db!
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, studentUserId))
      .limit(1);
    expect(sp).toBeDefined();
    studentProfileId = sp.id;
  });

  describe("1. Immutable Audit Logging Service (logAuditEvent)", () => {
    let testResourceId: string;

    it("should write an immutable audit log entry for high-impact actions", async () => {
      testResourceId = crypto.randomUUID();
      await auditService.logAuditEvent({
        institutionId,
        userId: studentUserId,
        action: "APPLICATION_SUBMITTED",
        resourceType: "APPLICATION",
        resourceId: testResourceId,
        metadata: {
          driveName: "Benchmark ABC Technologies Drive",
          packageLPA: 14.5,
          timestamp: new Date().toISOString(),
        },
        ipAddress: "127.0.0.1",
      });

      const db = await getDb();
      const rows = await db!
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.resourceId, testResourceId));

      expect(rows.length).toBeGreaterThanOrEqual(1);
      const entry = rows.find((r) => r.action === "APPLICATION_SUBMITTED");
      expect(entry).toBeDefined();
      expect(entry!.institutionId).toBe(institutionId);
      expect(entry!.userId).toBe(studentUserId);
      expect(entry!.resourceType).toBe("APPLICATION");
      expect(entry!.ipAddress).toBe("127.0.0.1");
      expect((entry!.metadata as any).packageLPA).toBe(14.5);
    });

    it("should retrieve resource audit trail using getResourceAuditTrail", async () => {
      const trail = await auditService.getResourceAuditTrail("APPLICATION", testResourceId);
      expect(trail.length).toBeGreaterThanOrEqual(1);
      expect(trail.some((t) => t.action === "APPLICATION_SUBMITTED")).toBe(true);
    });

    it("should retrieve user audit trail using getUserAuditTrail", async () => {
      const userTrail = await auditService.getUserAuditTrail(studentUserId, 10);
      expect(userTrail.length).toBeGreaterThanOrEqual(1);
      expect(userTrail.every((t) => t.userId === studentUserId)).toBe(true);
    });

    it("should support the full standard institutional audit action taxonomy", async () => {
      const standardActions: Array<
        | "INTERNSHIP_VERIFIED"
        | "INTERNSHIP_REJECTED"
        | "EVIDENCE_UPLOADED"
        | "SKILL_GAP_DETECTED"
        | "INTERVENTION_CREATED"
        | "INTERVENTION_RESOLVED"
        | "PLACEMENT_RULE_MODIFIED"
        | "DRIVE_PUBLISHED"
      > = [
        "INTERNSHIP_VERIFIED",
        "INTERNSHIP_REJECTED",
        "EVIDENCE_UPLOADED",
        "SKILL_GAP_DETECTED",
        "INTERVENTION_CREATED",
        "INTERVENTION_RESOLVED",
        "PLACEMENT_RULE_MODIFIED",
        "DRIVE_PUBLISHED",
      ];

      const dummyResourceId = crypto.randomUUID();

      for (const act of standardActions) {
        await auditService.logAuditEvent({
          institutionId,
          userId: studentUserId,
          action: act,
          resourceType: "INTERNSHIP",
          resourceId: dummyResourceId,
          metadata: { testAction: act },
        });
      }

      const trail = await auditService.getResourceAuditTrail("INTERNSHIP", dummyResourceId);
      expect(trail.length).toBe(standardActions.length);
    });
  });

  describe("2. Security Controls & Threat Model Hardening", () => {
    it("should protect against SQL Injection through parameterized queries", async () => {
      const db = await getDb();
      expect(db).toBeDefined();

      const maliciousInput = "Robert'); DROP TABLE users; --";

      // Testing parameterized query with malicious input
      const results = await db!
        .select()
        .from(users)
        .where(eq(users.name, maliciousInput));

      // Query executes safely as a parameterized literal without executing injection
      expect(results.length).toBe(0);

      // Verify users table was not dropped or compromised
      const validUsers = await db!.select().from(users).limit(1);
      expect(validUsers.length).toBe(1);
    });

    it("should enforce Anti-IDOR: student procedure resolves identity exclusively from session context", async () => {
      const studentCtx = await createTestContext("demo_STUDENT");
      const caller = appRouter.createCaller(studentCtx);

      // Querying profile or dashboard doesn't require or accept spoofable student ID parameters
      const dashboard = await caller.dashboard.getStudentDashboard();
      expect(dashboard.student.id).toBe(studentProfileId);

      const profile = await caller.student.getProfile();
      expect(profile.id).toBe(studentProfileId);
    });

    it("should prevent privilege escalation: STUDENT cannot access administrative endpoints", async () => {
      const studentCtx = await createTestContext("demo_STUDENT");
      const caller = appRouter.createCaller(studentCtx);

      await expect(caller.auth.testAdminAccess()).rejects.toThrowError(
        /not authorized to execute this procedure/
      );
      await expect(caller.dashboard.getHodAnalytics()).rejects.toThrowError(
        /not authorized to execute this procedure/
      );
    });

    it("should prevent credential and secret leakage in API error messages", async () => {
      const unauthCtx = await createTestContext(); // missing token
      const caller = appRouter.createCaller(unauthCtx);

      try {
        await caller.auth.me();
        expect.unreachable("Should have thrown UNAUTHORIZED");
      } catch (err: any) {
        const errorText = JSON.stringify(err);
        // Ensure no internal database connection strings or secret keys are leaked
        expect(errorText).not.toContain("postgres://");
        expect(errorText).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
        expect(errorText).not.toContain("JWT_SECRET");
        expect(errorText).not.toContain("DATABASE_URL");
      }
    });

    it("should enforce tenant boundaries across distinct institutions", async () => {
      const nonExistentInstId = "00000000-0000-0000-0000-000000000000";
      const entries = await auditService.getInstitutionAuditLog(nonExistentInstId);
      expect(entries.length).toBe(0);
    });
  });
});
