/**
 * ELO Rating System for DoubleVision
 *
 * Reviewers earn or lose ELO points based on:
 * - Review approval/rejection by AI moderation
 * - AI confidence scores
 * - Review quality (word count, relevance)
 */

// K-factor determines rating volatility (higher = more change per review)
const K_FACTOR = 32;

// Rating bounds
const MIN_RATING = 0;
const MAX_RATING = 3000;

// Expected score based on rating difference
function getExpectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Calculate ELO rating change based on review outcome
 *
 * @param currentRating Reviewer's current ELO rating
 * @param reviewApproved Whether the review was approved by AI
 * @param aiConfidence AI confidence score (0-100)
 * @param wordCount Number of words in review
 * @returns New ELO rating
 */
export function calculateNewElo(
  currentRating: number,
  reviewApproved: boolean,
  aiConfidence: number,
  wordCount: number
): number {
  // Base opponent rating (average reviewer)
  const opponentRating = 1000;

  // Expected score (probability of success)
  const expectedScore = getExpectedScore(currentRating, opponentRating);

  // Actual score based on review outcome
  let actualScore = reviewApproved ? 1.0 : 0.0;

  // Adjust actual score based on AI confidence
  // High confidence in approval/rejection = stronger signal
  const confidenceMultiplier = aiConfidence / 100;

  if (reviewApproved) {
    // Approved review: confidence boosts the win
    actualScore = 0.5 + (0.5 * confidenceMultiplier);
  } else {
    // Rejected review: confidence strengthens the loss
    actualScore = 0.5 - (0.5 * confidenceMultiplier);
  }

  // Quality bonus for excellent reviews (100+ words)
  let qualityMultiplier = 1.0;
  if (reviewApproved && wordCount >= 100) {
    qualityMultiplier = 1.2; // 20% bonus for detailed reviews
  } else if (reviewApproved && wordCount >= 75) {
    qualityMultiplier = 1.1; // 10% bonus for good reviews
  }

  // Calculate rating change
  const ratingChange = K_FACTOR * (actualScore - expectedScore) * qualityMultiplier;

  // Apply change and enforce bounds
  const newRating = Math.max(
    MIN_RATING,
    Math.min(MAX_RATING, currentRating + ratingChange)
  );

  return Math.round(newRating);
}

/**
 * Get rating tier/badge based on ELO
 */
export function getRatingTier(rating: number): {
  name: string;
  color: string;
  icon: string;
} {
  if (rating >= 1800) {
    return { name: "Master", color: "text-purple-400", icon: "👑" };
  } else if (rating >= 1500) {
    return { name: "Expert", color: "text-blue-400", icon: "💎" };
  } else if (rating >= 1200) {
    return { name: "Advanced", color: "text-green-400", icon: "⭐" };
  } else if (rating >= 900) {
    return { name: "Intermediate", color: "text-yellow-400", icon: "📸" };
  } else {
    return { name: "Beginner", color: "text-gray-400", icon: "🌱" };
  }
}

/**
 * Calculate rating change preview (for display purposes)
 */
export function previewRatingChange(
  currentRating: number,
  approved: boolean,
  confidence: number
): { change: number; direction: "up" | "down" | "neutral" } {
  const newRating = calculateNewElo(currentRating, approved, confidence, 50);
  const change = newRating - currentRating;

  return {
    change: Math.abs(change),
    direction: change > 0 ? "up" : change < 0 ? "down" : "neutral",
  };
}
