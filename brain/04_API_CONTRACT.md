# PRAGATI — API CONTRACT

## 1. Base URL

```text
/api/v1
```

All APIs must be versioned.

---

## 2. Authentication

```text
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET  /auth/me
```

---

## 3. Students

```text
GET    /students/me
PATCH  /students/me
GET    /students/{id}
GET    /students
```

Access must be role-controlled.

---

## 4. Academics

```text
GET /students/{id}/academics
POST /students/{id}/academics
GET /students/{id}/backlogs
```

Academic records must not be editable by ordinary students.

---

## 5. Skills

```text
GET /skills
GET /students/{id}/skills
GET /students/{id}/skill-history
```

---

## 6. Assessments

```text
GET  /assessments
GET  /assessments/{id}
POST /assessments/{id}/submit
GET  /students/{id}/assessments
```

Assessment results should be immutable after official submission unless an authorized correction workflow exists.

---

## 7. Achievements

```text
GET    /students/me/achievements
POST   /students/me/achievements
PATCH  /achievements/{id}
DELETE /achievements/{id}
```

---

## 8. Evidence

```text
POST /evidence
GET  /evidence/{id}
GET  /evidence/{id}/verification
```

File uploads must enforce security controls.

---

## 9. Skill Gaps

```text
GET  /students/{id}/skill-gaps
GET  /faculty/skill-gaps
POST /skill-gaps/{id}/intervention
PATCH /skill-gaps/{id}
```

---

## 10. Interventions

```text
GET  /interventions
POST /interventions
PATCH /interventions/{id}
POST /interventions/{id}/outcome
```

---

## 11. Internships

```text
GET  /students/me/internships
POST /students/me/internships
GET  /internships/{id}
PATCH /internships/{id}
```

---

## 12. Verification

```text
GET  /internships/{id}/verification
POST /internships/{id}/verify
POST /evidence/{id}/verify
```

Only authorized users can verify.

---

## 13. Placement

```text
POST /recruitment-drives
GET  /recruitment-drives
GET  /recruitment-drives/{id}
POST /recruitment-drives/{id}/evaluate
GET  /recruitment-drives/{id}/eligible-students
POST /recruitment-drives/{id}/publish
```

---

## 14. Applications

```text
POST /recruitment-drives/{id}/apply
GET  /students/me/applications
GET  /recruitment-drives/{id}/applications
```

---

## 15. Reports

```text
GET /hod/dashboard
GET /faculty/dashboard
GET /tnp/dashboard
GET /students/me/dashboard
```

---

## 16. Health

```text
GET /health
GET /health/ready
```

Do not expose sensitive infrastructure details.

---

## 17. Response Format

Success:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Requested resource was not found."
  }
}
```

Never expose stack traces or internal exceptions.

---

## 18. Pagination

Use:

```text
?page=1&page_size=20
```

Set a maximum page size.

---

## 19. API Rules

* Validate all input.
* Authenticate protected requests.
* Authorize every protected resource.
* Use correct HTTP status codes.
* Never return unnecessary PII.
* Never expose database internals.
* Use consistent error codes.