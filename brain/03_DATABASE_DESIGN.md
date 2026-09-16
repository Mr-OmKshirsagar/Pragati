# PRAGATI — MONGODB DATABASE ARCHITECTURE

## 1. Primary Database

PRAGATI uses:

**MongoDB Atlas**

MongoDB is the primary source of truth for application data.

Do NOT introduce PostgreSQL unless a future, explicit requirement makes it necessary.

---

# 2. Technology

Recommended backend database stack:

* MongoDB Atlas
* Python
* FastAPI
* PyMongo or Motor depending on the application's async architecture
* Pydantic models
* Redis

Use one consistent MongoDB access strategy throughout the backend.

Do not mix multiple database libraries without a concrete reason.

---

# 3. Database Philosophy

MongoDB should store structured application documents while maintaining clear references between related entities.

Prefer:

* predictable document structures
* appropriate embedding
* references for large or independently managed entities
* indexes for common queries
* schema validation at the application layer
* unique constraints where required

Do not treat MongoDB as an unstructured JSON dump.

---

# 4. Database Structure

Recommended collections:

```text
institutions
departments
users
student_profiles

academic_records
subjects
subject_results
backlogs

skills
assessments
assessment_attempts
skill_assessments

achievements
evidence_documents
verifications

skill_gaps
interventions

internships
internship_evidence
internship_checkins
internship_verifications

recruitment_drives
placement_rules
eligibility_evaluations
applications

notifications
audit_logs
```

---

# 5. Institution

Example:

```json
{
  "_id": "ObjectId",
  "name": "Example Institute",
  "code": "EXI",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

---

# 6. Department

```json
{
  "_id": "ObjectId",
  "institution_id": "ObjectId",
  "name": "Computer Science",
  "code": "CSE",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

Every institution-owned resource must have institution context where necessary.

---

# 7. User

```json
{
  "_id": "ObjectId",
  "institution_id": "ObjectId",
  "department_id": "ObjectId",
  "name": "Rahul Sharma",
  "email": "student@example.com",
  "password_hash": "...",
  "role": "STUDENT",
  "status": "ACTIVE",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

Never store plaintext passwords.

---

# 8. Student Profile

```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "institution_id": "ObjectId",
  "enrollment_number": "CSE2026XXX",
  "program": "B.Tech CSE",
  "section": "A",
  "admission_year": 2026,
  "graduation_year": 2030,
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

Keep frequently queried identity/profile information separate from large academic histories.

---

# 9. Academic Records

Semester-level record:

```json
{
  "_id": "ObjectId",
  "student_id": "ObjectId",
  "semester": 3,
  "academic_year": "2027-28",
  "sgpa": 8.2,
  "cgpa": 8.1,
  "created_at": "datetime"
}
```

Do not allow ordinary students to modify official academic records.

---

# 10. Subject Results

```json
{
  "_id": "ObjectId",
  "student_id": "ObjectId",
  "subject_id": "ObjectId",
  "semester": 3,
  "marks": 82,
  "grade": "A",
  "status": "PASSED",
  "created_at": "datetime"
}
```

---

# 11. Backlogs

```json
{
  "_id": "ObjectId",
  "student_id": "ObjectId",
  "subject_id": "ObjectId",
  "semester": 3,
  "status": "ACTIVE",
  "cleared_at": null
}
```

Maintain historical backlog information rather than only the current count.

---

# 12. Skills

```json
{
  "_id": "ObjectId",
  "name": "DSA",
  "category": "COMPUTER_SCIENCE",
  "description": "Data Structures and Algorithms",
  "active": true
}
```

---

# 13. Assessments

```json
{
  "_id": "ObjectId",
  "name": "DSA Assessment 3",
  "skill_ids": ["ObjectId"],
  "max_score": 100,
  "duration_minutes": 60,
  "status": "PUBLISHED",
  "created_at": "datetime"
}
```

---

# 14. Assessment Attempts

Each attempt should be a separate document.

```json
{
  "_id": "ObjectId",
  "assessment_id": "ObjectId",
  "student_id": "ObjectId",
  "score": 61,
  "submitted_at": "datetime",
  "attempt_number": 1
}
```

Official assessment results should be protected from student modification.

---

# 15. Skill Assessment History

```json
{
  "_id": "ObjectId",
  "student_id": "ObjectId",
  "skill_id": "ObjectId",
  "assessment_id": "ObjectId",
  "score": 61,
  "max_score": 100,
  "assessment_date": "datetime"
}
```

This history supports trend analysis.

Example:

```text
DSA
78
 ↓
70
 ↓
61
```

---

# 16. Achievements

```json
{
  "_id": "ObjectId",
  "student_id": "ObjectId",
  "title": "Hackathon Finalist",
  "type": "HACKATHON",
  "issuer": "Example Organization",
  "date": "datetime",
  "verification_status": "PENDING",
  "created_at": "datetime"
}
```

---

# 17. Evidence Documents

```json
{
  "_id": "ObjectId",
  "student_id": "ObjectId",
  "achievement_id": "ObjectId",
  "internship_id": null,
  "filename": "certificate.pdf",
  "storage_key": "institution/student/evidence/...",
  "mime_type": "application/pdf",
  "file_size": 123456,
  "sha256_hash": "...",
  "verification_status": "PENDING",
  "uploaded_at": "datetime"
}
```

The document itself should normally live in object storage, not directly inside MongoDB.

MongoDB stores metadata and the storage reference.

---

# 18. Verification

```json
{
  "_id": "ObjectId",
  "evidence_id": "ObjectId",
  "verifier_user_id": "ObjectId",
  "verification_type": "INSTITUTION",
  "status": "VERIFIED",
  "notes": "Reviewed by faculty",
  "verified_at": "datetime"
}
```

Possible states:

```text
SELF_REPORTED
PENDING
INSTITUTION_VERIFIED
ISSUER_VERIFIED
REJECTED
```

---

# 19. Skill Gaps

```json
{
  "_id": "ObjectId",
  "student_id": "ObjectId",
  "skill_id": "ObjectId",
  "rule_id": "DSA_DECLINE_WITH_BACKLOG",
  "severity": "HIGH",
  "status": "OPEN",
  "reason": {
    "score_history": [78, 70, 61],
    "active_backlogs": 1
  },
  "created_at": "datetime",
  "resolved_at": null
}
```

The reason should be stored so the finding is explainable.

---

# 20. Interventions

```json
{
  "_id": "ObjectId",
  "student_id": "ObjectId",
  "skill_gap_id": "ObjectId",
  "assigned_to": "ObjectId",
  "type": "MENTORING",
  "description": "DSA mentoring session",
  "status": "COMPLETED",
  "start_date": "datetime",
  "end_date": "datetime",
  "outcome": "Score improved from 61 to 78",
  "created_at": "datetime"
}
```

---

# 21. Internship

```json
{
  "_id": "ObjectId",
  "student_id": "ObjectId",
  "company_name": "TechCorp",
  "role": "Software Engineering Intern",
  "start_date": "datetime",
  "end_date": "datetime",
  "status": "COMPLETED",
  "supervisor_name": "Supervisor",
  "supervisor_email": "supervisor@example.com",
  "verification_status": "INSTITUTION_VERIFIED",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

---

# 22. Internship Evidence

```json
{
  "_id": "ObjectId",
  "internship_id": "ObjectId",
  "evidence_type": "COMPLETION_CERTIFICATE",
  "evidence_document_id": "ObjectId",
  "status": "VERIFIED",
  "created_at": "datetime"
}
```

Supported types:

```text
OFFER_LETTER
CHECK_IN
COMPLETION_CERTIFICATE
INTERNSHIP_REPORT
SUPERVISOR_CONFIRMATION
```

---

# 23. Internship Check-ins

```json
{
  "_id": "ObjectId",
  "internship_id": "ObjectId",
  "student_id": "ObjectId",
  "check_in_date": "datetime",
  "summary": "Completed assigned project module",
  "status": "SUBMITTED",
  "reviewed_by": "ObjectId"
}
```

---

# 24. Placement Rules

Store eligibility criteria as structured JSON.

Example:

```json
{
  "_id": "ObjectId",
  "recruitment_drive_id": "ObjectId",
  "version": 1,
  "rule_definition": {
    "operator": "AND",
    "conditions": [
      {
        "field": "cgpa",
        "operator": ">=",
        "value": 7.5
      },
      {
        "field": "active_backlogs",
        "operator": "=",
        "value": 0
      },
      {
        "field": "skill.DSA",
        "operator": ">=",
        "value": 70
      },
      {
        "field": "skill.Python",
        "operator": ">=",
        "value": 65
      },
      {
        "field": "internship_status",
        "operator": "=",
        "value": "COMPLETED"
      }
    ]
  },
  "active": true,
  "created_by": "ObjectId",
  "created_at": "datetime"
}
```

The evaluator must parse and execute this structure safely.

Never execute arbitrary code stored in the database.

---

# 25. Eligibility Evaluation

```json
{
  "_id": "ObjectId",
  "student_id": "ObjectId",
  "recruitment_drive_id": "ObjectId",
  "eligible": true,
  "reasons": [
    "CGPA 8.4 >= 7.5",
    "Active backlogs 0 = required 0",
    "DSA 78 >= 70",
    "Python 86 >= 65",
    "Internship status COMPLETED"
  ],
  "evaluated_at": "datetime"
}
```

Reasons are essential for transparency.

---

# 26. Recruitment Drive

```json
{
  "_id": "ObjectId",
  "institution_id": "ObjectId",
  "company_name": "ABC Technologies",
  "job_title": "Software Engineer",
  "description": "...",
  "application_deadline": "datetime",
  "status": "PUBLISHED",
  "created_by": "ObjectId",
  "created_at": "datetime"
}
```

---

# 27. Applications

```json
{
  "_id": "ObjectId",
  "student_id": "ObjectId",
  "recruitment_drive_id": "ObjectId",
  "status": "APPLIED",
  "applied_at": "datetime"
}
```

Create a unique compound index:

```text
(student_id, recruitment_drive_id)
```

to prevent duplicate applications.

---

# 28. Audit Logs

```json
{
  "_id": "ObjectId",
  "institution_id": "ObjectId",
  "user_id": "ObjectId",
  "action": "INTERNSHIP_VERIFIED",
  "resource_type": "INTERNSHIP",
  "resource_id": "ObjectId",
  "metadata": {},
  "created_at": "datetime"
}
```

Audit logs should be append-only from the application's perspective.

---

# 29. Indexing

Create indexes based on actual query patterns.

Important examples:

```text
users.email UNIQUE

users.institution_id + users.role

student_profiles.user_id UNIQUE

student_profiles.institution_id

academic_records.student_id + semester

skill_assessments.student_id + skill_id + assessment_date

skill_gaps.student_id + status

interventions.assigned_to + status

internships.student_id

internships.verification_status

evidence_documents.student_id

evidence_documents.sha256_hash

recruitment_drives.institution_id + status

eligibility_evaluations.recruitment_drive_id + eligible

applications.student_id + recruitment_drive_id UNIQUE
```

Do not blindly add indexes to every field.

---

# 30. Tenant Isolation

Every institution-owned query must enforce:

```text
institution_id
```

where applicable.

Institution A must never retrieve Institution B's records.

Tenant isolation is enforced in the backend service/repository layer.

---

# 31. MongoDB Security

Use MongoDB Atlas security features where deployed:

* authentication
* least-privilege database users
* encrypted connections
* IP/network restrictions
* private networking where appropriate
* backups
* monitoring

Never expose MongoDB directly to the browser.

Frontend → Backend → MongoDB.

---

# 32. Transactions

Use MongoDB transactions when multiple documents must change atomically and the deployment topology supports them.

Example:

Internship verification:

```text
verification update
+
internship status update
+
audit log
```

must remain consistent.

Do not use transactions unnecessarily for simple single-document writes.

---

# 33. MongoDB Source of Truth

MongoDB is authoritative for:

* student records
* academic records
* skills
* assessments
* achievements
* internship information
* verification states
* interventions
* placement rules
* eligibility evaluations
* applications
* audit records

Redis is NOT the source of truth.

Frontend state is NOT the source of truth.

---

# 34. Schema Evolution

Use version-controlled migrations or controlled schema-update procedures even though MongoDB is schemaless.

Document breaking schema changes.

Do not silently change document structures without considering existing records.

---

# 35. Data Integrity

Application-level validation must enforce:

* required fields
* correct types
* valid enums
* reference validity
* institution ownership
* allowed state transitions

MongoDB being flexible does NOT mean invalid documents are acceptable.

---

# 36. Performance

Avoid:

* unbounded queries
* loading all students into memory
* N+1 database operations
* unnecessary aggregation pipelines

Use:

* projection
* pagination
* indexes
* aggregation pipelines
* selective denormalization

Only optimize after identifying the query bottleneck.

---

# 37. Object Storage

Do not store large certificates and internship documents directly in MongoDB unless there is a specific justified requirement.

Preferred:

```text
Object Storage
      ↓
file
      ↓
MongoDB
metadata + hash + storage_key
```

---

# 38. Final Database Principle

MongoDB provides flexibility.

PRAGATI still requires discipline.

The database must remain:

**structured + indexed + validated + tenant-isolated + auditable + secure.**