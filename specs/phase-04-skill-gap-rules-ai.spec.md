# Phase 04 Specification: Deterministic Skill-Gap Engine & Assistive AI

## 1. Metadata
- **Phase**: 04
- **Title**: Deterministic Skill-Gap Rule Engine & Assistive AI Explanation Layer
- **Status**: Ready for Implementation
- **Dependencies**: Phase 01, Phase 03
- **Target Files**:
  - `backend/src/rules/skillGapEngine.ts`
  - `backend/src/services/aiService.ts`
  - `backend/src/routers/skillGap.ts`
  - `frontend/client/src/components/SkillGapAlert.tsx`

---

## 2. Objective & Scope
Implement the **deterministic skill-gap rule engine** that automatically identifies performance drops and active backlogs. Augment this with an **assistive AI explanation service** using the Google Gemini SDK (or OpenRouter) to draft natural-language briefings and mentoring suggestions without ever making autonomous institutional decisions.

---

## 3. Algorithmic Specifications

### 3.1 Deterministic Skill-Gap Rule (`RULE_GAP_01`)
The rule engine evaluates every student upon assessment submission or batch academic update:

$$\text{SkillGapCondition} = \left( S_t < S_{t-1} \land S_{t-1} < S_{t-2} \right) \land \left( \text{ActiveBacklogs} > 0 \right)$$

Where:
- $S_t, S_{t-1}, S_{t-2}$ are the three most recent assessment scores for Skill $S$.
- $\text{ActiveBacklogs}$ is the count of currently unresolved backlog records for that student.

**When the condition evaluates to `TRUE`**:
1. Check if an `OPEN` skill gap already exists for `(student_id, skill_id)`. If yes, do not create a duplicate.
2. Insert a new record into `skill_gaps`:
   ```sql
   INSERT INTO skill_gaps (student_id, skill_id, rule_id, severity, status, reason, created_at)
   VALUES (
     $1, $2, 'RULE_GAP_01', 'HIGH', 'OPEN',
     jsonb_build_object(
       'score_history', jsonb_build_array($s_t2, $s_t1, $s_t),
       'active_backlogs', $backlog_count,
       'trigger_text', 'Two consecutive score drops accompanied by an active backlog.'
     ),
     NOW()
   );
   ```
3. Trigger a Supabase notification to the student and their assigned faculty mentor.

---

## 4. Assistive AI Service (`backend/src/services/aiService.ts`)

### 4.1 Strict Ethical Guardrails
- **AI Never Decides**: AI does not approve interventions, evaluate placement eligibility, or grade students.
- **AI Explains**: AI takes the deterministic rule trigger and drafts human-readable explanations.
- **Deterministic Fallback**: If `GEMINI_API_KEY` is missing or the provider returns an error/rate-limit, the system returns a pre-computed deterministic template string.

### 4.2 Prompt Versioning (`SKILL_GAP_EXPLAIN_V1`)
```typescript
import { GoogleGenAI } from "@google/genai";

const aiClient = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

export async function explainSkillGap(params: {
  studentName: string;
  skillName: string;
  scoreHistory: number[];
  backlogSubject?: string;
}): Promise<{ explanation: string; recommendedAction: string; source: "ai" | "rule_fallback" }> {
  const { studentName, skillName, scoreHistory, backlogSubject } = params;

  if (!aiClient) {
    return {
      explanation: `${skillName} assessment scores declined across consecutive cycles (${scoreHistory.join(" → ")})${backlogSubject ? ` while an active backlog in ${backlogSubject} remains unresolved` : ""}.`,
      recommendedAction: `Schedule a 1-on-1 faculty mentoring session to review core concepts in ${skillName}.`,
      source: "rule_fallback",
    };
  }

  const prompt = `
[SYSTEM: You are an academic advisor in the PRAGATI platform. Your goal is to explain an algorithmically detected skill gap to faculty mentors in clear, factual terms.]
[VERSION: SKILL_GAP_EXPLAIN_V1]

Student: ${studentName}
Skill: ${skillName}
Historical Assessment Trajectory: ${scoreHistory.join(" -> ")}
Related Active Backlog: ${backlogSubject || "None"}

Provide a concise 2-sentence explanation of this performance decline and a 1-sentence recommended intervention for the mentor. Output strictly as JSON:
{
  "explanation": "string",
  "recommendedAction": "string"
}
`;

  try {
    const response = await aiClient.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
      contents: prompt,
    });
    const text = response.text || "";
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    return {
      explanation: parsed.explanation,
      recommendedAction: parsed.recommendedAction,
      source: "ai",
    };
  } catch (error) {
    console.warn("[AI Service] Gemini API call failed, falling back to deterministic template:", error);
    return {
      explanation: `${skillName} assessment scores declined across consecutive cycles (${scoreHistory.join(" → ")}).`,
      recommendedAction: `Schedule a 1-on-1 faculty mentoring session to review core concepts in ${skillName}.`,
      source: "rule_fallback",
    };
  }
}
```

---

## 5. tRPC Router Integration (`backend/src/routers/skillGap.ts`)
```typescript
import { router, studentProcedure, facultyProcedure } from "../_core/trpc";
import { z } from "zod";
import * as skillGapEngine from "../rules/skillGapEngine";
import * as aiService from "../services/aiService";

export const skillGapRouter = router({
  getMyGaps: studentProcedure.query(async ({ ctx }) => {
    return skillGapEngine.getStudentSkillGaps(ctx.user.studentProfile.id);
  }),

  explainGap: studentProcedure
    .input(z.object({ skillGapId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const gap = await skillGapEngine.getGapById(input.skillGapId);
      return aiService.explainSkillGap({
        studentName: ctx.user.name,
        skillName: gap.skillName,
        scoreHistory: gap.reason.score_history,
        backlogSubject: gap.reason.backlog_subject,
      });
    }),
});
```

---

## 6. UI Component (`SkillGapAlert.tsx`)
Render an alert box on `/dashboard`:
- Displays: **Skill Gap Detected: Operating Systems**
- Reason: Score declined from 78 $\rightarrow$ 70 $\rightarrow$ 61.
- AI Explanation: *"DSA performance has declined across two consecutive assessment cycles while the student has an active OS backlog."*
- Explicit Badge: `[RULE GENERATED FINDING]` + `[AI ASSISTIVE EXPLANATION]`.

---

## 7. Verification & Acceptance Tests
1. Deterministic Rule Test:
   - Feed scores `[78, 70, 61]` and `backlogs = 1` $\rightarrow$ Engine returns `create_gap = true`.
   - Feed scores `[70, 75, 80]` $\rightarrow$ Engine returns `create_gap = false`.
2. AI Fallback Test:
   - Call `explainSkillGap` with invalid API key $\rightarrow$ Returns deterministic template string with `source: 'rule_fallback'`. Zero crashes.
3. Hero Demo Data Verification:
   - Ensure Rahul Sharma's OS / DSA drop triggers the exact alert defined in Scene 2 of the hackathon script.

---

## 8. Definition of Done
- [ ] Deterministic rule engine implemented with pure TypeScript functions.
- [ ] Gemini API service integrated with strict error boundary and deterministic fallback.
- [ ] `SkillGapAlert.tsx` renders in student dashboard with transparent attribution badges.
- [ ] Unit tests pass for rule evaluation.
