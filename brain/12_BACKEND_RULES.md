# PRAGATI — BACKEND RULES

## 1. Architecture

Use modular architecture.

Avoid giant route files.

---

## 2. Recommended Structure

```text
backend/
├── app/
│   ├── api/
│   ├── core/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   ├── repositories/
│   ├── rules/
│   ├── workers/
│   └── utils/
├── tests/
├── migrations/
└── main.py
```

Adapt to existing repository structure if already established.

---

## 3. Routes

Routes should be thin.

Bad:

```text
route
→ 300 lines of business logic
```

Good:

```text
route
→ validation
→ service
→ response
```

---

## 4. Services

Business logic belongs in services/domain modules.

---

## 5. Database

Use ORM/repository patterns.

Do not construct SQL using raw user input.

---

## 6. Schemas

Use separate:

* request schemas
* response schemas
* database models

Never expose database models directly.

---

## 7. Transactions

Use transactions for multi-step operations where atomicity matters.

Example:

Internship approval:

```text
verification update
+
internship status update
+
audit log
```

should be handled consistently.

---

## 8. Idempotency

Where appropriate, repeated requests should not create duplicate records.

Especially:

* applications
* evidence uploads
* verification actions
* recruitment publication

---

## 9. Pagination

Never return unbounded lists.

---

## 10. Query Optimization

Watch for:

* N+1 queries
* unnecessary joins
* repeated aggregates

Use indexes and efficient queries.

---

## 11. Background Jobs

Use background workers for tasks such as:

* report generation
* AI generation
* notifications
* expensive document processing

Do not move simple CRUD into background jobs unnecessarily.

---

## 12. Logging

Use structured logs.

Never log secrets.

---

## 13. Health

Implement:

```text
/health
/health/ready
```

---

## 14. Documentation

Maintain OpenAPI documentation automatically through FastAPI where applicable.

---

## 15. Backend Principle

The backend owns:

* truth
* security
* business logic
* eligibility
* verification state
* permissions