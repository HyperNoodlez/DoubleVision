import { GoogleGenerativeAI } from "@google/generative-ai";
import { MODERATOR_CONFIG, buildModerationPrompt } from "@/config/moderator";

if (!process.env.GEMINI_API_KEY) {
  console.warn(
    "⚠️ GEMINI_API_KEY not configured. AI moderation will be disabled."
  );
}

// Initialize Gemini API client
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// Use configured Gemini model for fast, efficient moderation
const model = genAI?.getGenerativeModel({
  model: MODERATOR_CONFIG.model,
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
    // Build moderation prompt using configuration
    const prompt = buildModerationPrompt(comment);

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
 * Uses confidence thresholds from MODERATOR_CONFIG
 * @param moderation The moderation analysis
 * @returns "approved" or "rejected"
 */
export function getModerationDecision(
  moderation: ModerationResult
): "approved" | "rejected" {
  const { offensiveConfidence, irrelevanceConfidence } = MODERATOR_CONFIG.thresholds;

  // Reject if offensive with high confidence
  if (moderation.isOffensive && moderation.confidence >= offensiveConfidence) {
    return "rejected";
  }

  // Reject if not relevant with high confidence
  if (!moderation.isRelevant && moderation.confidence >= irrelevanceConfidence) {
    return "rejected";
  }

  // Flag AI-generated but don't auto-reject (user may have used AI for help)
  // Just store the flag for potential review

  // Default to approved (bias toward allowing content)
  return "approved";
}
