"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./Button";
import { ScoreDisplay } from "./ScoreDisplay";

interface Review {
  _id: string;
  score: number;
  comment: string;
  wordCount: number;
  createdAt: Date;
}

interface ReviewRatingProps {
  photoId: string;
  reviews: Review[];
}

interface ReviewRatings {
  specificityScore: number;
  constructivenessScore: number;
  relevanceScore: number;
}

interface ReviewerData {
  reviewerId: string;
  name: string;
  image?: string;
  eloRating: number;
  eloChange: number;
  specificityScore: number;
  constructivenessScore: number;
  relevanceScore: number;
  overallQuality: number;
  reviewScore: number;
  comment: string;
  wordCount: number;
}

const RATING_CATEGORIES = [
  {
    key: "specificityScore" as const,
    label: "Specificity",
    description: "How detailed and specific is the feedback?",
  },
  {
    key: "constructivenessScore" as const,
    label: "Constructiveness",
    description: "How actionable and helpful is the advice?",
  },
  {
    key: "relevanceScore" as const,
    label: "Relevance",
    description: "How relevant is the feedback to the photo?",
  },
];

export default function ReviewRating({ photoId, reviews }: ReviewRatingProps) {
  const router = useRouter();
  const [ratings, setRatings] = useState<Record<string, ReviewRatings>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [reviewerData, setReviewerData] = useState<ReviewerData[]>([]);

  const handleSliderChange = (
    reviewId: string,
    category: keyof ReviewRatings,
    value: number
  ) => {
    setRatings((prev) => ({
      ...prev,
      [reviewId]: {
        ...prev[reviewId],
        [category]: value,
      },
    }));
  };

  const isReviewFullyRated = (reviewId: string) => {
    const reviewRating = ratings[reviewId];
    if (!reviewRating) return false;

    return (
      reviewRating.specificityScore > 0 &&
      reviewRating.constructivenessScore > 0 &&
      reviewRating.relevanceScore > 0
    );
  };

  const allReviewsRated = reviews.every((review) => isReviewFullyRated(review._id));
  const ratedCount = reviews.filter((review) => isReviewFullyRated(review._id)).length;

  const handleSubmit = async () => {
    if (!allReviewsRated) {
      setError("Please rate all aspects of all reviews before submitting");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Convert 0-100 scale to 1-5 scale for backend
      const ratingArray = Object.entries(ratings).map(([reviewId, scores]) => ({
        reviewId,
        specificityScore: Math.max(1, Math.round((scores.specificityScore / 100) * 4) + 1),
        constructivenessScore: Math.max(1, Math.round((scores.constructivenessScore / 100) * 4) + 1),
        relevanceScore: Math.max(1, Math.round((scores.relevanceScore / 100) * 4) + 1),
      }));

      const response = await fetch("/api/rate-reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          photoId,
          ratings: ratingArray,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit ratings");
      }

      const data = await response.json();
      setReviewerData(data.reviewers);
      setShowResults(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit ratings");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showResults && reviewerData.length > 0) {
    return (
      <div className="space-y-4">
        <div className="card bg-present/10 border-present">
          <h2 className="text-xl font-bold text-present mb-2">✅ Ratings Submitted!</h2>
          <p className="text-text-secondary">
            Thank you for rating the reviews. Here are the reviewers who provided feedback:
          </p>
        </div>

        {reviewerData.map((reviewer) => (
          <div key={reviewer.reviewerId} className="card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {reviewer.image && (
                  <img
                    src={reviewer.image}
                    alt={reviewer.name}
                    className="w-12 h-12 rounded-full border-2 border-border"
                  />
                )}
                <div>
                  <h3 className="font-bold text-lg">{reviewer.name}</h3>
                  <div className="text-sm text-text-secondary">
                    ELO Rating: {reviewer.eloRating}
                  </div>
                </div>
              </div>
              <ScoreDisplay score={reviewer.reviewScore} size="sm" showLabel={false} />
            </div>

            <p className="text-text-primary leading-relaxed whitespace-pre-wrap mb-4">
              {reviewer.comment}
            </p>

            <div className="grid grid-cols-3 gap-4 p-4 bg-bg-secondary rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-present">
                  {reviewer.specificityScore}/5
                </div>
                <div className="text-xs text-text-secondary mt-1">Specificity</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-present">
                  {reviewer.constructivenessScore}/5
                </div>
                <div className="text-xs text-text-secondary mt-1">Constructiveness</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-present">
                  {reviewer.relevanceScore}/5
                </div>
                <div className="text-xs text-text-secondary mt-1">Relevance</div>
              </div>
            </div>

            <div className="mt-3 text-sm text-text-secondary flex items-center justify-between">
              <span>{reviewer.wordCount} words</span>
              <span className="font-medium">
                Overall Quality: {reviewer.overallQuality.toFixed(1)}/5
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card bg-yellow-500/10 border-yellow-500">
        <h2 className="text-xl font-bold mb-3">⭐ Rate the Review Quality</h2>
        <p className="text-text-secondary mb-3">
          Help improve feedback quality by rating each review on three dimensions (0-100 scale). Your ratings will affect reviewers&apos; ELO scores.
        </p>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Specificity:</span> How detailed and specific is the feedback?
          </div>
          <div>
            <span className="font-medium">Constructiveness:</span> How actionable and helpful is the advice?
          </div>
          <div>
            <span className="font-medium">Relevance:</span> How relevant is the feedback to your photo?
          </div>
        </div>
      </div>

      {reviews.map((review) => {
        const reviewRatings = ratings[review._id] || {
          specificityScore: 0,
          constructivenessScore: 0,
          relevanceScore: 0,
        };
        const isFullyRated = isReviewFullyRated(review._id);

        return (
          <div
            key={review._id}
            className={`card ${isFullyRated ? "border-present border-2" : ""}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-border flex items-center justify-center font-bold text-text-secondary">
                  ?
                </div>
                <div>
                  <span className="text-sm text-text-secondary">Anonymous Reviewer</span>
                  {isFullyRated && (
                    <span className="ml-2 text-xs text-present font-medium">✓ Rated</span>
                  )}
                </div>
              </div>
              <ScoreDisplay score={review.score} size="sm" showLabel={false} />
            </div>

            <p className="text-text-primary leading-relaxed whitespace-pre-wrap mb-4">
              {review.comment}
            </p>

            <div className="space-y-4 pt-4 border-t border-border">
              {RATING_CATEGORIES.map((category) => {
                const currentValue = reviewRatings[category.key] || 0;

                return (
                  <div key={category.key}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{category.label}</div>
                        <div className="text-xs text-text-secondary">
                          {category.description}
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-present ml-4 min-w-[60px] text-right">
                        {currentValue}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-secondary">0</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={currentValue}
                        onChange={(e) =>
                          handleSliderChange(review._id, category.key, parseInt(e.target.value))
                        }
                        className="flex-1 h-2 bg-surface rounded-lg appearance-none cursor-pointer
                          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-present
                          [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:bg-correct
                          [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4
                          [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-present
                          [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:hover:bg-correct
                          [&::-moz-range-thumb]:border-0"
                        style={{
                          background: `linear-gradient(to right, rgb(var(--color-present)) 0%, rgb(var(--color-present)) ${currentValue}%, rgb(var(--color-surface)) ${currentValue}%, rgb(var(--color-surface)) 100%)`
                        }}
                      />
                      <span className="text-xs text-text-secondary">100</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 text-xs text-text-secondary">
              {review.wordCount} words
            </div>
          </div>
        );
      })}

      {error && (
        <div className="card bg-absent/10 border-absent">
          <p className="text-absent font-medium">{error}</p>
        </div>
      )}

      <div className="card">
        <Button
          onClick={handleSubmit}
          disabled={!allReviewsRated || isSubmitting}
          className="w-full"
        >
          {isSubmitting
            ? "Submitting..."
            : allReviewsRated
            ? "Submit All Ratings & Reveal Reviewers"
            : `Rate All Reviews (${ratedCount}/${reviews.length} completed)`}
        </Button>
        {!allReviewsRated && (
          <p className="text-sm text-text-secondary mt-2 text-center">
            Please rate all {reviews.length} reviews on all 3 dimensions to continue
          </p>
        )}
      </div>
    </div>
  );
}
