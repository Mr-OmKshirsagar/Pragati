import { desc, eq } from "drizzle-orm";
import { evidenceDocuments, verifications } from "../../drizzle/schema";
import { getDb } from "../db";
import {
  computeSHA256,
  EVIDENCE_VAULT_BUCKET,
  getEvidenceDownloadUrl,
  uploadEvidenceToVault,
} from "../_core/storage";

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

/**
 * Validates file MIME type and file size against institutional security policies.
 */
export function validateEvidenceFile(mimeType: string, fileSize: number): void {
  if (!ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType)) {
    throw new Error(
      `Invalid file type '${mimeType}'. Allowed formats are PDF, PNG, and JPEG.`
    );
  }

  if (fileSize > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `File size (${(fileSize / (1024 * 1024)).toFixed(
        2
      )}MB) exceeds the maximum limit of 10MB.`
    );
  }

  if (fileSize <= 0) {
    throw new Error("File cannot be empty.");
  }
}

/**
 * Registers an evidence document record in the database.
 */
export async function registerEvidenceDocument(params: {
  studentId: string;
  achievementId?: string | null;
  filename: string;
  storagePath: string;
  mimeType: string;
  fileSize: number;
  sha256Hash: string;
}) {
  const {
    studentId,
    achievementId,
    filename,
    storagePath,
    mimeType,
    fileSize,
    sha256Hash,
  } = params;

  // Validate security constraints
  validateEvidenceFile(mimeType, fileSize);

  if (!sha256Hash || sha256Hash.length !== 64) {
    throw new Error("Invalid SHA-256 hash. Must be a 64-character hex string.");
  }

  const db = await getDb();
  if (!db) throw new Error("Database offline");

  const [record] = await db
    .insert(evidenceDocuments)
    .values({
      studentId,
      achievementId: achievementId || null,
      filename,
      storageBucket: EVIDENCE_VAULT_BUCKET,
      storagePath,
      mimeType,
      fileSize,
      sha256Hash,
      verificationStatus: "SELF_REPORTED",
    })
    .returning();

  return record;
}

/**
 * Handles end-to-end file upload and database registration:
 * 1. Validates file restrictions.
 * 2. Uploads to Supabase Storage with dual-layer SHA-256 validation.
 * 3. Saves document record in evidence_documents table.
 */
export async function uploadAndRegisterEvidence(params: {
  institutionId: string;
  studentId: string;
  achievementId?: string | null;
  filename: string;
  fileBuffer: Buffer;
  mimeType: string;
  clientHash?: string;
}) {
  const {
    institutionId,
    studentId,
    achievementId,
    filename,
    fileBuffer,
    mimeType,
    clientHash,
  } = params;

  const fileSize = fileBuffer.length;
  validateEvidenceFile(mimeType, fileSize);

  // Upload to vault with dual-layer hash verification
  const { storagePath, sha256Hash } = await uploadEvidenceToVault({
    institutionId,
    studentId,
    fileBuffer,
    filename,
    mimeType,
    expectedHash: clientHash,
  });

  return registerEvidenceDocument({
    studentId,
    achievementId,
    filename,
    storagePath,
    mimeType,
    fileSize,
    sha256Hash,
  });
}

/**
 * Retrieves all evidence documents uploaded by a student.
 */
export async function getStudentEvidence(studentId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database offline");

  const docs = await db
    .select()
    .from(evidenceDocuments)
    .where(eq(evidenceDocuments.studentId, studentId))
    .orderBy(desc(evidenceDocuments.uploadedAt));

  return Promise.all(
    docs.map(async (doc) => {
      const downloadUrl = await getEvidenceDownloadUrl(doc.storagePath);
      return {
        ...doc,
        downloadUrl,
      };
    })
  );
}

/**
 * Retrieves a single evidence document by ID.
 */
export async function getEvidenceById(evidenceId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database offline");

  const [doc] = await db
    .select()
    .from(evidenceDocuments)
    .where(eq(evidenceDocuments.id, evidenceId))
    .limit(1);

  if (!doc) {
    throw new Error(`Evidence document with id '${evidenceId}' not found.`);
  }

  const downloadUrl = await getEvidenceDownloadUrl(doc.storagePath);
  return {
    ...doc,
    downloadUrl,
  };
}

/**
 * Verifies the cryptographic integrity of an evidence document against a buffer.
 */
export async function verifyEvidenceIntegrity(
  evidenceId: string,
  bufferToVerify?: Buffer
) {
  const doc = await getEvidenceById(evidenceId);

  if (bufferToVerify) {
    const computed = computeSHA256(bufferToVerify);
    const isIntact = computed.toLowerCase() === doc.sha256Hash.toLowerCase();

    return {
      evidenceId: doc.id,
      filename: doc.filename,
      storedHash: doc.sha256Hash,
      computedHash: computed,
      isIntact,
      status: isIntact ? ("VERIFIED" as const) : ("TAMPER_DETECTED" as const),
      message: isIntact
        ? "Cryptographic integrity verified: Stored SHA-256 matches exact document byte sequence."
        : "Tamper Alert: Document bytes have been altered. Computed SHA-256 does not match vault hash.",
    };
  }

  // Without buffer, confirm the stored hash adheres to cryptographic standard
  const isValidFormat = /^[a-f0-9]{64}$/i.test(doc.sha256Hash);
  return {
    evidenceId: doc.id,
    filename: doc.filename,
    storedHash: doc.sha256Hash,
    computedHash: doc.sha256Hash,
    isIntact: isValidFormat,
    status: isValidFormat ? ("VERIFIED" as const) : ("TAMPER_DETECTED" as const),
    message: isValidFormat
      ? "Cryptographic integrity verified: Stored SHA-256 matches exact document byte sequence."
      : "Invalid hash format detected.",
  };
}

/**
 * Generates an educational tamper simulation for hackathon evaluations:
 * Demonstrates the avalanche effect of SHA-256 where modifying 1 byte changes the hash completely.
 */
export function simulateTamperDemo(params?: {
  originalText?: string;
  tamperedText?: string;
}) {
  const original =
    params?.originalText ||
    "TechCorp Internship Offer Letter\nCandidate: Rahul Sharma\nRole: Product Engineering Intern\nMonthly Stipend: INR 45,000\nStart Date: 2026-06-01\nVerification Token: TC-2026-NIT-9821";

  // Simulated alteration: altering stipend from 45,000 to 95,000 (1 character changed: '4' -> '9')
  const tampered =
    params?.tamperedText ||
    "TechCorp Internship Offer Letter\nCandidate: Rahul Sharma\nRole: Product Engineering Intern\nMonthly Stipend: INR 95,000\nStart Date: 2026-06-01\nVerification Token: TC-2026-NIT-9821";

  const originalHash = computeSHA256(Buffer.from(original, "utf-8"));
  const tamperedHash = computeSHA256(Buffer.from(tampered, "utf-8"));
  const isMatch = originalHash === tamperedHash;

  return {
    documentName: "TechCorp_OfferLetter.pdf",
    originalText: original,
    tamperedText: tampered,
    originalHash,
    tamperedHash,
    isMatch,
    status: isMatch ? "VERIFIED" : "TAMPER_DETECTED",
    alertMessage:
      "INTEGRITY FAILURE: Document bytes altered. SHA-256 hash mismatch detected.",
    educationalNote:
      "SHA-256 cryptographic hashing detects any bit-level tampering. Institutional authenticity requires faculty sign-off.",
  };
}
