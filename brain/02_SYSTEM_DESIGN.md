# PRAGATI — SYSTEM DESIGN

## 1. Architecture Style

Use a **modular monolith** for the hackathon.

Do not introduce microservices unless a concrete requirement exists.

---

## 2. High-Level Architecture

```text
                    CLIENT
                      |
                      v
              React / Next.js
                      |
                      v
                HTTPS / REST
                      |
                      v
              API / FastAPI
                      |
        +-------------+-------------+
        |             |             |
        v             v             v
 Authentication   Business       Validation
 & RBAC           Services       & Policies
        |             |
        +------+------+ 
               |
       +-------+--------+
       |                |
       v                v
 PostgreSQL          Redis
       |                |
       |          Cache / Rate Limit
       |
       v
 Object Storage
       |
       v
 Evidence Documents

               AI Provider
                    |
                    v
          Explanation Layer
```

---

## 3. Backend Layers

### API Layer

Responsible for:

* HTTP requests
* authentication
* request validation
* response serialization

### Service Layer

Responsible for business logic.

### Repository/Data Layer

Responsible for database access.

### Domain Layer

Contains:

* eligibility rules
* skill-gap rules
* verification logic
* internship state transitions

---

## 4. Core Modules

```text
auth/
students/
academics/
skills/
assessments/
achievements/
evidence/
interventions/
internships/
verification/
placement/
recruitment/
notifications/
reports/
audit/
```

---

## 5. External Dependencies

Possible:

* PostgreSQL
* Redis
* Object storage
* LLM provider
* Email service

External integrations should have graceful failure behavior.

---

## 6. Request Flow

```text
Request
 ↓
HTTPS
 ↓
Authentication
 ↓
Authorization
 ↓
Validation
 ↓
Service
 ↓
Business Rules
 ↓
Database
 ↓
Audit
 ↓
Response
```

---

## 7. Performance Principles

Prefer:

* pagination
* indexed queries
* aggregation for dashboards
* caching read-heavy summaries
* background processing for expensive tasks

Avoid:

* N+1 queries
* loading entire datasets into frontend
* unnecessary database calls
* synchronous AI calls for unrelated operations

---

## 8. Scalability

Design institution context into the data model.

Institution → Department → User/Student

All institution-owned queries must enforce tenant boundaries.

---

## 9. Availability Principle

Core workflows must work even if AI or Redis is temporarily unavailable.

AI and caching are supporting components.

PostgreSQL is the primary source of truth.

---

## 10. Architecture Decision Rule

Before introducing a new infrastructure component, ask:

1. What problem does it solve?
2. Is that problem real?
3. Can the existing architecture solve it?
4. Does it increase operational risk?
5. Is it necessary for the hackathon?

If not, do not add it.