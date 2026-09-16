# PRAGATI — FRONTEND RULES

## 1. Design Objective

PRAGATI should look like a serious institutional platform.

Avoid generic "AI dashboard" aesthetics.

---

## 2. Design Principles

* clean
* professional
* responsive
* accessible
* consistent
* data-driven
* minimal unnecessary animation

---

## 3. Role-Based Navigation

Student:

```text
Dashboard
Profile
Academics
Skills
Assessments
Achievements
Internship
Career Passport
Recruitment
Applications
```

Faculty:

```text
Dashboard
Students
Skill Gaps
Interventions
Internship Verification
Reports
```

HOD:

```text
Dashboard
Department Analytics
Skill Heatmap
Interventions
Reports
```

T&P:

```text
Dashboard
Recruitment Drives
Rule Builder
Eligible Students
Applications
Analytics
```

Admin:

```text
Dashboard
Users
Departments
Skills
Assessments
Audit Logs
Settings
```

---

## 4. No Fake Data

Do not hardcode business data in components.

Bad:

```text
const eligibleStudents = 67;
```

Good:

Fetch from backend.

---

## 5. Loading States

Every asynchronous screen should handle:

* loading
* success
* empty state
* error
* retry

---

## 6. Error Handling

Errors should be understandable.

Avoid:

```text
500 Internal Server Error
```

as the only user-facing message.

---

## 7. Forms

Forms must:

* validate input
* show errors
* prevent duplicate submission
* show success state
* handle API errors

---

## 8. Accessibility

Use:

* semantic HTML
* keyboard navigation
* sufficient contrast
* labels
* accessible dialogs
* accessible tables

---

## 9. Data Visualization

Use charts only where they answer a question.

Examples:

* CGPA trend
* skill progression
* department skill heatmap
* intervention outcomes
* internship completion

Do not add charts merely for visual decoration.

---

## 10. Status Language

Use consistent terms.

Example:

```text
Eligible
Not Eligible
Pending
Verified
Rejected
Completed
In Progress
Needs Attention
Resolved
```

---

## 11. Security UI

Never display:

* passwords
* tokens
* secrets

Sensitive information must respect backend permissions.

---

## 12. Career Passport

The passport should visually distinguish:

* verified
* self-reported
* pending

Do not imply that all information is equally trusted.

---

## 13. Responsive Design

Support:

* desktop
* tablet
* mobile

The primary hackathon demo can prioritize desktop.

---

## 14. Frontend Architecture

Prefer:

```text
components/
features/
pages/
hooks/
services/
types/
utils/
```

Keep API calls separated from UI components.