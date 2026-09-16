# PRAGATI — SCOPE CONTROL

## 1. Primary Rule

The hackathon goal is a reliable vertical slice, not a complete ERP.

---

## 2. MUST BUILD

### Tier 1 — Critical

* Authentication
* RBAC
* Student profile
* Academic records
* Skills
* Assessments
* Skill-gap rules
* Faculty intervention
* Internship
* Evidence upload
* SHA-256
* Verification
* Placement rule builder
* Eligibility evaluator
* Recruitment drive
* Student application

---

## 3. SHOULD BUILD

* AI explanation
* Career Passport
* HOD analytics
* Redis caching
* Rate limiting
* Audit logs
* Notifications

---

## 4. NICE TO HAVE

* issuer API integration
* advanced reports
* email integration
* PDF export
* advanced analytics
* company portal

---

## 5. FUTURE

Do not build unless core functionality is complete:

* mobile application
* cross-institution benchmarking
* alumni network
* LMS integrations
* automatic ERP synchronization
* advanced ML prediction
* blockchain
* nationwide deployment
* full company self-service ecosystem

---

## 6. Feature Evaluation

Before implementing a new feature:

### Question 1

Does it directly support ED-06?

### Question 2

Does it strengthen the demo?

### Question 3

Can it be completed reliably?

### Question 4

Does it introduce security risk?

### Question 5

Does it compete with core implementation time?

If the feature fails multiple questions:

Move it to FUTURE.

---

## 7. Scope Freeze

Once the core vertical slice works:

STOP adding major features.

Use remaining time for:

* testing
* security
* performance
* UI polish
* demo reliability

---

## 8. Rule

**A smaller working system beats a larger broken system.**