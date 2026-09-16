# PRAGATI — STRICT ENGINEERING RULES

## NON-NEGOTIABLE

This file overrides convenience.

AI coding agents MUST read this before modifying the project.

---

## 1. INSPECT BEFORE MODIFYING

Before changing anything:

1. Inspect repository.
2. Read relevant brain files.
3. Find existing implementation.
4. Understand dependencies.
5. Check tests.
6. Plan change.
7. Implement.
8. Test.
9. Verify.

Never blindly overwrite working code.

---

## 2. NEVER FAKE FUNCTIONALITY

No fake API responses.

No hardcoded business statistics.

No hardcoded eligibility.

No fake success responses.

No UI pretending that an unavailable backend exists.

Mock data is allowed ONLY when explicitly identified as demo/seed data.

---

## 3. DATABASE IS SOURCE OF TRUTH

Business data must come from the backend/database.

Frontend state is not authoritative.

---

## 4. BACKEND OWNS BUSINESS LOGIC

Backend determines:

* eligibility
* permissions
* verification
* internship state
* skill-gap rules
* institutional access

---

## 5. NEVER TRUST THE CLIENT

Any value coming from the browser can be manipulated.

Always validate server-side.

---

## 6. PREVENT IDOR

Every resource access must verify authorization.

Never assume:

```text
authenticated = authorized
```

---

## 7. RBAC IS SERVER-SIDE

Frontend hiding a button is NOT security.

---

## 8. NEVER STORE PLAINTEXT PASSWORDS

Use Argon2id or bcrypt.

Never log passwords.

---

## 9. NEVER COMMIT SECRETS

Never commit:

* `.env`
* API keys
* passwords
* JWT secrets
* OAuth secrets

---

## 10. SECURE FILE UPLOADS

Validate:

* size
* MIME
* extension
* content where feasible
* filename/path
* storage location

Calculate SHA-256.

---

## 11. SHA-256 CLAIM

SHA-256 proves file integrity.

It does NOT prove authenticity.

Never claim otherwise.

---

## 12. AI RESTRICTIONS

AI cannot independently:

* rank students
* decide eligibility
* verify authenticity
* modify academic records
* determine employability

AI explains.

Rules decide.

Humans approve institutional actions.

---

## 13. PLACEMENT ELIGIBILITY

Must use deterministic rules.

Every result must include reasons.

Never use an unexplained AI score as the eligibility decision.

---

## 14. AUDIT SENSITIVE ACTIONS

Audit:

* verification
* internship approval
* eligibility-rule modification
* role changes
* recruitment publication
* sensitive data changes

---

## 15. RATE LIMIT

Protect:

* login
* AI
* uploads
* expensive reports
* public APIs

Use Redis where appropriate.

---

## 16. CACHING

Caching must never change correctness.

PostgreSQL remains source of truth.

Cache keys must respect:

* user
* institution
* resource scope

---

## 17. AI FAILURE

AI failure must never break core workflows.

Provide fallback behavior.

---

## 18. NO MICROSERVICE THEATER

Do not introduce microservices, Kafka, Kubernetes, blockchain or other infrastructure merely to make the architecture appear advanced.

---

## 19. NO FEATURE CREEP

If core functionality is incomplete:

DO NOT add unrelated features.

---

## 20. NO FALSE COMPLETION

Never say:

"Implemented"

until:

* code exists
* integration exists
* tests pass
* behavior is verified

---

## 21. NEVER DELETE TESTS TO PASS

Fix the implementation.

Do not weaken tests merely to obtain a green test suite.

---

## 22. NEVER HIDE FAILURES

If something fails:

Report it.

Investigate it.

Fix the root cause.

Do not silently bypass it.

---

## 23. UPDATE THE BRAIN

When architecture or behavior changes:

Update the relevant brain file.

When implementation progresses:

Update:

```text
17_PROGRESS.md
```

---

## 24. CHANGE REPORT

After every significant implementation phase, report:

### Changed

Files/modules changed.

### Database

Schema/migration changes.

### API

Endpoints changed.

### Security

Security implications.

### Testing

Tests executed.

### Known Issues

Remaining problems.

---

## 25. DEFINITION OF DONE

A feature is complete only when:

```text
Implemented
+
Integrated
+
Tested
+
Security Reviewed
+
Documented
+
Verified
```

---

# FINAL PRINCIPLE

PRAGATI is a serious software product prototype.

Build:

**secure + simple + explainable + testable + reliable**

Do not optimize for impressive architecture diagrams.

Optimize for a working system that survives a judge asking:

> "Show me how this actually works."