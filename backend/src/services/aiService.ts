import "dotenv/config";

export interface ExplainSkillGapInput {
  studentName: string;
  skillName: string;
  scoreHistory: number[];
  backlogSubject?: string;
}

export interface ExplainSkillGapOutput {
  explanation: string;
  recommendedAction: string;
  source: "ai" | "rule_fallback";
}

/**
 * Assistive AI Service for drafting contextual skill gap explanations.
 * Strict ethical guardrail: AI explains, AI NEVER decides.
 * Zero-crash guarantee: falls back to deterministic template if API fails or key is missing.
 */
export async function explainSkillGap(
  params: ExplainSkillGapInput
): Promise<ExplainSkillGapOutput> {
  const { studentName, skillName, scoreHistory, backlogSubject } = params;
  const apiKey = process.env.GEMINI_API_KEY;

  const deterministicFallback: ExplainSkillGapOutput = {
    explanation: `${skillName} assessment scores declined across consecutive cycles (${scoreHistory.join(" → ")})${
      backlogSubject
        ? ` while an active backlog in ${backlogSubject} remains unresolved`
        : ""
    }.`,
    recommendedAction: `Schedule a 1-on-1 faculty mentoring session to review core concepts in ${skillName}.`,
    source: "rule_fallback",
  };

  if (!apiKey || apiKey === "mock_gemini_key_for_dev_mode") {
    return deterministicFallback;
  }

  const prompt = `
[SYSTEM: You are an academic advisor in the PRAGATI platform. Your goal is to explain an algorithmically detected skill gap to faculty mentors and students in clear, factual, objective terms. You never make final institutional decisions.]
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
    const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s fast timeout

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(
        `[AI Service] Gemini API returned status ${response.status}, falling back to deterministic template.`
      );
      return deterministicFallback;
    }

    const data = (await response.json()) as any;
    const rawText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!rawText) {
      return deterministicFallback;
    }

    const cleanedText = rawText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleanedText);

    if (parsed.explanation && parsed.recommendedAction) {
      return {
        explanation: parsed.explanation,
        recommendedAction: parsed.recommendedAction,
        source: "ai",
      };
    }

    return deterministicFallback;
  } catch (error) {
    console.warn(
      "[AI Service] Gemini API call failed or timed out, falling back to deterministic template:",
      error
    );
    return deterministicFallback;
  }
}
