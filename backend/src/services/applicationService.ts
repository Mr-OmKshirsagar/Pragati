import { and, desc, eq, inArray } from "drizzle-orm";
import {
  applications,
  auditLogs,
  notifications,
  placementRules,
  recruitmentDrives,
  studentProfiles,
  users,
} from "../../drizzle/schema";
import { getDb } from "../db";
import {
  evaluateStudentEligibility,
  type RuleAST,
} from "../rules/eligibilityEngine";
import * as tnpService from "./tnpService";

export interface SubmitApplicationInput {
  studentId: string;
  driveId: string;
  userId?: string;
}

export interface UpdateApplicationStatusInput {
  applicationId: string;
  status: "APPLIED" | "SHORTLISTED" | "INTERVIEWING" | "OFFERED" | "REJECTED";
  remarks?: string;
  updatedByUserId?: string;
  institutionId?: string;
}

/**
 * Retrieves all published recruitment drives along with active placement rule ASTs and application counts.
 */
export async function getPublishedDrives() {
  const db = await getDb();
  if (!db) throw new Error("Database offline");

  // Ensure benchmark drive is present
  await tnpService.getOrCreateBenchmarkDrive();

  const drives = await db
    .select()
    .from(recruitmentDrives)
    .where(eq(recruitmentDrives.status, "PUBLISHED"))
    .orderBy(desc(recruitmentDrives.createdAt));

  return Promise.all(
    drives.map(async (drive) => {
      const [ruleRecord] = await db
        .select()
        .from(placementRules)
        .where(
          and(
            eq(placementRules.recruitmentDriveId, drive.id),
            eq(placementRules.isActive, true)
          )
        )
        .orderBy(desc(placementRules.version))
        .limit(1);

      const appRecords = await db
        .select({ id: applications.id })
        .from(applications)
        .where(eq(applications.recruitmentDriveId, drive.id));

      return {
        ...drive,
        rule: (ruleRecord?.ruleDefinition as RuleAST) || null,
        totalApplicants: appRecords.length,
      };
    })
  );
}

/**
 * Submits an application to a recruitment drive with strict server-side eligibility re-evaluation
 * and duplicate submission prevention.
 */
export async function submitApplication(input: SubmitApplicationInput) {
  const db = await getDb();
  if (!db) throw new Error("Database offline");

  const { studentId, driveId, userId } = input;

  // 1. Fetch recruitment drive
  const [drive] = await db
    .select()
    .from(recruitmentDrives)
    .where(eq(recruitmentDrives.id, driveId))
    .limit(1);

  if (!drive) {
    throw new Error("Recruitment drive not found");
  }

  if (drive.status !== "PUBLISHED") {
    throw new Error("Recruitment drive is not accepting applications");
  }

  // Check deadline
  if (drive.applicationDeadline && new Date() > new Date(drive.applicationDeadline)) {
    throw new Error("Application deadline has passed");
  }

  // 2. Check for existing application (idempotency guard)
  const [existingApp] = await db
    .select()
    .from(applications)
    .where(
      and(
        eq(applications.studentId, studentId),
        eq(applications.recruitmentDriveId, driveId)
      )
    )
    .limit(1);

  if (existingApp) {
    throw new Error("DUPLICATE_APPLICATION: You have already applied for this recruitment drive");
  }

  // 3. Server-Side Gatekeeping: Re-evaluate student eligibility deterministically
  // Never trust client checks.
  const snapshot = await tnpService.getStudentCandidateSnapshot(studentId);
  const { rule } = await tnpService.getDriveWithRule(driveId);

  const evalResult = evaluateStudentEligibility(driveId, rule, snapshot);

  if (!evalResult.eligible) {
    const failedReasons = evalResult.reasons
      .filter((r) => r.includes("[FAIL]"))
      .join("; ");
    throw new Error(
      `RULE_VIOLATION: Candidate does not satisfy recruitment criteria: ${failedReasons || "Eligibility check failed"}`
    );
  }

  // 4. Insert application record
  const [application] = await db
    .insert(applications)
    .values({
      studentId,
      recruitmentDriveId: driveId,
      status: "APPLIED",
      appliedAt: new Date(),
    })
    .returning();

  // 5. Record immutable compliance audit log
  const effectiveUserId = userId || (await resolveUserIdFromStudentProfile(studentId));

  if (drive.institutionId) {
    await db.insert(auditLogs).values({
      institutionId: drive.institutionId,
      userId: effectiveUserId,
      action: "SUBMIT_APPLICATION",
      resourceType: "APPLICATION",
      resourceId: application.id,
      metadata: {
        recruitmentDriveId: drive.id,
        companyName: drive.companyName,
        jobTitle: drive.jobTitle,
        cgpa: snapshot.cgpa,
        activeBacklogs: snapshot.activeBacklogs,
        evaluationReasons: evalResult.reasons,
      },
    });
  }

  // 6. Record confirmation notification
  if (effectiveUserId) {
    await db.insert(notifications).values({
      userId: effectiveUserId,
      type: "APPLICATION_SUBMITTED",
      title: `Application Submitted: ${drive.companyName}`,
      message: `Your application for ${drive.jobTitle} at ${drive.companyName} has been received and verified.`,
      link: `/opportunities`,
      isRead: false,
    });
  }

  return {
    application,
    drive: {
      id: drive.id,
      companyName: drive.companyName,
      jobTitle: drive.jobTitle,
      ctcOrStipend: drive.ctcOrStipend,
    },
    evaluation: evalResult,
  };
}

/**
 * Retrieves all applications submitted by a given student profile.
 */
export async function getStudentApplications(studentProfileId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database offline");

  const rows = await db
    .select({
      id: applications.id,
      recruitmentDriveId: applications.recruitmentDriveId,
      status: applications.status,
      appliedAt: applications.appliedAt,
      companyName: recruitmentDrives.companyName,
      jobTitle: recruitmentDrives.jobTitle,
      description: recruitmentDrives.description,
      ctcOrStipend: recruitmentDrives.ctcOrStipend,
      applicationDeadline: recruitmentDrives.applicationDeadline,
      driveStatus: recruitmentDrives.status,
    })
    .from(applications)
    .innerJoin(
      recruitmentDrives,
      eq(applications.recruitmentDriveId, recruitmentDrives.id)
    )
    .where(eq(applications.studentId, studentProfileId))
    .orderBy(desc(applications.appliedAt));

  return rows;
}

/**
 * Retrieves all candidate applications for a specific recruitment drive (for T&P Coordinators).
 */
export async function getDriveApplicants(driveId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database offline");

  const rows = await db
    .select({
      applicationId: applications.id,
      status: applications.status,
      appliedAt: applications.appliedAt,
      studentId: studentProfiles.id,
      enrollmentNumber: studentProfiles.enrollmentNumber,
      program: studentProfiles.program,
      currentSemester: studentProfiles.currentSemester,
      studentName: users.name,
      studentEmail: users.email,
    })
    .from(applications)
    .innerJoin(studentProfiles, eq(applications.studentId, studentProfiles.id))
    .innerJoin(users, eq(studentProfiles.userId, users.id))
    .where(eq(applications.recruitmentDriveId, driveId))
    .orderBy(desc(applications.appliedAt));

  // Enrich with candidate snapshot metrics
  return Promise.all(
    rows.map(async (row) => {
      try {
        const snapshot = await tnpService.getStudentCandidateSnapshot(row.studentId);
        return {
          ...row,
          snapshot,
        };
      } catch {
        return {
          ...row,
          snapshot: null,
        };
      }
    })
  );
}

/**
 * Updates applicant stage in the recruitment pipeline (T&P Coordinator action).
 */
export async function updateApplicationStatus(input: UpdateApplicationStatusInput) {
  const db = await getDb();
  if (!db) throw new Error("Database offline");

  const { applicationId, status, remarks, updatedByUserId, institutionId } = input;

  const [existingApp] = await db
    .select({
      id: applications.id,
      studentId: applications.studentId,
      recruitmentDriveId: applications.recruitmentDriveId,
      oldStatus: applications.status,
      companyName: recruitmentDrives.companyName,
      jobTitle: recruitmentDrives.jobTitle,
      institutionId: recruitmentDrives.institutionId,
      userId: studentProfiles.userId,
    })
    .from(applications)
    .innerJoin(
      recruitmentDrives,
      eq(applications.recruitmentDriveId, recruitmentDrives.id)
    )
    .innerJoin(studentProfiles, eq(applications.studentId, studentProfiles.id))
    .where(eq(applications.id, applicationId))
    .limit(1);

  if (!existingApp) {
    throw new Error(`Application '${applicationId}' not found`);
  }

  // Update status
  const [updated] = await db
    .update(applications)
    .set({
      status,
    })
    .where(eq(applications.id, applicationId))
    .returning();

  // Audit log
  const effectiveInstitutionId = institutionId || existingApp.institutionId;
  if (effectiveInstitutionId) {
    await db.insert(auditLogs).values({
      institutionId: effectiveInstitutionId,
      userId: updatedByUserId || null,
      action: "UPDATE_APPLICATION_STATUS",
      resourceType: "APPLICATION",
      resourceId: applicationId,
      metadata: {
        recruitmentDriveId: existingApp.recruitmentDriveId,
        companyName: existingApp.companyName,
        oldStatus: existingApp.oldStatus,
        newStatus: status,
        remarks: remarks || "",
      },
    });
  }

  // Notify student
  if (existingApp.userId) {
    await db.insert(notifications).values({
      userId: existingApp.userId,
      type: "APPLICATION_STATUS_UPDATED",
      title: `Application Status Updated: ${existingApp.companyName}`,
      message: `Your application for ${existingApp.jobTitle} at ${existingApp.companyName} has moved to stage: ${status}.`,
      link: `/opportunities`,
      isRead: false,
    });
  }

  return updated;
}

/**
 * Helper to resolve user ID from student profile ID
 */
async function resolveUserIdFromStudentProfile(studentProfileId: string): Promise<string | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const [profile] = await db
    .select({ userId: studentProfiles.userId })
    .from(studentProfiles)
    .where(eq(studentProfiles.id, studentProfileId))
    .limit(1);
  return profile?.userId;
}
