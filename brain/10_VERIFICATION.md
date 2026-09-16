# PRAGATI — VERIFICATION SYSTEM

## 1. Verification Philosophy

Not every student claim has the same level of trust.

PRAGATI explicitly represents verification state.

---

## 2. Verification States

```text
SELF_REPORTED
PENDING
INSTITUTION_VERIFIED
ISSUER_VERIFIED
REJECTED
```

---

## 3. Evidence Integrity

Every uploaded document should receive a SHA-256 hash.

Example:

```text
Certificate.pdf

SHA-256:
ABC123...
```

If file bytes change:

```text
New SHA-256:
XYZ789...
```

The system can detect that the file content changed.

---

## 4. Important Limitation

SHA-256 does NOT prove:

* issuer authenticity
* legitimacy
* truthfulness
* ownership

It proves file integrity relative to the recorded hash.

---

## 5. Certificate Verification

Possible workflow:

```text
Upload
 ↓
Hash
 ↓
Metadata
 ↓
Pending
 ↓
Issuer verification where available
 ↓
Issuer Verified
```

If no issuer integration exists:

```text
Institution Verified
```

may be used after authorized review.

---

## 6. Internship Verification

Internship evidence may include:

1. Offer letter
2. Progress check-ins
3. Completion certificate
4. Internship report
5. Supervisor confirmation where available

---

## 7. Evidence Completeness

Example:

```text
Offer Letter             ✓
Check-in 1               ✓
Check-in 2               ✗
Completion Certificate   ✓
Faculty Review           Pending

Evidence Completeness:
80%
```

This is not an authenticity score.

It indicates evidence coverage.

---

## 8. Faculty Review

Faculty reviews the evidence and chooses:

```text
APPROVE
REQUEST_MORE_EVIDENCE
REJECT
```

Every decision is audited.

---

## 9. Tamper Demonstration

Hackathon demo:

1. Upload original document.
2. Store hash.
3. Modify document.
4. Upload modified file.
5. Hash differs.
6. Show integrity warning.

---

## 10. Verification Badge

Use clear badges:

✓ Issuer Verified

✓ Institution Verified

◐ Self Reported

! Pending

✕ Rejected

---

## 11. No False Claims

Never state:

"Certificate is genuine"

when the system only knows:

"File hash matches."

Use precise language.