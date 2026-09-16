# Phase 06 Specification: Evidence Documents & Cryptographic SHA-256 Storage

## 1. Metadata
- **Phase**: 06
- **Title**: Cryptographic Evidence Vault, Supabase Storage & SHA-256 Tamper Detection
- **Status**: Ready for Implementation
- **Dependencies**: Phase 00, Phase 01, Phase 02
- **Target Files**:
  - `backend/src/_core/storage.ts`
  - `backend/src/routers/evidence.ts`
  - `frontend/client/src/lib/crypto.ts`
  - `frontend/client/src/components/EvidenceUploadModal.tsx`
  - `frontend/client/src/components/TamperDemoModal.tsx`

---

## 2. Objective & Scope
Integrate **Supabase Storage** (`evidence-vault` bucket) for storing student proof documents (internship offer letters, completion certificates, achievement proofs). Implement dual-layer (client & server) **SHA-256 cryptographic hashing** to guarantee file integrity. Provide a live **Tamper Demonstration** component to demonstrate to evaluators how altered document bytes trigger immediate integrity mismatch warnings.

---

## 3. Cryptographic Integrity Architecture

### 3.1 Integrity vs. Authenticity
- **Integrity (SHA-256)**: Proves that the byte sequence stored in Supabase Storage is bit-for-bit identical to the file uploaded by the student. Hashing detects any subsequent modification, truncation, or substitution.
- **Authenticity**: Proves the document was issued by a legitimate employer or authority. Authenticity requires institutional faculty review (`INSTITUTION_VERIFIED`) or issuer API attestation (`ISSUER_VERIFIED`).

### 3.2 Verification Lifecycle States
```text
Upload File (PDF / PNG)
  │
  ├── 1. Client computes SHA-256 hash
  ├── 2. Upload to Supabase Storage: evidence-vault/{institution}/{student}/{filename}
  ├── 3. Backend verifies buffer SHA-256 hash matches client hash
  ├── 4. Insert into evidence_documents:
  │       - sha256_hash (64 hex characters)
  │       - verification_status: 'SELF_REPORTED'
  └── 5. Verification Transition:
          SELF_REPORTED ──► PENDING ──► INSTITUTION_VERIFIED (Faculty sign-off)
                                   └──► REJECTED (Insufficient proof)
```

---

## 4. Implementation Details

### 4.1 Client-Side SHA-256 Computation (`client/src/lib/crypto.ts`)
```typescript
export async function computeFileSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}
```

### 4.2 Server-Side Supabase Storage Handler (`backend/src/_core/storage.ts`)
```typescript
import { supabaseAdmin } from "./supabase";
import crypto from "crypto";

export async function uploadEvidenceToVault(params: {
  institutionId: string;
  studentId: string;
  fileBuffer: Buffer;
  filename: string;
  mimeType: string;
  expectedHash?: string;
}): Promise<{ storagePath: string; sha256Hash: string }> {
  const { institutionId, studentId, fileBuffer, filename, mimeType, expectedHash } = params;

  // 1. Calculate Server SHA-256 Checksum
  const computedHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

  // 2. Validate against client hash if provided
  if (expectedHash && computedHash !== expectedHash) {
    throw new Error("Tamper Alert: Client checksum does not match server-computed checksum.");
  }

  // 3. Construct Isolated Tenant Path
  const cleanName = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const storagePath = `${institutionId}/${studentId}/${Date.now()}-${cleanName}`;

  // 4. Upload to Supabase Storage Bucket
  const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "evidence-vault";
  const { error } = await supabaseAdmin.storage.from(bucketName).upload(storagePath, fileBuffer, {
    contentType: mimeType,
    upsert: false,
  });

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  return { storagePath, sha256Hash: computedHash };
}
```

### 4.3 Evidence Router (`backend/src/routers/evidence.ts`)
```typescript
import { router, studentProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { evidenceDocuments } from "../../drizzle/schema";

export const evidenceRouter = router({
  registerEvidence: studentProcedure
    .input(
      z.object({
        filename: z.string(),
        storagePath: z.string(),
        mimeType: z.enum(["application/pdf", "image/png", "image/jpeg"]),
        fileSize: z.number().max(10 * 1024 * 1024), // 10MB limit
        sha256Hash: z.string().length(64),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database offline");

      const [record] = await db.insert(evidenceDocuments).values({
        studentId: ctx.user.studentProfile.id,
        filename: input.filename,
        storageBucket: "evidence-vault",
        storagePath: input.storagePath,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        sha256Hash: input.sha256Hash,
        verificationStatus: "SELF_REPORTED",
      }).returning();

      return record;
    }),
});
```

---

## 5. Tamper Demonstration Flow (`TamperDemoModal.tsx`)
A dedicated component for judges and hackathon evaluation:
1. **Step 1 (Original Upload)**:
   - User uploads `TechCorp_OfferLetter.pdf`.
   - System computes: `SHA-256: 3b9c7...` and stores it.
   - Status: `[✓ INTEGRITY VERIFIED]`.
2. **Step 2 (Simulated Tamper)**:
   - User clicks *"Inject Modified Byte"* (or uploads an edited PDF with altered stipend/dates).
   - System recomputes hash: `SHA-256: e81a4...`.
3. **Step 3 (Comparison)**:
   - UI shows side-by-side diff of original recorded hash vs recomputed hash.
   - Triggers red alert: `[⚠ INTEGRITY FAILURE: FILE BYTES ALTERED]`.
   - Displays truthfulness note: *"SHA-256 detects byte alterations; authenticity requires faculty sign-off."*

---

## 6. Verification & Acceptance Tests
1. Hash Verification:
   - Generate SHA-256 for a known string/buffer $\rightarrow$ Verify output matches standard sha256 output.
2. File Restrictions:
   - Attempt uploading `.exe` file $\rightarrow$ Rejected by MIME type validator.
   - Attempt uploading file $> 10\text{MB}$ $\rightarrow$ Rejected by size validator.
3. Tamper Test Suite:
   - Verify that altering a single character in the file changes the entire SHA-256 hex string.

---

## 7. Definition of Done
- [ ] Supabase Storage bucket `evidence-vault` configured.
- [ ] Client Web Crypto SHA-256 hashing implemented.
- [ ] Backend server validation and metadata persistence functioning.
- [ ] `TamperDemoModal.tsx` working smoothly for evaluation demonstrations.
