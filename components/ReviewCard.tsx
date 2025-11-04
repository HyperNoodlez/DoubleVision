"use client";

import { useState } from "react";

interface ReviewCardProps {
  photoUrl: string;
  photoId: string;
  onSubmitReview: (photoId: string, score: number, comment: string) => Promise<void>;
}

const MIN_WORD_COUNT = 50;

export default function ReviewCard({
  photoUrl,
  photoId,
  onSubmitReview,
}: ReviewCardProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wordCount = comment.trim().split(/\s+/).filter(Boolean).length;
  const isValidWordCount = wordCount >= MIN_WORD_COUNT;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate rating
    if (rating === 0) {
      setError("Please select a star rating.");
      return;
    }

    // Validate comment
    if (!isValidWordCount) {
      setError(
        `Comment must be at least ${MIN_WORD_COUNT} words. Current: ${wordCount} words.`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmitReview(photoId, rating, comment);
      // Reset form after successful submission
      setRating(0);
      setComment("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card max-w-3xl mx-auto">
      {/* Photo Display */}
      <div className="mb-6">
        <div className="relative rounded-lg overflow-hidden border border-border bg-background">
          <img
            src={photoUrl}
            alt="Photo to review"
            className="w-full h-auto max-h-[500px] object-contain"
          />
        </div>
      </div>

      {/* Review Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Star Rating */}
        <div>
          <label className="block text-sm font-bold mb-3">
            Rating <span className="text-error">*</span>
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="star transition-transform hover:scale-110"
              >
                <span
                  className={
                    star <= (hoverRating || rating)
                      ? "text-present"
                      : "text-border"
                  }
                >
                  ★
                </span>
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-3 text-text-secondary self-center">
                {rating} {rating === 1 ? "star" : "stars"}
              </span>
            )}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label htmlFor="comment" className="block text-sm font-bold mb-2">
            Your Feedback <span className="text-error">*</span>
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share constructive feedback about this photo. What did you like? What could be improved? Be specific and helpful..."
            className="input min-h-[150px] resize-y"
            disabled={isSubmitting}
          />
          <div className="mt-2 flex items-center justify-between text-sm">
            <span
              className={
                isValidWordCount ? "text-correct" : "text-text-secondary"
              }
            >
              {wordCount} / {MIN_WORD_COUNT} words minimum
            </span>
            {isValidWordCount && (
              <span className="text-correct">✓ Ready to submit</span>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-error/20 border border-error rounded text-error text-sm">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !rating || !isValidWordCount}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </button>
      </form>

      {/* Helper Text */}
      <p className="mt-4 text-sm text-text-secondary text-center">
        Be constructive and respectful. Your review helps photographers improve!
      </p>
    </div>
  );
}
