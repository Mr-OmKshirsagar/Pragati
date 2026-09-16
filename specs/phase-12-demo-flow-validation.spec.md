# Phase 12 Specification: Hackathon Hero Demo Flow Validation

## 1. Metadata
- **Phase**: 12
- **Title**: 12-Scene Hackathon Hero Demo Walkthrough & Verification Script
- **Status**: Ready for Execution
- **Dependencies**: Phase 00 through Phase 11
- **Target Persona**: Rahul Sharma (Year 3 CS Student, NIT-001)
- **Target Duration**: 5–7 Minutes

---

## 2. Objective & Scope
Provide the definitive, step-by-step verification script for evaluating the end-to-end PRAGATI lifecycle. This flow follows **Rahul Sharma** through 12 contiguous scenes—from academic skill-gap detection, assistive AI explanation, and closed-loop faculty mentoring to SHA-256 evidence integrity, deterministic placement eligibility, and Career Passport generation.

---

## 3. Pre-Demo Seed Verification Checklist
Before starting the demonstration, ensure the database is seeded:
```bash
cd backend
npx tsx scripts/seed.ts
```
**Verify Seed State**:
- [x] Hero Student: Rahul Sharma (`student@northstar.edu`, password: `Password123!`)
  - Initial CGPA: 8.42, OS Backlogs: 1
  - Historical DSA scores: 78 $\rightarrow$ 70 $\rightarrow$ 61
  - Internship: TechCorp (Status: `IN_PROGRESS`)
- [x] Faculty Mentor: Dr. Anand Verma (`faculty@northstar.edu`, password: `Password123!`)
- [x] T&P Coordinator: Prof. Sunita Rao (`tnp@northstar.edu`, password: `Password123!`)
- [x] Recruitment Drive: ABC Technologies (Software Engineer, CTC: 12 LPA)

---

## 4. The 12-Scene Hackathon Script

```text
+-----------------------------------------------------------------------------------+
| TIME     | SCENE #   | ACTOR           | KEY ACTION & DEMO MESSAGE                        |
+-----------------------------------------------------------------------------------+
| 00:00    | Scene 01  | Rahul (Student) | Login to /dashboard; show 4-indicator readiness  |
| 00:30    | Scene 02  | System          | Inspect deterministic skill-gap flag (OS drop)   |
| 01:00    | Scene 03  | Assistive AI    | View natural-language AI explanation of root gap |
| 01:30    | Scene 04  | Faculty Mentor  | Switch to Dr. Verma; create mentoring session    |
| 02:15    | Scene 05  | Rahul (Student) | Take DSA re-assessment (61->78); gap RESOLVED    |
| 03:00    | Scene 06  | Rahul (Student) | Submit TechCorp internship evidence documents    |
| 03:45    | Scene 07  | Evaluator Demo  | Live SHA-256 tamper test: Byte change = Alert    |
| 04:30    | Scene 08  | Faculty Mentor  | Review & sign-off: INSTITUTION_VERIFIED          |
| 05:00    | Scene 09  | T&P Officer     | Inspect ABC Tech drive rules (AST Boolean tree)  |
| 05:30    | Scene 10  | Engine          | Run deterministic eligibility: Rahul ELIGIBLE    |
| 06:15    | Scene 11  | Rahul (Student) | View itemized criteria reasons & 1-click apply   |
| 06:45    | Scene 12  | Rahul (Student) | Export verified tamper-evident Career Passport   |
+-----------------------------------------------------------------------------------+
```

---

### Scene Details & Judge Talking Points

#### Scene 01 — Student Dashboard Overview (00:00 – 00:30)
- **Action**: Login as `student@northstar.edu`.
- **Screen**: `/dashboard`.
- **Observe**: Student Readiness Scorecard (76%), CGPA 8.42, 7 verified skills, active internship status.
- **Judge Talking Point**: *"Notice the readiness score is not an unexplainable AI guess—it explicitly shows its formula: 30% academics + 30% skills + 20% internship + 20% verified evidence."*

#### Scene 02 — Deterministic Skill-Gap Trigger (00:30 – 01:00)
- **Action**: Scroll to the Active Alert banner on `/dashboard`.
- **Screen**: `SkillGapAlert` banner.
- **Observe**: `[SKILL GAP DETECTED: Operating Systems]`. Trajectory: 78 $\rightarrow$ 70 $\rightarrow$ 61 with 1 active OS backlog.
- **Judge Talking Point**: *"The system doesn't wait for final-year placement season. The deterministic rule engine caught the decline early."*

#### Scene 03 — Assistive AI Explanation (01:00 – 01:30)
- **Action**: Click *"View AI Analysis"*.
- **Observe**: Gemini-generated brief explaining that the student is struggling with OS memory management concepts while carrying a semester backlog.
- **Judge Talking Point**: *"Notice the explicit badge: 'AI Assistive Explanation'. AI explains the condition, but the deterministic rule made the detection. Humans remain in control."*

#### Scene 04 — Faculty Closed-Loop Intervention (01:30 – 02:15)
- **Action**: Switch browser tab / login as `faculty@northstar.edu` on `/faculty/wards`.
- **Observe**: Rahul Sharma listed with `[Needs Attention]` tag.
- **Action**: Click *"Intervene"*, select *"DSA & OS Remedial Mentoring"*, set date, and click *"Create Intervention"*.
- **Judge Talking Point**: *"Faculty interventions are no longer informal chats. They are trackable institutional commitments."*

#### Scene 05 — Progress Measurement & Gap Resolution (02:15 – 03:00)
- **Action**: Return to student view, navigate to `/skills`, open *"Operating Systems Re-Assessment"*.
- **Action**: Complete the 3-question evaluation.
- **Observe**: Score improves from 61 $\rightarrow$ 78.
- **Observe**: Skill Gap automatically flips from `OPEN` $\rightarrow$ `RESOLVED`.
- **Judge Talking Point**: *"This is closed-loop mentoring: Flagged $\rightarrow$ Assigned $\rightarrow$ Mentored $\rightarrow$ Re-assessed $\rightarrow$ Resolved."*

#### Scene 06 — Internship Lifecycle & Milestones (03:00 – 03:45)
- **Action**: Navigate to `/internship`.
- **Observe**: 8-week TechCorp Software Engineering Internship.
- **Action**: Submit Completion Certificate PDF. Evidence completeness updates to 100%.

#### Scene 07 — The SHA-256 Cryptographic Tamper Demo (03:45 – 04:30)
- **Action**: Open the *"Verify Integrity"* modal on the uploaded certificate.
- **Observe**: Client-computed SHA-256 hash displayed: `3b9c7a...`.
- **Action**: Click *"Simulate Altered Document"* (mutates 1 byte in the PDF).
- **Observe**: Recomputed hash changes completely: `e81a4b...`. Red warning: `[⚠ TAMPER DETECTED: File content changed since upload]`.
- **Judge Talking Point**: *"We are completely honest: SHA-256 proves file integrity—that bytes haven't changed. Authenticity still requires human faculty sign-off."*

#### Scene 08 — Faculty Institutional Verification (04:30 – 05:00)
- **Action**: Faculty opens `/faculty/review`, reviews Rahul's TechCorp documents, checks hash match, and clicks `[Approve & Verify]`.
- **Observe**: Verification status transitions to `INSTITUTION_VERIFIED`. Internship status becomes `COMPLETED`.

#### Scene 09 — T&P Placement Rule Builder (05:00 – 05:30)
- **Action**: Login as `tnp@northstar.edu`, navigate to `/tnp/drives`.
- **Observe**: ABC Technologies drive.
- **Rule AST**: CGPA $\ge$ 7.5, Backlogs $=$ 0, DSA $\ge$ 70, Python $\ge$ 65, Internship $=$ COMPLETED.

#### Scene 10 — Deterministic Eligibility Run (05:30 – 06:15)
- **Action**: Click *"Run Roster Evaluation"*.
- **Observe**: Candidate roster evaluated.
  - Rahul Sharma: `ELIGIBLE` (Meets all 5 criteria).
  - Peer Student Priya: `NOT ELIGIBLE` (DSA 62 $<$ required 70).
- **Judge Talking Point**: *"No opaque algorithms. Every student gets clear, transparent mathematical reasons."*

#### Scene 11 — 1-Click Transparent Application (06:15 – 06:45)
- **Action**: Return to Rahul's dashboard on `/opportunities`.
- **Action**: Click *"Check My Eligibility"* on ABC Technologies $\rightarrow$ View green checkmarks on all 5 criteria.
- **Action**: Click *"Apply Now"*.
- **Observe**: Application recorded instantly. Status: `[✓ APPLIED]`.

#### Scene 12 — Portable Career Passport (06:45 – 07:15)
- **Action**: Navigate to `/career-passport`.
- **Observe**: The finalized, comprehensive institutional dossier:
  - Official NIT Seal.
  - Certified academic trajectory (CGPA 8.42, 0 active backlogs).
  - Verified skill radar (DSA 78, Python 84).
  - Institution-verified TechCorp internship with SHA-256 proof.
  - ABC Technologies drive application.
- **Judge Closing Line**: *"PRAGATI connects the entire student journey from early skill gaps to transparent recruitment readiness."*

---

## 5. Verification Commands & Sign-off
```bash
# Run full automated regression test suite prior to demo
cd backend && npm run test
```

## 6. Definition of Done
- [ ] All 12 scenes execute smoothly without runtime exceptions.
- [ ] Role switching functions reliably.
- [ ] Zero mock data used: all metrics, gaps, and applications query real Supabase PostgreSQL tables.
- [ ] Demo finishes within the 5–7 minute time window.
