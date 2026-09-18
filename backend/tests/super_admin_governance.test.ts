import { describe, expect, it } from "vitest";
import { appRouter } from "../src/routers";
import { getDb } from "../src/db";
import { institutions, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import type { Context } from "../src/_core/context";

// Helper to create test context
function createTestUserContext(overrides?: Partial<Context["user"]>): Context {
  const defaultUser = {
    id: "user-test-01",
    email: "user@northstar.edu",
    role: "STUDENT" as const,
    institutionId: "10000000-0000-0000-0000-000000000000",
    name: "Test User",
  };

  return {
    req: {} as any,
    res: {} as any,
    user: overrides ? ({ ...defaultUser, ...overrides } as any) : defaultUser,
  };
}

function createSuperAdminContext(): Context {
  return {
    req: {} as any,
    res: {} as any,
    user: {
      id: "00000000-0000-0000-0000-000000000000",
      email: "omkshirsagar.login@gmail.com",
      role: "SUPER_ADMIN",
      institutionId: "00000000-0000-0000-0000-000000000000",
      name: "Platform Owner",
      isSuperAdmin: true,
    },
  };
}

describe("Phase 13: Multi-Tenant Architecture & Super Admin Governance", () => {
  let createdInstId: string;

  // 1. RBAC & Cloner Lockout Test
  it("should forbid non-super-admin roles from accessing superAdmin procedures", async () => {
    const studentCtx = createTestUserContext({ role: "STUDENT" });
    const studentCaller = appRouter.createCaller(studentCtx);

    await expect(studentCaller.superAdmin.getPlatformStats()).rejects.toThrowError(
      /Platform Owner/
    );

    const adminCtx = createTestUserContext({ role: "ADMIN" });
    const adminCaller = appRouter.createCaller(adminCtx);

    await expect(adminCaller.superAdmin.getPlatformStats()).rejects.toThrowError(
      /Platform Owner/
    );
  });

  it("should allow verified Super Admin to fetch global platform analytics", async () => {
    const saCtx = createSuperAdminContext();
    const saCaller = appRouter.createCaller(saCtx);

    const stats = await saCaller.superAdmin.getPlatformStats();
    expect(stats).toBeDefined();
    expect(typeof stats.totalInstitutions).toBe("number");
    expect(typeof stats.activeInstitutions).toBe("number");
  });

  // 2. Provision New Real Institution
  it("should allow Super Admin to provision a new real institution and admin account", async () => {
    const saCtx = createSuperAdminContext();
    const saCaller = appRouter.createCaller(saCtx);

    const uniqueCode = `APEX-${Date.now().toString().slice(-6)}`;
    const result = await saCaller.superAdmin.provisionInstitution({
      name: "Apex Technical Institute",
      code: uniqueCode,
      domain: "apex.edu",
      universityBoard: "National Technical University",
      address: "45 Innovation Way",
      city: "Bengaluru",
      state: "Karnataka",
      contactPhone: "+91 80 1234 5678",
      contactEmail: "contact@apex.edu",
      adminName: "Dr. Arvind Rao",
      adminEmail: `admin.${uniqueCode.toLowerCase()}@apex.edu`,
      adminPhone: "+91 98765 43210",
      adminDesignation: "Director & Principal",
      adminEmployeeId: `EMP-${uniqueCode}`,
    });

    expect(result.success).toBe(true);
    expect(result.institution).toBeDefined();
    expect(result.institution.name).toBe("Apex Technical Institute");
    expect(result.institution.isDemo).toBe(false);
    expect(result.institution.status).toBe("ACTIVE");
    expect(result.admin).toBeDefined();
    expect(result.admin.role).toBe("ADMIN");

    createdInstId = result.institution.id;
  });

  // 3. Multi-Tenant & Demo Segregation
  it("should separate demo sandbox from real institution queries", async () => {
    const saCtx = createSuperAdminContext();
    const saCaller = appRouter.createCaller(saCtx);

    const allInsts = await saCaller.superAdmin.listInstitutions({ includeDemo: true });
    const realOnlyInsts = await saCaller.superAdmin.listInstitutions({ includeDemo: false });

    // Verify realOnly list excludes any institution marked isDemo === true
    for (const inst of realOnlyInsts) {
      expect(inst.isDemo).toBe(false);
    }

    expect(allInsts.length).toBeGreaterThanOrEqual(realOnlyInsts.length);
  });

  // 4. Institutional Suspension Cascade Lockout
  it("should suspend an institution and cascade lockout to all its users with reason", async () => {
    const saCtx = createSuperAdminContext();
    const saCaller = appRouter.createCaller(saCtx);

    const reason = "Annual accreditation compliance renewal in progress.";
    const suspendResult = await saCaller.superAdmin.suspendInstitution({
      institutionId: createdInstId,
      reason,
    });

    expect(suspendResult.success).toBe(true);
    expect(suspendResult.institution.status).toBe("SUSPENDED");
    expect(suspendResult.institution.suspensionReason).toBe(reason);

    // Verify tenant user from this institution is locked out on API calls
    const tenantUserCtx = createTestUserContext({
      institutionId: createdInstId,
      role: "ADMIN",
    });
    const tenantCaller = appRouter.createCaller(tenantUserCtx);

    await expect(tenantCaller.auth.testAdminAccess()).rejects.toThrowError(
      new RegExp(`INSTITUTION_SUSPENDED: ${reason}`)
    );
  });

  // 5. Revive Institution
  it("should revive suspended institution and restore operational access", async () => {
    const saCtx = createSuperAdminContext();
    const saCaller = appRouter.createCaller(saCtx);

    const reviveResult = await saCaller.superAdmin.reviveInstitution({
      institutionId: createdInstId,
    });

    expect(reviveResult.success).toBe(true);
    expect(reviveResult.institution.status).toBe("ACTIVE");
    expect(reviveResult.institution.suspensionReason).toBeNull();

    // Verify tenant user is no longer locked out
    const tenantUserCtx = createTestUserContext({
      institutionId: createdInstId,
      role: "ADMIN",
    });
    const tenantCaller = appRouter.createCaller(tenantUserCtx);

    const accessResult = await tenantCaller.auth.testAdminAccess();
    expect(accessResult.authorized).toBe(true);
  });

  // 6. 30-Day Soft Delete & Recovery
  it("should soft-delete an institution into 30-day trash and restore it", async () => {
    const saCtx = createSuperAdminContext();
    const saCaller = appRouter.createCaller(saCtx);

    // Soft delete
    const deleteResult = await saCaller.superAdmin.softDeleteInstitution({
      institutionId: createdInstId,
    });
    expect(deleteResult.success).toBe(true);

    // Verify it appears in trash with remaining days
    const trashItems = await saCaller.superAdmin.listTrash();
    const trashed = trashItems.find(t => t.resourceId === createdInstId);
    expect(trashed).toBeDefined();
    expect(trashed?.daysRemaining).toBe(30);
    expect(trashed?.isExpired).toBe(false);

    // Verify hidden from active listings
    const activeInsts = await saCaller.superAdmin.listInstitutions({ status: "ACTIVE" });
    expect(activeInsts.find(i => i.id === createdInstId)).toBeUndefined();

    // Restore from trash
    const restoreResult = await saCaller.superAdmin.restoreFromTrash({
      resourceType: "INSTITUTION",
      resourceId: createdInstId,
    });
    expect(restoreResult.success).toBe(true);

    // Verify restored back to active
    const restoredInsts = await saCaller.superAdmin.listInstitutions();
    const restored = restoredInsts.find(i => i.id === createdInstId);
    expect(restored).toBeDefined();
    expect(restored?.isDeleted).toBe(false);
  });
});
