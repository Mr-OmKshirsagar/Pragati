# PRAGATI — DEVOPS & DEPLOYMENT

## 1. Deployment Objective

Deploy a reliable hackathon demonstration environment.

---

## 2. Components

```text
Frontend
Backend
PostgreSQL
Redis
Object Storage
AI Provider
```

---

## 3. Environment Separation

Maintain:

```text
development
staging/demo
production
```

For hackathon purposes, development + demo may be sufficient.

---

## 4. Environment Variables

Examples:

```text
DATABASE_URL
REDIS_URL
JWT_SECRET
AI_API_KEY
STORAGE_BUCKET
CORS_ORIGINS
```

Never commit real values.

---

## 5. CI/CD

Pipeline should ideally:

```text
Push
 ↓
Lint
 ↓
Type Check
 ↓
Unit Tests
 ↓
Integration Tests
 ↓
Build
 ↓
Deploy
```

---

## 6. Database Migration

Use migration tooling.

Never rely on manually modifying production tables.

---

## 7. Backups

For a production deployment:

* scheduled database backups
* backup retention
* recovery procedure

Hackathon demo should at minimum have a reproducible seed process.

---

## 8. Monitoring

Track:

* application errors
* API latency
* database availability
* Redis availability
* AI errors
* HTTP 5xx
* rate-limit events

---

## 9. Health Checks

```text
GET /health
GET /health/ready
```

Readiness should verify required dependencies.

---

## 10. HTTPS

Production/demo deployment should use HTTPS.

---

## 11. Rollback

Deployment process should allow rollback to the previous working version.

---

## 12. Demo Reliability

Before presentation:

* test production URLs
* verify environment variables
* verify database
* verify seed data
* verify AI key
* verify file upload
* verify recruitment workflow

Have a fallback demo dataset.