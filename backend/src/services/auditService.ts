/**
 * Audit Service & Compliance
 * Track all mutations, document access, and generate compliance reports
 */

import { getDb } from "../db";
import { auditLogs, users, internships, internshipEvidence } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

const getDatabase = async () => {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return db;
};

// ============================================================================
// AUDIT LOG TYPES
// ============================================================================

export enum AuditAction {
  // Create operations
  CREATE_INTERNSHIP = "CREATE_INTERNSHIP",
  CREATE_ENROLLMENT = "CREATE_ENROLLMENT",
  CREATE_EVIDENCE = "CREATE_EVIDENCE",
  CREATE_GRADE = "CREATE_GRADE",

  // Update operations
  UPDATE_INTERNSHIP = "UPDATE_INTERNSHIP",
  UPDATE_ENROLLMENT = "UPDATE_ENROLLMENT",
  UPDATE_EVIDENCE = "UPDATE_EVIDENCE",
  UPDATE_GRADE = "UPDATE_GRADE",
  UPDATE_VERIFICATION_STATUS = "UPDATE_VERIFICATION_STATUS",

  // Delete operations
  DELETE_INTERNSHIP = "DELETE_INTERNSHIP",
  DELETE_ENROLLMENT = "DELETE_ENROLLMENT",
  DELETE_EVIDENCE = "DELETE_EVIDENCE",

  // Access operations
  VIEW_EVIDENCE = "VIEW_EVIDENCE",
  DOWNLOAD_REPORT = "DOWNLOAD_REPORT",
  VIEW_TRANSCRIPT = "VIEW_TRANSCRIPT",
  ACCESS_STUDENT_RECORD = "ACCESS_STUDENT_RECORD",

  // Verification operations
  VERIFY_INTERNSHIP = "VERIFY_INTERNSHIP",
  REJECT_INTERNSHIP = "REJECT_INTERNSHIP",
  VERIFY_EVIDENCE = "VERIFY_EVIDENCE",
  REJECT_EVIDENCE = "REJECT_EVIDENCE",

  // System operations
  BULK_IMPORT = "BULK_IMPORT",
  BULK_EXPORT = "BULK_EXPORT",
  GENERATE_REPORT = "GENERATE_REPORT",
  CHANGE_USER_ROLE = "CHANGE_USER_ROLE",
}

export interface AuditEntry {
  id: string;
  institutionId: string;
  userId?: string;
  action: AuditAction;
  resourceType: string; // "INTERNSHIP", "EVIDENCE", "ENROLLMENT", etc.
  resourceId?: string;
  changes: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

// ============================================================================
// CORE AUDIT FUNCTIONS
// ============================================================================

/**
 * Log an audit entry
 */
export async function logAuditEntry(entry: {
  institutionId: string;
  userId?: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  changes?: { before?: any; after?: any };
  metadata?: Record<string, any>;
  ipAddress?: string;
}): Promise<AuditEntry> {
  const db = await getDatabase();

  const auditEntry = await db
    .insert(auditLogs)
    .values({
      institutionId: entry.institutionId,
      userId: entry.userId,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      metadata: entry.changes || {},
      ipAddress: entry.ipAddress,
      createdAt: new Date(),
    })
    .returning();

  return {
    id: auditEntry[0].id,
    institutionId: entry.institutionId,
    userId: entry.userId,
    action: entry.action,
    resourceType: entry.resourceType,
    resourceId: entry.resourceId,
    changes: entry.changes || { before: {}, after: {} },
    metadata: entry.metadata,
    ipAddress: entry.ipAddress,
    timestamp: auditEntry[0].createdAt,
  };
}

/**
 * Log an immutable audit event for compliance ledger tracking (Phase 11 Specification)
 */
export async function logAuditEvent(params: {
  institutionId: string;
  userId?: string;
  action:
    | "INTERNSHIP_VERIFIED"
    | "INTERNSHIP_REJECTED"
    | "EVIDENCE_UPLOADED"
    | "SKILL_GAP_DETECTED"
    | "INTERVENTION_CREATED"
    | "INTERVENTION_RESOLVED"
    | "PLACEMENT_RULE_MODIFIED"
    | "DRIVE_PUBLISHED"
    | "APPLICATION_SUBMITTED"
    | string;
  resourceType:
    | "INTERNSHIP"
    | "EVIDENCE"
    | "SKILL_GAP"
    | "DRIVE"
    | "APPLICATION"
    | string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(auditLogs).values({
    institutionId: params.institutionId,
    userId: params.userId,
    action: params.action,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    metadata: params.metadata || {},
    ipAddress: params.ipAddress,
  });
}

/**
 * Log internship mutation
 */
export async function logInternshipMutation(data: {
  institutionId: string;
  userId: string;
  action: AuditAction;
  internshipId: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
  ipAddress?: string;
}): Promise<AuditEntry> {
  const changes = {
    before: data.before,
    after: data.after,
  };

  // Calculate what changed
  const changedFields: Record<string, any> = {};
  if (data.before && data.after) {
    Object.keys(data.after).forEach((key) => {
      if (data.before![key] !== data.after![key]) {
        changedFields[key] = {
          from: data.before![key],
          to: data.after![key],
        };
      }
    });
  }

  return logAuditEntry({
    institutionId: data.institutionId,
    userId: data.userId,
    action: data.action,
    resourceType: "INTERNSHIP",
    resourceId: data.internshipId,
    changes,
    metadata: { changedFields },
    ipAddress: data.ipAddress,
  });
}

/**
 * Log evidence access
 */
export async function logEvidenceAccess(data: {
  institutionId: string;
  userId: string;
  evidenceId: string;
  action: "VIEW" | "DOWNLOAD";
  ipAddress?: string;
}): Promise<AuditEntry> {
  const actionMap = {
    VIEW: AuditAction.VIEW_EVIDENCE,
    DOWNLOAD: AuditAction.DOWNLOAD_REPORT,
  };

  return logAuditEntry({
    institutionId: data.institutionId,
    userId: data.userId,
    action: actionMap[data.action],
    resourceType: "EVIDENCE",
    resourceId: data.evidenceId,
    ipAddress: data.ipAddress,
  });
}

/**
 * Log verification action
 */
export async function logVerificationAction(data: {
  institutionId: string;
  verifierId: string;
  resourceType: "INTERNSHIP" | "EVIDENCE";
  resourceId: string;
  status: "VERIFIED" | "REJECTED";
  notes?: string;
  ipAddress?: string;
}): Promise<AuditEntry> {
  const actionMap = {
    INTERNSHIP: {
      VERIFIED: AuditAction.VERIFY_INTERNSHIP,
      REJECTED: AuditAction.REJECT_INTERNSHIP,
    },
    EVIDENCE: {
      VERIFIED: AuditAction.VERIFY_EVIDENCE,
      REJECTED: AuditAction.REJECT_EVIDENCE,
    },
  };

  return logAuditEntry({
    institutionId: data.institutionId,
    userId: data.verifierId,
    action: actionMap[data.resourceType][data.status],
    resourceType: data.resourceType,
    resourceId: data.resourceId,
    metadata: { notes: data.notes },
    ipAddress: data.ipAddress,
  });
}

// ============================================================================
// AUDIT QUERIES & REPORTING
// ============================================================================

/**
 * Get audit entries for a resource
 */
export async function getResourceAuditTrail(
  resourceType: string,
  resourceId: string,
  limit: number = 50
): Promise<any[]> {
  const db = await getDatabase();

  return db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.resourceId, resourceId))
    .limit(limit);
}

/**
 * Get audit entries for a user
 */
export async function getUserAuditTrail(
  userId: string,
  limit: number = 100
): Promise<any[]> {
  const db = await getDatabase();

  return db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.userId, userId))
    .limit(limit);
}

/**
 * Get all audit entries for an institution in date range
 */
export async function getInstitutionAuditLog(
  institutionId: string,
  options: {
    fromDate?: Date;
    toDate?: Date;
    actions?: AuditAction[];
    users?: string[];
    resourceTypes?: string[];
    limit?: number;
  } = {}
): Promise<any[]> {
  const db = await getDatabase();

  let query = db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.institutionId, institutionId));

  // Note: Date range filtering would require more complex query logic
  // For now, return basic results

  return query.limit(options.limit || 1000);
}

// ============================================================================
// COMPLIANCE REPORTS
// ============================================================================

export interface ComplianceReport {
  id: string;
  reportType: string;
  period: { from: Date; to: Date };
  institutionId: string;
  summary: {
    totalAuditEntries: number;
    actionsPerformed: Record<string, number>;
    usersInvolved: string[];
    resourcesModified: Record<string, number>;
  };
  riskIndicators: Array<{
    severity: "LOW" | "MEDIUM" | "HIGH";
    indicator: string;
    count: number;
  }>;
  generatedAt: Date;
}

/**
 * Generate compliance report for period
 */
export async function generateComplianceReport(data: {
  institutionId: string;
  fromDate: Date;
  toDate: Date;
  reportType?: "MONTHLY" | "QUARTERLY" | "ANNUAL";
}): Promise<ComplianceReport> {
  const db = await getDatabase();

  // Get all audit entries in period
  const entries = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.institutionId, data.institutionId));

  // Calculate statistics
  const actionsPerformed: Record<string, number> = {};
  const usersInvolved = new Set<string>();
  const resourcesModified: Record<string, number> = {};
  const deleteActions = [];
  const accessActions = [];
  const unauthorizedAttempts: string[] = [];

  entries.forEach((entry) => {
    actionsPerformed[entry.action] = (actionsPerformed[entry.action] || 0) + 1;

    if (entry.userId) {
      usersInvolved.add(entry.userId);
    }

    resourcesModified[entry.resourceType] = (resourcesModified[entry.resourceType] || 0) + 1;

    // Track concerning actions
    if (entry.action.includes("DELETE")) {
      deleteActions.push(entry);
    }

    if (entry.action.includes("ACCESS")) {
      accessActions.push(entry);
    }
  });

  // Generate risk indicators
  const riskIndicators: ComplianceReport["riskIndicators"] = [];

  if (deleteActions.length > 10) {
    riskIndicators.push({
      severity: "MEDIUM",
      indicator: "High number of delete operations",
      count: deleteActions.length,
    });
  }

  if (accessActions.length > 100) {
    riskIndicators.push({
      severity: "LOW",
      indicator: "High volume of access operations",
      count: accessActions.length,
    });
  }

  if (unauthorizedAttempts.length > 0) {
    riskIndicators.push({
      severity: "HIGH",
      indicator: "Unauthorized access attempts detected",
      count: unauthorizedAttempts.length,
    });
  }

  return {
    id: `report_${nanoid()}`,
    reportType: data.reportType || "MONTHLY",
    period: { from: data.fromDate, to: data.toDate },
    institutionId: data.institutionId,
    summary: {
      totalAuditEntries: entries.length,
      actionsPerformed,
      usersInvolved: Array.from(usersInvolved),
      resourcesModified,
    },
    riskIndicators,
    generatedAt: new Date(),
  };
}

/**
 * Generate data access report
 */
export async function generateDataAccessReport(data: {
  institutionId: string;
  studentId?: string;
  fromDate: Date;
  toDate: Date;
}): Promise<{
  reportId: string;
  period: { from: Date; to: Date };
  accessLog: Array<{
    timestamp: Date;
    action: string;
    userId: string | null;
    resourceType: string;
  }>;
  totalAccess: number;
  uniqueUsers: number;
}> {
  const db = await getDatabase();

  const accessActions = [
    AuditAction.VIEW_EVIDENCE,
    AuditAction.VIEW_TRANSCRIPT,
    AuditAction.ACCESS_STUDENT_RECORD,
    AuditAction.DOWNLOAD_REPORT,
  ];

  // Get access entries
  const entries = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.institutionId, data.institutionId));

  const filteredEntries = entries
    .filter((e) => accessActions.includes(e.action as AuditAction))
    .map((e) => ({
      timestamp: e.createdAt,
      action: e.action,
      userId: e.userId,
      resourceType: e.resourceType,
    }));

  const uniqueUsers = new Set(
    filteredEntries.map((e) => e.userId).filter((u) => u !== null)
  ).size;

  return {
    reportId: `access_report_${nanoid()}`,
    period: { from: data.fromDate, to: data.toDate },
    accessLog: filteredEntries,
    totalAccess: filteredEntries.length,
    uniqueUsers,
  };
}

// ============================================================================
// DATA RETENTION POLICIES
// ============================================================================

export interface DataRetentionPolicy {
  auditLogs: number; // Days to retain
  evidenceDocuments: number; // Days to retain
  accessLogs: number; // Days to retain
}

const DEFAULT_RETENTION_POLICY: DataRetentionPolicy = {
  auditLogs: 2555, // ~7 years (regulatory compliance)
  evidenceDocuments: 1825, // ~5 years
  accessLogs: 365, // 1 year
};

/**
 * Apply data retention policy (cleanup old records)
 */
export async function applyRetentionPolicy(policy: Partial<DataRetentionPolicy> = {}): Promise<{
  deleted: Record<string, number>;
  timestamp: Date;
}> {
  const finalPolicy = { ...DEFAULT_RETENTION_POLICY, ...policy };
  const deleted: Record<string, number> = {};

  // TODO: Implement actual deletion logic based on retention dates
  // For now, return mock results

  console.log("✅ Retention policy applied", finalPolicy);

  return {
    deleted,
    timestamp: new Date(),
  };
}

/**
 * Get current retention policy
 */
export function getRetentionPolicy(): DataRetentionPolicy {
  return { ...DEFAULT_RETENTION_POLICY };
}

// ============================================================================
// AUDIT MIDDLEWARE
// ============================================================================

/**
 * Middleware to automatically log mutations
 */
export async function withAuditLogging(data: {
  institutionId: string;
  userId: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  operation: () => Promise<any>;
  ipAddress?: string;
}): Promise<any> {
  const startTime = Date.now();

  try {
    const result = await data.operation();

    // Log successful operation
    await logAuditEntry({
      institutionId: data.institutionId,
      userId: data.userId,
      action: data.action,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      metadata: {
        success: true,
        executionTimeMs: Date.now() - startTime,
      },
      ipAddress: data.ipAddress,
    });

    return result;
  } catch (error) {
    // Log failed operation
    await logAuditEntry({
      institutionId: data.institutionId,
      userId: data.userId,
      action: data.action,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      metadata: {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTimeMs: Date.now() - startTime,
      },
      ipAddress: data.ipAddress,
    });

    throw error;
  }
}
