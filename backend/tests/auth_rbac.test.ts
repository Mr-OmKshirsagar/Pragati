import { describe, expect, it } from "vitest";
import { appRouter } from "../src/routers";
import { getDb } from "../src/db";
import { users, studentProfiles } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import type { Context } from "../src/_core/context";

// Helper to create test context with simulated user
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
      const [matchedUser] = await db.select().from(users).where(eq(users.role, role)).limit(1);
      if (matchedUser) {
        let sp;
        if (matchedUser.role === "STUDENT") {
          const [foundSp] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, matchedUser.id)).limit(1);
          sp = foundSp ? {
            id: foundSp.id,
            enrollmentNumber: foundSp.enrollmentNumber,
            program: foundSp.program,
            currentSemester: foundSp.currentSemester,
          } : undefined;
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

describe("Phase 02: Authentication & 5-Role RBAC", () => {
  it("should reject unauthenticated request to auth.me with UNAUTHORIZED", async () => {
    const ctx = await createTestContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.auth.me()).rejects.toThrowError(/Session expired or missing authentication token/);
  });

  it("should support demoLogin for STUDENT persona (Rahul Sharma)", async () => {
    const ctx = await createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.demoLogin({ role: "STUDENT" });
    expect(result.success).toBe(true);
    expect(result.token).toBe("demo_STUDENT");
    expect(result.user.name).toBe("Rahul Sharma");
    expect(result.user.role).toBe("STUDENT");
    expect(result.user.studentProfile?.enrollmentNumber).toBe("CSE2024042");
  });

  it("should support demoLogin for FACULTY persona (Dr. Anand Verma)", async () => {
    const ctx = await createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.demoLogin({ role: "FACULTY" });
    expect(result.success).toBe(true);
    expect(result.token).toBe("demo_FACULTY");
    expect(result.user.name).toBe("Dr. Anand Verma");
    expect(result.user.role).toBe("FACULTY");
  });

  it("should allow STUDENT to access studentProcedure and protect against IDOR", async () => {
    const studentCtx = await createTestContext("demo_STUDENT");
    const caller = appRouter.createCaller(studentCtx);

    const result = await caller.auth.testStudentAccess();
    expect(result.authorized).toBe(true);
    expect(result.role).toBe("STUDENT");
    // Anti-IDOR check: profile ID is resolved strictly from session context
    expect(result.studentProfileId).toBe(studentCtx.user?.studentProfile?.id);
  });

  it("should FORBID a STUDENT from accessing facultyProcedure", async () => {
    const studentCtx = await createTestContext("demo_STUDENT");
    const caller = appRouter.createCaller(studentCtx);

    await expect(caller.auth.testFacultyAccess()).rejects.toThrowError(/not authorized to execute this procedure/);
  });

  it("should allow FACULTY to access facultyProcedure and FORBID from studentProcedure", async () => {
    const facultyCtx = await createTestContext("demo_FACULTY");
    const caller = appRouter.createCaller(facultyCtx);

    const facultyResult = await caller.auth.testFacultyAccess();
    expect(facultyResult.authorized).toBe(true);
    expect(facultyResult.role).toBe("FACULTY");

    await expect(caller.auth.testStudentAccess()).rejects.toThrowError(/not authorized to execute this procedure/);
  });

  it("should allow ADMIN to access adminProcedure and FORBID faculty", async () => {
    const adminCtx = await createTestContext("demo_ADMIN");
    const adminCaller = appRouter.createCaller(adminCtx);

    const adminResult = await adminCaller.auth.testAdminAccess();
    expect(adminResult.authorized).toBe(true);
    expect(adminResult.role).toBe("ADMIN");

    const facultyCtx = await createTestContext("demo_FACULTY");
    const facultyCaller = appRouter.createCaller(facultyCtx);
    await expect(facultyCaller.auth.testAdminAccess()).rejects.toThrowError(/not authorized to execute this procedure/);
  });
});
