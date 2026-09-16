# PRAGATI — CACHING STRATEGY

## 1. Technology

Use Redis for caching.

Caching is an optimization.

PostgreSQL remains the source of truth.

---

## 2. Cache Candidates

Good candidates:

* department dashboard aggregates
* HOD statistics
* skill taxonomy
* assessment metadata
* recruitment templates
* frequently accessed reports

---

## 3. Avoid Caching

Do not casually cache:

* authorization decisions
* sensitive private documents
* rapidly changing transactional state
* security-critical state

---

## 4. Cache Key Design

Keys must include sufficient scope.

Example:

```text
dashboard:department:{institution_id}:{department_id}
```

Student-specific:

```text
student:{institution_id}:{student_id}:summary
```

---

## 5. TTL

Example:

```text
Skill taxonomy: 1 hour
Department dashboard: 2–5 minutes
Assessment metadata: 30 minutes
Reports: 5 minutes
```

TTL should be configurable.

---

## 6. Invalidation

When source data changes, invalidate relevant cache.

Example:

Assessment submitted:

```text
assessment updated
 ↓
invalidate student skill summary
 ↓
invalidate department statistics
 ↓
invalidate relevant HOD dashboard
```

---

## 7. Cache Safety

Never allow:

Student A
→ cached result
→ Student B

Ensure user/institution scope is part of keys where required.

---

## 8. Cache Failure

If Redis fails:

The application must continue using PostgreSQL.

Caching failure must degrade performance, not correctness.

---

## 9. Cache Stampede

For expensive aggregate queries, consider:

* short TTL
* request coalescing where necessary
* stale-while-revalidate if justified

Do not implement complex distributed caching without need.

---

## 10. Monitoring

Track:

* cache hit rate
* cache miss rate
* Redis errors
* eviction rate

Only optimize based on evidence.