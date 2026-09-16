# Phase 10 Specification: Role Dashboards & Portable Career Passport

## 1. Metadata
- **Phase**: 10
- **Title**: Multi-Role Operational Dashboards & Verifiable Portable Career Passport
- **Status**: Ready for Implementation
- **Dependencies**: Phase 01, Phase 02, Phase 03, Phase 05, Phase 07, Phase 09
- **Target Files**:
  - `backend/src/services/dashboardService.ts`
  - `backend/src/routers/dashboard.ts`
  - `frontend/client/src/pages/Home.tsx`
  - `frontend/client/src/pages/CareerPassport.tsx`
  - `frontend/client/src/pages/HodAnalytics.tsx`

---

## 2. Objective & Scope
Consolidate data aggregation for all five institutional user roles (Student, Faculty, HOD, T&P, Admin). Implement the student **Career Readiness Scorecard** using a transparent weighted average. Build the **Portable Career Passport**—a tamper-evident, exportable student dossier featuring institution seals, cryptographic verification badges, and comprehensive milestone histories.

---

## 3. Career Readiness Scorecard Formula

The student readiness score on `/dashboard` is **100% deterministic and explainable**, never an opaque AI judgment:

$$\text{ReadinessScore} = (A \times 0.30) + (S \times 0.30) + (I \times 0.20) + (E \times 0.20)$$

Where:
- $A$ = **Academic Progress** (CGPA scaled out of 10 converted to percentage).
- $S$ = **Skill Coverage** (Percentage of department core skills with score $\ge 70$).
- $I$ = **Internship Progress** (Evidence completeness percentage: 0% to 100%).
- $E$ = **Verified Evidence** (Ratio of `INSTITUTION_VERIFIED` claims to total claims).

**Formula Explanation Rendered in UI**:
> *“A deterministic weighted average of four transparent progress indicators: (Academic 30%) + (Skill Coverage 30%) + (Internship 20%) + (Verified Evidence 20%). It is not an AI-generated employability score.”*

---

## 4. The Portable Career Passport (`CareerPassport.tsx`)

The Career Passport serves as an official institutional transcript that replaces unverified paper resumes:
1. **Institutional Seal**: Northstar Institute of Technology emblem, student photo/avatar, enrollment number, branch (CSE).
2. **Academic Ledger**: Certified SGPA/CGPA semester progression, credits earned, zero active backlogs verification mark.
3. **Skill Proficiency Radar / Trajectory**: Verified skill scores (DSA: 78, Python: 84, DBMS: 72, OOP: 81).
4. **Verified Internship Record**:
   - Company: TechCorp (8-week Software Engineering Internship).
   - Verification Badge: `[✓ INSTITUTION VERIFIED]` signed by Faculty Dr. Anand Verma.
   - Cryptographic Evidence Link: SHA-256 hash checksums of Completion Certificate.
5. **Placement & Drive Achievements**: Active applications, shortlists, offers.
6. **Export & Print**: Clean `@media print` CSS layout and PDF export trigger.

---

## 5. Department Analytics Hub (`HodAnalytics.tsx`)
Enables Department Heads (HODs) to monitor macro academic health:
- **Skill Heatmap**: Matrix of Semesters (S1 to S6) vs Skills (DSA, OS, DBMS) with color gradations representing average cohort score.
- **Intervention Velocity**: Bar chart of flagged skill gaps vs resolved mentoring sessions.
- **Placement Readiness Distribution**: Histogram of students qualifying for Tier-1 (10+ LPA) placement criteria.

---

## 6. tRPC Dashboard Router (`backend/src/routers/dashboard.ts`)

```typescript
import { router, studentProcedure, facultyProcedure, requireRole } from "../_core/trpc";
import * as dashboardService from "../services/dashboardService";

export const dashboardRouter = router({
  getStudentDashboard: studentProcedure.query(async ({ ctx }) => {
    return dashboardService.getAggregatedStudentDashboard(ctx.user.studentProfile.id);
  }),

  getHodAnalytics: requireRole(["HOD", "ADMIN"]).query(async ({ ctx }) => {
    return dashboardService.getDepartmentAnalytics(ctx.user.departmentId || "");
  }),

  getCareerPassport: studentProcedure.query(async ({ ctx }) => {
    return dashboardService.generateCareerPassport(ctx.user.studentProfile.id);
  }),
});
```

---

## 7. Verification & Acceptance Tests
1. Readiness Formula Test:
   - Rahul Sharma: Academic 84.2%, Skill Coverage 80%, Internship 100%, Evidence 90%.
   - Expected Readiness: $(84.2 \times 0.3) + (80 \times 0.3) + (100 \times 0.2) + (90 \times 0.2) = 25.26 + 24.0 + 20.0 + 18.0 = 87.26\%$.
2. Career Passport Integrity Test:
   - Ensure the passport visually distinguishes verified records from self-reported claims.
   - Ensure SHA-256 hashes are displayed for verified certificates.
3. HOD Scope Test:
   - Verify HOD can only query analytics for their own department.

---

## 8. Definition of Done
- [ ] Student dashboard aggregates all progress metrics from Supabase PostgreSQL.
- [ ] Readiness formula calculates deterministically and displays methodology explanation.
- [ ] Career Passport view formatted for web and print.
- [ ] HOD analytics charts render cohort trends.
