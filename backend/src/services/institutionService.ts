import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import {
  departments,
  institutionChangeRequests,
  institutions,
  studentProfiles,
  users,
  type Institution,
  type InstitutionChangeRequest,
} from "../../drizzle/schema";
import { suspendedInstitutionsCache } from "../_core/trpc";
import { getDb } from "../db";

export interface ProvisionInstitutionInput {
  name: string;
  code: string;
  domain: string;
  universityBoard: string;
  address: string;
  city: string;
  state: string;
  contactPhone: string;
  contactEmail: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  adminDesignation: string;
  adminEmployeeId: string;
}

/**
 * 1. Get Global Platform Analytics
 */
export async function getPlatformStats() {
  const db = await getDb();
  if (!db) {
    return {
      totalInstitutions: 0,
      activeInstitutions: 0,
      suspendedInstitutions: 0,
      demoInstitutions: 0,
      totalUsers: 0,
      totalStudents: 0,
    };
  }

  const allInsts = await db.select().from(institutions);
  const activeInsts = allInsts.filter(i => !i.isDeleted && i.status === "ACTIVE");
  const suspendedInsts = allInsts.filter(i => !i.isDeleted && i.status === "SUSPENDED");
  const demoInsts = allInsts.filter(i => i.isDemo && !i.isDeleted);

  const allUsers = await db.select().from(users);
  const studentCount = allUsers.filter(u => u.role === "STUDENT").length;

  return {
    totalInstitutions: allInsts.filter(i => !i.isDeleted).length,
    activeInstitutions: activeInsts.length,
    suspendedInstitutions: suspendedInsts.length,
    demoInstitutions: demoInsts.length,
    totalUsers: allUsers.length,
    totalStudents: studentCount,
  };
}

/**
 * 2. List Institutions with Filtering
 */
export async function listInstitutions(params?: {
  status?: "ACTIVE" | "SUSPENDED" | "ALL";
  includeDemo?: boolean;
  search?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(institutions).where(eq(institutions.isDeleted, false));

  const results = await query;

  return results.filter(inst => {
    // Demo filtering
    if (params?.includeDemo === false && inst.isDemo) return false;

    // Status filtering
    if (params?.status && params.status !== "ALL" && inst.status !== params.status) {
      return false;
    }

    // Search filtering
    if (params?.search) {
      const q = params.search.toLowerCase();
      const matchName = inst.name.toLowerCase().includes(q);
      const matchCode = inst.code.toLowerCase().includes(q);
      const matchDomain = (inst.domain || "").toLowerCase().includes(q);
      const matchCity = (inst.city || "").toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchDomain && !matchCity) return false;
    }

    return true;
  });
}

/**
 * 3. Get Single Institution Details
 */
export async function getInstitutionById(id: string) {
  const db = await getDb();
  if (!db) return null;

  const [inst] = await db
    .select()
    .from(institutions)
    .where(eq(institutions.id, id))
    .limit(1);

  if (!inst) return null;

  // Fetch administrator
  const [adminUser] = await db
    .select()
    .from(users)
    .where(and(eq(users.institutionId, id), eq(users.role, "ADMIN")))
    .limit(1);

  // Count departments
  const depts = await db
    .select()
    .from(departments)
    .where(eq(departments.institutionId, id));

  return {
    ...inst,
    admin: adminUser || null,
    departmentsCount: depts.length,
  };
}

/**
 * 4. Provision New Institution & College Admin
 */
export async function provisionInstitution(input: ProvisionInstitutionInput) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  // Verify unique code
  const [existing] = await db
    .select()
    .from(institutions)
    .where(eq(institutions.code, input.code))
    .limit(1);

  if (existing) {
    throw new Error(`Institution with code '${input.code}' already exists.`);
  }

  // 1. Insert Institution
  const [newInst] = await db
    .insert(institutions)
    .values({
      name: input.name,
      code: input.code,
      domain: input.domain,
      universityBoard: input.universityBoard,
      address: input.address,
      city: input.city,
      state: input.state,
      contactPhone: input.contactPhone,
      contactEmail: input.contactEmail,
      isDemo: false,
      status: "ACTIVE",
      isDeleted: false,
    })
    .returning();

  // 2. Insert Default Department (Computer Science & Engineering)
  const [defaultDept] = await db
    .insert(departments)
    .values({
      institutionId: newInst.id,
      name: "Computer Science & Engineering",
      code: "CSE",
    })
    .returning();

  // 3. Provision Institutional Administrator
  const adminId = crypto.randomUUID();
  const [adminUser] = await db
    .insert(users)
    .values({
      id: adminId,
      institutionId: newInst.id,
      departmentId: defaultDept.id,
      name: input.adminName,
      email: input.adminEmail.toLowerCase(),
      role: "ADMIN",
      isActive: true,
    })
    .returning();

  return {
    institution: newInst,
    admin: adminUser,
  };
}

/**
 * 5. Suspend Institution (Cascades Lockout with Reason)
 */
export async function suspendInstitution(institutionId: string, reason: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [updated] = await db
    .update(institutions)
    .set({
      status: "SUSPENDED",
      suspensionReason: reason,
      suspendedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(institutions.id, institutionId))
    .returning();

  if (!updated) {
    throw new Error("Institution not found");
  }

  // Update in-memory suspension cache immediately
  suspendedInstitutionsCache.set(institutionId, reason);

  return updated;
}

/**
 * 6. Revive Suspended Institution
 */
export async function reviveInstitution(institutionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [updated] = await db
    .update(institutions)
    .set({
      status: "ACTIVE",
      suspensionReason: null,
      suspendedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(institutions.id, institutionId))
    .returning();

  if (!updated) {
    throw new Error("Institution not found");
  }

  // Remove from suspension cache immediately
  suspendedInstitutionsCache.delete(institutionId);

  return updated;
}

/**
 * 7. Soft Delete Institution (Starts 30-Day Recovery Countdown)
 */
export async function softDeleteInstitution(institutionId: string, deletedBy?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [updated] = await db
    .update(institutions)
    .set({
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: deletedBy || null,
      updatedAt: new Date(),
    })
    .where(eq(institutions.id, institutionId))
    .returning();

  if (!updated) {
    throw new Error("Institution not found");
  }

  // Also remove from active suspension cache
  suspendedInstitutionsCache.delete(institutionId);

  return updated;
}

/**
 * 8. List 30-Day Trash Pool
 */
export async function listTrashItems() {
  const db = await getDb();
  if (!db) return [];

  const deletedInsts = await db
    .select()
    .from(institutions)
    .where(eq(institutions.isDeleted, true))
    .orderBy(desc(institutions.deletedAt));

  const now = Date.now();
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

  return deletedInsts.map(inst => {
    const deletedTime = inst.deletedAt ? new Date(inst.deletedAt).getTime() : now;
    const elapsed = now - deletedTime;
    const remainingMs = Math.max(0, THIRTY_DAYS_MS - elapsed);
    const daysRemaining = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
    const isExpired = elapsed > THIRTY_DAYS_MS;

    return {
      resourceType: "INSTITUTION" as const,
      resourceId: inst.id,
      name: inst.name,
      code: inst.code,
      deletedAt: inst.deletedAt,
      daysRemaining,
      isExpired,
    };
  });
}

/**
 * 9. Restore Entity from 30-Day Trash Pool
 */
export async function restoreFromTrash(resourceType: "INSTITUTION" | "USER" | "DEPARTMENT", resourceId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  if (resourceType === "INSTITUTION") {
    const [inst] = await db
      .select()
      .from(institutions)
      .where(eq(institutions.id, resourceId))
      .limit(1);

    if (!inst) throw new Error("Item not found in trash");
    if (!inst.isDeleted) throw new Error("Item is not deleted");

    // Check 30-day expiration window
    if (inst.deletedAt) {
      const elapsed = Date.now() - new Date(inst.deletedAt).getTime();
      const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
      if (elapsed > THIRTY_DAYS_MS) {
        throw new Error("Recovery window expired. Items deleted more than 30 days ago cannot be restored.");
      }
    }

    const [restored] = await db
      .update(institutions)
      .set({
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        updatedAt: new Date(),
      })
      .where(eq(institutions.id, resourceId))
      .returning();

    return { success: true, item: restored };
  }

  throw new Error(`Restoration for ${resourceType} not supported yet.`);
}

/**
 * 10. Submit Institution Change Request (by College Admin)
 */
export async function submitChangeRequest(params: {
  institutionId: string;
  requestedBy: string;
  requestedChanges: Record<string, unknown>;
  reason: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [req] = await db
    .insert(institutionChangeRequests)
    .values({
      institutionId: params.institutionId,
      requestedBy: params.requestedBy,
      requestedChanges: params.requestedChanges,
      reason: params.reason,
      status: "PENDING",
    })
    .returning();

  return req;
}

/**
 * 11. List Change Requests (for Super Admin review)
 */
export async function listChangeRequests(status?: "PENDING" | "APPROVED" | "REJECTED") {
  const db = await getDb();
  if (!db) return [];

  const requests = await db
    .select({
      id: institutionChangeRequests.id,
      institutionId: institutionChangeRequests.institutionId,
      institutionName: institutions.name,
      requestedBy: institutionChangeRequests.requestedBy,
      requestedByName: users.name,
      requestedChanges: institutionChangeRequests.requestedChanges,
      reason: institutionChangeRequests.reason,
      status: institutionChangeRequests.status,
      reviewNotes: institutionChangeRequests.reviewNotes,
      reviewedAt: institutionChangeRequests.reviewedAt,
      createdAt: institutionChangeRequests.createdAt,
    })
    .from(institutionChangeRequests)
    .leftJoin(institutions, eq(institutionChangeRequests.institutionId, institutions.id))
    .leftJoin(users, eq(institutionChangeRequests.requestedBy, users.id))
    .orderBy(desc(institutionChangeRequests.createdAt));

  if (status) {
    return requests.filter(r => r.status === status);
  }
  return requests;
}

/**
 * 12. Review Institution Change Request (Approve or Reject by Super Admin)
 */
export async function reviewChangeRequest(params: {
  requestId: string;
  action: "APPROVE" | "REJECT";
  notes?: string;
  reviewedBy: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [req] = await db
    .select()
    .from(institutionChangeRequests)
    .where(eq(institutionChangeRequests.id, params.requestId))
    .limit(1);

  if (!req) throw new Error("Change request not found");
  if (req.status !== "PENDING") {
    throw new Error(`Change request is already ${req.status}`);
  }

  // If approved, apply changes to the institution
  if (params.action === "APPROVE") {
    const changes = req.requestedChanges as Record<string, unknown>;
    const allowedFields: (keyof typeof institutions.$inferInsert)[] = [
      "name",
      "domain",
      "universityBoard",
      "address",
      "city",
      "state",
      "contactPhone",
      "contactEmail",
    ];

    const sanitizedUpdates: Record<string, unknown> = { updatedAt: new Date() };
    for (const field of allowedFields) {
      if (changes[field] !== undefined) {
        sanitizedUpdates[field] = changes[field];
      }
    }

    await db
      .update(institutions)
      .set(sanitizedUpdates)
      .where(eq(institutions.id, req.institutionId));
  }

  const [updatedReq] = await db
    .update(institutionChangeRequests)
    .set({
      status: params.action === "APPROVE" ? "APPROVED" : "REJECTED",
      reviewedBy: params.reviewedBy,
      reviewNotes: params.notes || null,
      reviewedAt: new Date(),
    })
    .where(eq(institutionChangeRequests.id, params.requestId))
    .returning();

  return updatedReq;
}
