# PRAGATI — SECURITY STANDARD

## 1. Security Objective

PRAGATI handles student academic, personal, internship and career information.

Security must be treated as a core product requirement.

---

## 2. Authentication

Use:

* secure password hashing
* JWT or equivalent secure session mechanism
* token expiration
* refresh-token rotation where implemented
* secure logout/revocation strategy

Never store plaintext passwords.

---

## 3. Authorization

Use server-side RBAC.

Never rely on frontend visibility.

Every sensitive endpoint must verify:

Authentication
→ Role
→ Resource permission

---

## 4. IDOR Prevention

Never trust IDs supplied by users.

Example:

```text
GET /students/123
```

must verify that the current user has permission to access student 123.

---

## 5. Input Security

Validate:

* strings
* numbers
* dates
* enums
* IDs
* files
* query parameters

Use ORM parameterization.

---

## 6. File Security

For every upload:

* size limit
* MIME validation
* extension allowlist
* generated storage filename
* path traversal protection
* SHA-256
* protected storage

Malware scanning should be added if available.

Do not claim that file hashing is malware protection.

---

## 7. Secrets

Never commit:

```text
.env
API keys
JWT secrets
database passwords
OAuth secrets
cloud credentials
```

Use environment variables.

Provide `.env.example`.

---

## 8. Data Minimization

Only expose information required for a specific role/workflow.

Company-facing views should not expose unnecessary student information.

---

## 9. Audit Logs

Log security-sensitive events.

Examples:

* login
* failed login
* role change
* verification
* internship approval
* recruitment rule changes
* application changes

Never log passwords or secrets.

---

## 10. Encryption

Use HTTPS/TLS in deployment.

Sensitive stored data should use appropriate encryption mechanisms.

Documents should not be publicly accessible by default.

---

## 11. Security Headers

Deployment should use appropriate headers including:

* Content-Security-Policy where feasible
* X-Content-Type-Options
* Referrer-Policy
* frame protection
* secure cookie configuration where cookies are used

---

## 12. CORS

Allow only explicitly configured trusted origins.

Never use unrestricted production CORS.

---

## 13. Error Security

Do not expose:

* stack traces
* database errors
* filesystem paths
* internal service details

---

## 14. Threats To Consider

* IDOR
* privilege escalation
* brute force
* credential theft
* malicious file uploads
* XSS
* CSRF where applicable
* injection attacks
* mass assignment
* excessive data exposure
* insecure direct object references
* broken access control
* API abuse

---

## 15. Security Principle

Assume every client-side value can be manipulated.

The backend must enforce truth.