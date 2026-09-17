import { and, desc, eq } from "drizzle-orm";
import {
  auditLogs,
  evidenceDocuments,
  internshipCheckins,
  internshipEvidence,
  internships,
  studentProfiles,
  users,
  verifications,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { getEvidenceDownloadUrl } from "../_core/storage";

export type EvidenceType =
  | "OFFER_LETTER"
  | "CHECK_IN"
  | "COMPLETION_CERTIFICATE"
  | "INTERNSHIP_REPORT"
  | "SUPERVISOR_CONFIRMATION"
  | "SKILL_CERTIFICATE";

/**
 * Calculates the Evidence Completeness percentage based on the 4 core milestones:
 * 1. Offer Letter (25%)
 * 2. Check-in (At least 1 check-in, 25%)
 * 3. Internship Report (25%)
 * 4. Completion Certificate (25%)
 */
export function calculateEvidenceCompleteness(milestones: {
  hasOfferLetter: boolean;
  hasCheckin: boolean;
  hasReport: boolean;
  hasCertificate: boolean;
}): number {
  let score = 0;
  if (milestones.hasOfferLetter) score += 25;
  if (milestones.hasCheckin) score += 25;
  if (milestones.hasReport) score += 25;
  if (milestones.hasCertificate) score += 25;
  return score;
}

/**
 * Retrieves the student's active internship with joined evidence milestones,
 * check-in updates, and real-time completeness percentage.
 */
export async function getStudentActiveInternship(studentProfileId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database offline");

  // 1. Query active internship
  let [activeInternship] = await db
    .select()
    .from(internships)
    .where(eq(internships.studentId, studentProfileId))
    .orderBy(desc(internships.createdAt))
    .limit(1);

  // If no internship exists, initialize a default record for demo student
  if (!activeInternship) {
    [activeInternship] = await db
      .insert(internships)
      .values({
        studentId: studentProfileId,
        companyName: "Atlas Labs",
        role: "Product Engineering Intern",
        startDate: "2026-06-01",
        endDate: "2026-11-30",
        stipend: "45000.00",
        status: "IN_PROGRESS",
        supervisorName: "Sarah Jenkins",
        supervisorEmail: "s.jenkins@atlaslabs.io",
        verificationStatus: "PENDING",
      })
      .returning();
  }

  // 2. Query all linked evidence documents
  const evidenceRecords = await db
    .select({
      id: internshipEvidence.id,
      internshipId: internshipEvidence.internshipId,
      evidenceType: internshipEvidence.evidenceType,
      status: internshipEvidence.status,
      createdAt: internshipEvidence.createdAt,
      documentId: evidenceDocuments.id,
      filename: evidenceDocuments.filename,
      storagePath: evidenceDocuments.storagePath,
      mimeType: evidenceDocuments.mimeType,
      fileSize: evidenceDocuments.fileSize,
      sha256Hash: evidenceDocuments.sha256Hash,
      verificationStatus: evidenceDocuments.verificationStatus,
    })
    .from(internshipEvidence)
    .innerJoin(
      evidenceDocuments,
      eq(internshipEvidence.evidenceDocumentId, evidenceDocuments.id)
    )
    .where(eq(internshipEvidence.internshipId, activeInternship.id));

  // 3. Query all progress check-ins
  const checkins = await db
    .select()
    .from(internshipCheckins)
    .where(eq(internshipCheckins.internshipId, activeInternship.id))
    .orderBy(desc(internshipCheckins.createdAt));

  // 4. Determine milestone coverage
  const hasOfferLetter = evidenceRecords.some(
    (e) => e.evidenceType === "OFFER_LETTER"
  );
  const hasCheckin = checkins.length > 0;
  const hasReport = evidenceRecords.some(
    (e) => e.evidenceType === "INTERNSHIP_REPORT"
  );
  const hasCertificate = evidenceRecords.some(
    (e) => e.evidenceType === "COMPLETION_CERTIFICATE"
  );

  const completeness = calculateEvidenceCompleteness({
    hasOfferLetter,
    hasCheckin,
    hasReport,
    hasCertificate,
  });

  // Attach download URLs
  const enrichedEvidence = await Promise.all(
    evidenceRecords.map(async (doc) => ({
      ...doc,
      downloadUrl: await getEvidenceDownloadUrl(doc.storagePath),
    }))
  );

  return {
    ...activeInternship,
    completeness,
    milestones: {
      hasOfferLetter,
      hasCheckin,
      hasReport,
      hasCertificate,
    },
    evidence: enrichedEvidence,
    checkins,
  };
}

/**
 * Creates a new internship registration for a student.
 */
export async function createInternship(
  studentProfileId: string,
  data: {
    companyName: string;
    role: string;
    startDate: string;
    endDate?: string;
    stipend?: number;
    supervisorName?: string;
    supervisorEmail?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database offline");

  const [record] = await db
    .insert(internships)
    .values({
      studentId: studentProfileId,
      companyName: data.companyName,
      role: data.role,
      startDate: data.startDate,
      endDate: data.endDate || null,
      stipend: data.stipend ? data.stipend.toString() : null,
      status: "IN_PROGRESS",
      supervisorName: data.supervisorName || null,
      supervisorEmail: data.supervisorEmail || null,
      verificationStatus: "PENDING",
    })
    .returning();

  return record;
}

/**
 * Submits a periodic student internship check-in summary.
 */
export async function addCheckin(
  studentProfileId: string,
  data: {
    internshipId: string;
    summary: string;
    checkInDate?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database offline");

  // Validate student ownership
  const [internship] = await db
    .select()
    .from(internships)
    .where(
      and(
        eq(internships.id, data.internshipId),
        eq(internships.studentId, studentProfileId)
      )
    )
    .limit(1);

  if (!internship) {
    throw new Error("Internship not found or not owned by student.");
  }

  const [checkin] = await db
    .insert(internshipCheckins)
    .values({
      internshipId: data.internshipId,
      studentId: studentProfileId,
      checkInDate: data.checkInDate || new Date().toISOString().split("T")[0],
      summary: data.summary,
      status: "SUBMITTED",
    })
    .returning();

  return checkin;
}

/**
 * Links an uploaded cryptographic evidence document to an internship milestone.
 */
export async function linkEvidenceToInternship(
  studentProfileId: string,
  data: {
    internshipId: string;
    evidenceDocumentId: string;
    evidenceType: EvidenceType;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database offline");

  // Validate ownership of both internship and evidence document
  const [internship] = await db
    .select()
    .from(internships)
    .where(
      and(
        eq(internships.id, data.internshipId),
        eq(internships.studentId, studentProfileId)
      )
    )
    .limit(1);

  if (!internship) {
    throw new Error("Internship not found or not owned by student.");
  }

  const [doc] = await db
    .select()
    .from(evidenceDocuments)
    .where(
      and(
        eq(evidenceDocuments.id, data.evidenceDocumentId),
        eq(evidenceDocuments.studentId, studentProfileId)
      )
    )
    .limit(1);

  if (!doc) {
    throw new Error("Evidence document not found or not owned by student.");
  }

  const [record] = await db
    .insert(internshipEvidence)
    .values({
      internshipId: data.internshipId,
      evidenceDocumentId: data.evidenceDocumentId,
      evidenceType: data.evidenceType,
      status: "PENDING",
    })
    .returning();

  return record;
}

/**
 * Retrieves the faculty review queue: pending student internships awaiting sign-off.
 */
export async function getFacultyReviewQueue(facultyUserId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database offline");

  // Fetch all internships with student profile and user details
  const queue = await db
    .select({
      id: internships.id,
      studentId: internships.studentId,
      studentName: users.name,
      studentEmail: users.email,
      enrollmentNumber: studentProfiles.enrollmentNumber,
      companyName: internships.companyName,
      role: internships.role,
      startDate: internships.startDate,
      endDate: internships.endDate,
      stipend: internships.stipend,
      status: internships.status,
      verificationStatus: internships.verificationStatus,
      createdAt: internships.createdAt,
    })
    .from(internships)
    .innerJoin(studentProfiles, eq(internships.studentId, studentProfiles.id))
    .innerJoin(users, eq(studentProfiles.userId, users.id))
    .where(
      // Show assigned mentees or all department wards
      eq(studentProfiles.assignedFacultyId, facultyUserId)
    )
    .orderBy(desc(internships.createdAt));

  // For each internship, calculate completeness and gather evidence list
  return Promise.all(
    queue.map(async (item) => {
      const evidence = await db
        .select({
          id: internshipEvidence.id,
          evidenceType: internshipEvidence.evidenceType,
          status: internshipEvidence.status,
          filename: evidenceDocuments.filename,
          storagePath: evidenceDocuments.storagePath,
          sha256Hash: evidenceDocuments.sha256Hash,
          uploadedAt: evidenceDocuments.uploadedAt,
        })
        .from(internshipEvidence)
        .innerJoin(
          evidenceDocuments,
          eq(internshipEvidence.evidenceDocumentId, evidenceDocuments.id)
        )
        .where(eq(internshipEvidence.internshipId, item.id));

      const checkins = await db
        .select()
        .from(internshipCheckins)
        .where(eq(internshipCheckins.internshipId, item.id));

      const hasOfferLetter = evidence.some(
        (e) => e.evidenceType === "OFFER_LETTER"
      );
      const hasCheckin = checkins.length > 0;
      const hasReport = evidence.some(
        (e) => e.evidenceType === "INTERNSHIP_REPORT"
      );
      const hasCertificate = evidence.some(
        (e) => e.evidenceType === "COMPLETION_CERTIFICATE"
      );

      const completeness = calculateEvidenceCompleteness({
        hasOfferLetter,
        hasCheckin,
        hasReport,
        hasCertificate,
      });

      return {
        ...item,
        completeness,
        evidenceCount: evidence.length,
        checkinCount: checkins.length,
        evidence,
        checkins,
      };
    })
  );
}

/**
 * Faculty review sign-off:
 * - Updates internship verification status to INSTITUTION_VERIFIED or REJECTED.
 * - If approved, sets internship status to COMPLETED.
 * - Inserts audit record into verifications and audit_logs.
 */
export async function verifyInternship(params: {
  verifierId: string;
  internshipId: string;
  status: "INSTITUTION_VERIFIED" | "REJECTED";
  notes?: string;
}) {
  const { verifierId, internshipId, status, notes } = params;

  const db = await getDb();
  if (!db) throw new Error("Database offline");

  // Fetch internship and student profile
  const [internship] = await db
    .select({
      id: internships.id,
      studentId: internships.studentId,
      companyName: internships.companyName,
      status: internships.status,
      institutionId: studentProfiles.institutionId,
    })
    .from(internships)
    .innerJoin(studentProfiles, eq(internships.studentId, studentProfiles.id))
    .where(eq(internships.id, internshipId))
    .limit(1);

  if (!internship) {
    throw new Error(`Internship with id '${internshipId}' not found.`);
  }

  const isApproved = status === "INSTITUTION_VERIFIED";

  // 1. Update internship status
  const [updatedInternship] = await db
    .update(internships)
    .set({
      verificationStatus: status,
      status: isApproved ? "COMPLETED" : internship.status,
      updatedAt: new Date(),
    })
    .where(eq(internships.id, internshipId))
    .returning();

  // 2. Update linked evidence records
  await db
    .update(internshipEvidence)
    .set({
      status: status,
    })
    .where(eq(internshipEvidence.internshipId, internshipId));

  // 3. Create verification audit records for each evidence document
  const linkedDocs = await db
    .select()
    .from(internshipEvidence)
    .where(eq(internshipEvidence.internshipId, internshipId));

  for (const doc of linkedDocs) {
    await db.insert(verifications).values({
      evidenceId: doc.evidenceDocumentId,
      verifierUserId: verifierId,
      verificationType: "INSTITUTION",
      status: isApproved ? "VERIFIED" : "REJECTED",
      notes: notes || null,
    });
  }

  // 4. Record compliance entry in audit_logs
  await db.insert(auditLogs).values({
    institutionId: internship.institutionId,
    userId: verifierId,
    action: isApproved ? "INTERNSHIP_VERIFIED" : "INTERNSHIP_REJECTED",
    resourceType: "internships",
    resourceId: internshipId,
    metadata: {
      status,
      notes: notes || null,
      companyName: internship.companyName,
      evidenceDocumentsCount: linkedDocs.length,
    },
  });

  return {
    success: true,
    ...updatedInternship,
  };
}
