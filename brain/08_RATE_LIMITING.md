# PRAGATI — RATE LIMITING

## 1. Objective

Protect the API from:

* brute force
* abuse
* accidental overload
* expensive AI calls
* upload abuse

---

## 2. Redis

Use Redis-backed rate limiting where practical.

---

## 3. Suggested Limits

### Authentication

```text
5 attempts / minute / IP
```

### AI

```text
10 requests / minute / user
```

### File Upload

```text
10 uploads / hour / user
```

### General API

```text
100 requests / minute / user
```

These are starting values, not universal constants.

Tune after testing.

---

## 4. Expensive Operations

More aggressively protect:

* AI generation
* large reports
* file processing
* exports
* public endpoints

---

## 5. Response

When exceeded:

```text
HTTP 429 Too Many Requests
```

Include retry information where appropriate.

---

## 6. Rate Limit Identity

Depending on endpoint:

* IP
* authenticated user
* institution
* endpoint

For authenticated expensive operations, user-level limiting should generally be preferred over IP-only limiting.

---

## 7. Failure Behavior

If Redis is unavailable, define a safe fallback.

Security-critical endpoints should not silently become unlimited.

---

## 8. Testing

Test:

* below limit
* at limit
* above limit
* reset behavior
* concurrent requests
* different users
* different IPs