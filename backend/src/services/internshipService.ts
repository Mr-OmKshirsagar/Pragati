/**
 * Internship Service
 * Manages internship lifecycle, evidence uploads, check-ins, and verification
 */

import { and, eq, desc } from "drizzle-orm";
import {
  internships,
  internshipEvidence,
  internshipCheckins,
  evidenceDocuments,
  verifications,
  studentProfiles,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { nanoid } from "nanoid";
import { uploadEvidenceToVault, getEvidenceDownloadUrl, EVIDENCE_VAULT_BUCKET } from "../_core/storage";
import { validateEvidenceFile } from "./evidenceService";

const getDatabase = async () => {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return db;
};

// ============================================================================
// INTERNSHIP LIFECYCLE
// ============================================================================

/**
 * Create an internship record for a student
 */
export async function createInternship(data: {
  studentId: string;
  companyName: string;
  role: string;
  startDate: Date;
  endDate?: Date;
  stipend?: number;
  supervisorName?: string;
  supervisorEmail?: string;
}) {
  const db = await getDatabase();

  const startDateStr = data.startDate.toISOString().split("T")[0];
  const endDateStr = data.endDate ? data.endDate.toISOString().split("T")[0] : null;

  return db
    .insert(internships)
    .values({
      studentId: data.studentId,
      companyName: data.companyName,
      role: data.role,
      startDate: startDateStr,
      endDate: endDateStr,
      stipend: data.stipend ? data.stipend.toString() : null,
      status: "IN_PROGRESS",
      supervisorName: data.supervisorName,
      supervisorEmail: data.supervisorEmail,
      verificationStatus: "PENDING",
    })
    .returning();
}

/**
 * Get internship by ID
 */
export async function getInternshipById(internshipId: string) {
  const db = await getDatabase();

  return db
    .select()
    .from(internships)
    .where(eq(internships.id, internshipId))
    .limit(1)
    .then(([result]) => result || null);
}

/**
 * Get all internships for a student
 */
export async function getStudentInternships(studentId: string) {
  const db = await getDatabase();

  return db
    .select()
    .from(internships)
    .where(eq(internships.studentId, studentId))
    .orderBy(desc(internships.createdAt));
}

/**
 * Update internship status
 */
export async function updateInternshipStatus(
  internshipId: string,
  status: "APPLIED" | "OFFERED" | "IN_PROGRESS" | "COMPLETED" | "TERMINATED"
) {
  const db = await getDatabase();

  return db
    .update(internships)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(internships.id, internshipId))
    .returning();
}

// ============================================================================
// INTERNSHIP EVIDENCE UPLOADS
// ============================================================================

/**
 * Upload internship evidence (offer letter, completion cert, etc.)
 * Handles SHA-256 validation and Supabase Storage integration
 */
export async function uploadInternshipEvidence(params: {
  institutionId: string;
  studentId: string;
  internshipId: string;
  evidenceType:
    | "OFFER_LETTER"
    | "CHECK_IN"
    | "COMPLETION_CERTIFICATE"
    | "INTERNSHIP_REPORT"
    | "SUPERVISOR_CONFIRMATION"
    | "SKILL_CERTIFICATE";
  filename: string;
  fileBuffer: Buffer;
  mimeType: string;
  clientHash?: string;
}) {
  const {
    institutionId,
    studentId,
    internshipId,
    evidenceType,
    filename,
    fileBuffer,
    mimeType,
    clientHash,
  } = params;

  const fileSize = fileBuffer.length;

  // Validate file against security policies
  validateEvidenceFile(mimeType, fileSize);

  // Upload to vault with dual-layer SHA-256 validation
  const { storagePath, sha256Hash } = await uploadEvidenceToVault({
    institutionId,
    studentId,
    fileBuffer,
    filename,
    mimeType,
    expectedHash: clientHash,
  });

  const db = await getDatabase();

  // 1. Create evidence document record
  const [evidenceDoc] = await db
    .insert(evidenceDocuments)
    .values({
      studentId,
      filename,
      storageBucket: EVIDENCE_VAULT_BUCKET,
      storagePath,
      mimeType,
      fileSize,
      sha256Hash,
      verificationStatus: "SELF_REPORTED",
      uploadedAt: new Date(),
    })
    .returning();

  // 2. Link evidence to internship
  const [internshipEvidenceRecord] = await db
    .insert(internshipEvidence)
    .values({
      internshipId,
      evidenceType,
      evidenceDocumentId: evidenceDoc.id,
    })
    .returning();

  return {
    internshipEvidence: internshipEvidenceRecord,
    evidenceDocument: evidenceDoc,
    downloadUrl: await getEvidenceDownloadUrl(storagePath),
  };
}

/**
 * Get all evidence for an internship
 */
export async function getInternshipEvidence(internshipId: string) {
  const db = await getDatabase();

  const records = await db
    .select({
      evidence: internshipEvidence,
      document: evidenceDocuments,
    })
    .from(internshipEvidence)
    .innerJoin(evidenceDocuments, eq(internshipEvidence.evidenceDocumentId, evidenceDocuments.id))
    .where(eq(internshipEvidence.internshipId, internshipId))
    .orderBy(desc(internshipEvidence.createdAt));

  // Add download URLs
  return Promise.all(
    records.map(async (r) => ({
      ...r,
      downloadUrl: await getEvidenceDownloadUrl(r.document.storagePath),
    }))
  );
}

/**
 * Get evidence by type for an internship (e.g., get only OFFER_LETTER)
 */
export async function getInternshipEvidenceByType(
  internshipId: string,
  evidenceType:
    | "OFFER_LETTER"
    | "CHECK_IN"
    | "COMPLETION_CERTIFICATE"
    | "INTERNSHIP_REPORT"
    | "SUPERVISOR_CONFIRMATION"
    | "SKILL_CERTIFICATE"
) {
  const db = await getDatabase();

  const records = await db
    .select({
      evidence: internshipEvidence,
      document: evidenceDocuments,
    })
    .from(internshipEvidence)
    .innerJoin(evidenceDocuments, eq(internshipEvidence.evidenceDocumentId, evidenceDocuments.id))
    .where(
      and(
        eq(internshipEvidence.internshipId, internshipId),
        eq(internshipEvidence.evidenceType, evidenceType)
      )
    )
    .orderBy(desc(internshipEvidence.createdAt));

  // Add download URLs
  return Promise.all(
    records.map(async (r) => ({
      ...r,
      downloadUrl: await getEvidenceDownloadUrl(r.document.storagePath),
    }))
  );
}

/**
 * Delete evidence from internship
 */
export async function deleteInternshipEvidence(evidenceId: string) {
  const db = await getDatabase();

  return db.delete(internshipEvidence).where(eq(internshipEvidence.id, evidenceId)).returning();
}

// ============================================================================
// CHECK-INS (Progress Updates)
// ============================================================================

/**
 * Record an internship check-in (weekly/milestone update)
 */
export async function recordCheckIn(data: {
  internshipId: string;
  studentId: string;
  checkInDate: Date;
  summary: string;
}) {
  const db = await getDatabase();

  const checkInDateStr = data.checkInDate.toISOString().split("T")[0];

  return db
    .insert(internshipCheckins)
    .values({
      internshipId: data.internshipId,
      studentId: data.studentId,
      checkInDate: checkInDateStr,
      summary: data.summary,
      status: "SUBMITTED",
    })
    .returning();
}

/**
 * Get all check-ins for an internship
 */
export async function getInternshipCheckIns(internshipId: string) {
  const db = await getDatabase();

  return db
    .select()
    .from(internshipCheckins)
    .where(eq(internshipCheckins.internshipId, internshipId))
    .orderBy(desc(internshipCheckins.checkInDate));
}

/**
 * Update a check-in record
 */
export async function updateCheckIn(
  checkInId: string,
  data: {
    summary?: string;
  }
) {
  const db = await getDatabase();

  return db
    .update(internshipCheckins)
    .set({
      summary: data.summary,
    })
    .where(eq(internshipCheckins.id, checkInId))
    .returning();
}

// ============================================================================
// VERIFICATION & APPROVAL
// ============================================================================

/**
 * Submit internship for verification (student action)
 */
export async function submitInternshipForVerification(internshipId: string) {
  const db = await getDatabase();

  return db
    .update(internships)
    .set({
      status: "COMPLETED",
      verificationStatus: "PENDING",
      updatedAt: new Date(),
    })
    .where(eq(internships.id, internshipId))
    .returning();
}

/**
 * Verify/approve internship (faculty action)
 */
export async function verifyInternship(params: {
  internshipId: string;
  verifierUserId: string;
  status: "INSTITUTION_VERIFIED" | "REJECTED";
  notes?: string;
}) {
  const db = await getDatabase();

  const internship = await getInternshipById(params.internshipId);
  if (!internship) {
    throw new Error(`Internship ${params.internshipId} not found`);
  }

  // Update internship verification status
  await db
    .update(internships)
    .set({
      verificationStatus: params.status === "INSTITUTION_VERIFIED" ? "INSTITUTION_VERIFIED" : "REJECTED",
      updatedAt: new Date(),
    })
    .where(eq(internships.id, params.internshipId));

  // Return updated internship
  return db
    .select()
    .from(internships)
    .where(eq(internships.id, params.internshipId))
    .limit(1)
    .then(([result]) => result);
}

/**
 * Get verification status of an internship
 */
export async function getInternshipVerification(internshipId: string) {
  const db = await getDatabase();

  return db
    .select()
    .from(internships)
    .where(eq(internships.id, internshipId))
    .limit(1)
    .then(([result]) => result?.verificationStatus || null);
}

// ============================================================================
// ANALYTICS & REPORTING
// ============================================================================

/**
 * Get internship completion summary for a student
 */
export async function getInternshipSummary(studentId: string) {
  const db = await getDatabase();

  const internshipRecords = await db
    .select()
    .from(internships)
    .where(eq(internships.studentId, studentId));

  const summary = {
    totalInternships: internshipRecords.length,
    completed: internshipRecords.filter((i) => i.status === "COMPLETED").length,
    inProgress: internshipRecords.filter((i) => i.status === "IN_PROGRESS").length,
    applied: internshipRecords.filter((i) => i.status === "APPLIED").length,
    verified: internshipRecords.filter((i) => i.verificationStatus === "INSTITUTION_VERIFIED")
      .length,
    internships: internshipRecords,
  };

  return summary;
}

/**
 * Get HOD/Faculty dashboard view - all internships in department
 */
export async function getDepartmentInternships(departmentId: string) {
  const db = await getDatabase();

  // Join with student_profiles to filter by department
  const records = await db
    .select({
      internship: internships,
      student: studentProfiles,
    })
    .from(internships)
    .innerJoin(studentProfiles, eq(internships.studentId, studentProfiles.id))
    .where(eq(studentProfiles.departmentId, departmentId))
    .orderBy(desc(internships.createdAt));

  return records;
}

/**
 * Get department internship statistics
 */
export async function getDepartmentInternshipStats(departmentId: string) {
  const internships_list = await getDepartmentInternships(departmentId);

  return {
    totalInternships: internships_list.length,
    completed: internships_list.filter((i) => i.internship.status === "COMPLETED").length,
    inProgress: internships_list.filter((i) => i.internship.status === "IN_PROGRESS").length,
    pending: internships_list.filter(
      (i) => i.internship.verificationStatus === "PENDING"
    ).length,
    verified: internships_list.filter(
      (i) => i.internship.verificationStatus === "INSTITUTION_VERIFIED"
    ).length,
    rejected: internships_list.filter(
      (i) => i.internship.verificationStatus === "REJECTED"
    ).length,
    averageStipend:
      internships_list.length > 0
        ? (
            internships_list.reduce(
              (sum, i) => sum + (i.internship.stipend ? parseFloat(i.internship.stipend) : 0),
              0
            ) / internships_list.length
          ).toFixed(2)
        : 0,
  };
}
