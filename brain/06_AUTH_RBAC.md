# PRAGATI — AUTHENTICATION & RBAC

## 1. Roles

```text
STUDENT
FACULTY
HOD
TNP_COORDINATOR
ADMIN
```

---

## 2. Role Permissions

### STUDENT

Can:

* view own profile
* edit permitted personal information
* view academic records
* take assessments
* submit achievements
* upload evidence
* manage internship information
* view eligibility
* apply to eligible drives
* export Career Passport

Cannot:

* modify verified academic records
* verify own evidence
* verify own internship
* access other students
* create placement rules

---

### FACULTY

Can:

* view assigned students
* view skill gaps
* create interventions
* record mentoring outcomes
* review internship evidence
* verify authorized evidence

Cannot:

* access unrelated departments without permission
* modify official academic results

---

### HOD

Can:

* view department analytics
* view department students
* review skill-gap trends
* review interventions
* generate department reports

Cannot:

* bypass audit controls
* modify protected academic records without explicit authority

---

### TNP_COORDINATOR

Can:

* create recruitment drives
* create eligibility rules
* evaluate eligibility
* publish opportunities
* view permitted candidate data
* monitor applications

Cannot:

* modify academic truth data
* modify assessment results

---

### ADMIN

Can:

* manage users
* manage roles
* manage departments
* configure skills
* configure assessments
* review audit logs
* manage institution settings

All sensitive administrative operations must be audited.

---

## 3. Authorization Layers

Every protected operation:

```text
Authenticated?
      ↓
Correct role?
      ↓
Correct institution?
      ↓
Correct resource ownership/scope?
      ↓
Allowed operation?
```

---

## 4. Student Ownership

A student may only modify resources they own.

Never accept:

```text
student_id
```

from a student and trust it.

Derive the student identity from the authenticated principal where possible.

---

## 5. Role Assignment

Roles must be server-controlled.

A user cannot promote themselves by modifying:

```json
{
  "role": "ADMIN"
}
```

---

## 6. Authentication Failure

Return generic authentication errors.

Do not reveal whether:

* email exists
* account exists
* password is correct

when unnecessary.

---

## 7. Token Security

Use:

* short-lived access tokens
* secure refresh mechanism
* token rotation/revocation where implemented

Never expose secrets in frontend source code.