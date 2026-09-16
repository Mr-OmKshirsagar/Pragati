# PRAGATI — AI RULES

## 1. AI Philosophy

AI is an explanation and assistance layer.

AI is NOT the authority for high-impact institutional decisions.

---

## 2. AI MAY

* explain skill-gap flags
* summarize student progress
* draft mentoring recommendations
* summarize internship evidence
* generate report narratives
* assist faculty with structured insights

---

## 3. AI MUST NOT

AI must not independently:

* determine placement eligibility
* rank students
* reject students
* declare a student employable
* verify certificate authenticity
* verify internship authenticity
* alter academic data
* alter assessment scores

---

## 4. Skill Gap Detection

Detection is deterministic.

Example:

```text
DSA score:
78 → 70 → 61

AND

Active backlog > 0

THEN

SKILL_GAP_FLAG
```

The rule engine creates the flag.

---

## 5. AI Explanation

Input:

```text
Student:
Year 3

DSA:
78 → 70 → 61

OS backlog:
1

Rule:
Two consecutive DSA assessment declines
AND active backlog
```

AI output should explain:

* what happened
* relevant evidence
* possible intervention options

---

## 6. Human Approval

AI recommendation:

```text
Suggested:
DSA mentoring
```

Faculty:

```text
Approve
Modify
Reject
```

The human action becomes the institutional record.

---

## 7. Prompt Security

Never send unnecessary:

* passwords
* tokens
* authentication data
* private secrets

Minimize PII.

---

## 8. Output Validation

AI output must be treated as untrusted text.

Validate:

* length
* structure
* expected fields

Do not execute AI output as code or SQL.

---

## 9. AI Failure

If AI fails:

Show:

```text
AI explanation temporarily unavailable.
```

The underlying rule-based result remains available.

---

## 10. AI Logging

Record:

* model
* model version if available
* request type
* timestamp
* success/failure
* latency

Avoid storing unnecessary sensitive prompt content.

---

## 11. Prompt Versioning

Every production prompt should have a version.

Example:

```text
SKILL_GAP_EXPLANATION_V1
```

---

## 12. AI UI

Clearly label:

**Rule-generated finding**

and:

**AI-generated explanation**

Never make users believe AI made the deterministic decision.