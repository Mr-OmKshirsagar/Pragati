# PRAGATI — TESTING STRATEGY

## 1. Objective

Testing must verify both functionality and security.

---

## 2. Unit Tests

Test:

* skill-gap rules
* eligibility evaluator
* verification state transitions
* hashing
* validation
* permission functions

---

## 3. API Tests

Test:

* authentication
* student endpoints
* assessment submission
* evidence upload
* internship verification
* eligibility
* recruitment
* applications

---

## 4. Security Tests

Mandatory:

### IDOR

Student A cannot access Student B.

### RBAC

Student cannot call faculty/HOD/T&P operations.

### Privilege Escalation

Student cannot change their role.

### Academic Integrity

Student cannot modify official assessment results.

### Self-Approval

Student cannot approve their own internship.

### File Upload

Reject:

* oversized files
* unsupported types
* path traversal attempts

---

## 5. Rate Limit Tests

Verify:

* limit enforcement
* reset
* different users
* concurrent requests

---

## 6. Cache Tests

Verify:

* correct cache key
* correct tenant isolation
* invalidation
* Redis failure fallback

---

## 7. Integration Tests

Test:

```text
Assessment
→ Skill Gap
→ Intervention
→ Improvement
```

and:

```text
Internship
→ Evidence
→ Verification
→ Eligibility
→ Application
```

---

## 8. End-to-End Test

Full hero journey:

```text
Login
→ Student
→ Assessment
→ Skill gap
→ Faculty intervention
→ Improvement
→ Internship
→ Evidence
→ Verification
→ T&P rule
→ Eligibility
→ Recruitment
→ Application
```

---

## 9. Regression

Before final demo:

Run the complete test suite.

Do not remove failing tests to make CI green.

---

## 10. Test Data

Use dedicated test data.

Never run destructive tests against production data.

---

## 11. Definition of Done

A feature is DONE only when:

* implemented
* integrated
* tested
* security-reviewed
* documented
* manually verified where appropriate