import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  console.warn(
    "⚠️ GEMINI_API_KEY not configured. AI moderation will be disabled."
  );
}

// Initialize Gemini API client
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// Use Gemini 2.5 Flash for fast, efficient moderation
const model = genAI?.getGenerativeModel({
  model: "gemini-2.5-flash",
});

export interface ModerationResult {
  isOffensive: boolean;
  isAiGenerated: boolean;
  isRelevant: boolean;
  confidence: number;
  reasoning: string;
}

/**
 * Moderate a photo review using Gemini AI
 * @param comment The review comment to moderate
 * @returns Moderation analysis with confidence scores
 */
export async function moderateReview(
  comment: string
): Promise<ModerationResult> {
  // If API key not configured, return safe defaults (auto-approve)
  if (!model) {
    console.warn("Gemini API not configured, skipping moderation");
    return {
      isOffensive: false,
      isAiGenerated: false,
      isRelevant: true,
      confidence: 0,
      reasoning: "Moderation disabled - API key not configured",
    };
  }

  try {
    const prompt = `You are a content moderation system for a photography feedback platform. Analyze the following review comment and determine:

1. Is it offensive, inappropriate, or contains hate speech/harassment?
2. Does it appear to be AI-generated (generic, template-like, lacks personal perspective)?
3. Is it relevant and constructive feedback about photography?

Review comment:
"${comment}"

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
  "isOffensive": boolean,
  "isAiGenerated": boolean,
  "isRelevant": boolean,
  "confidence": number (0-100),
  "reasoning": "brief explanation"
}

Guidelines:
- isOffensive: true if contains profanity, harassment, hate speech, or personal attacks
- isAiGenerated: true if overly generic, template-like, or clearly AI-written
- isRelevant: false if spam, off-topic, or not about photography
- confidence: 0-100, how confident you are in this assessment
- reasoning: 1-2 sentences explaining the decision`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text().trim();

    // Parse the JSON response
    let analysis: ModerationResult;
    try {
      // Remove any markdown code blocks if present
      const jsonText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      analysis = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", text);
      // Return conservative defaults on parse error
      return {
        isOffensive: false,
        isAiGenerated: false,
        isRelevant: true,
        confidence: 50,
        reasoning: "Failed to parse AI response, defaulting to approval",
      };
    }

    return analysis;
  } catch (error) {
    console.error("Gemini moderation error:", error);
    // On API error, default to safe approval
    return {
      isOffensive: false,
      isAiGenerated: false,
      isRelevant: true,
      confidence: 0,
      reasoning: "Moderation error - defaulting to approval for safety",
    };
  }
}

/**
 * Determine if a review should be approved based on moderation results
 * @param moderation The moderation analysis
 * @returns "approved" or "rejected"
 */
export function getModerationDecision(
  moderation: ModerationResult
): "approved" | "rejected" {
  // Reject if offensive with high confidence
  if (moderation.isOffensive && moderation.confidence >= 70) {
    return "rejected";
  }

  // Reject if not relevant with high confidence
  if (!moderation.isRelevant && moderation.confidence >= 80) {
    return "rejected";
  }

  // Flag AI-generated but don't auto-reject (user may have used AI for help)
  // Just store the flag for potential review

  // Default to approved
  return "approved";
}
