"use client";

import { useState } from "react";
import Image from "next/image";

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
  const [score, setScore] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wordCount = comment.trim().split(/\s+/).filter(Boolean).length;
  const isValidWordCount = wordCount >= MIN_WORD_COUNT;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate score
    if (score === 0) {
      setError("Please set a score for this photo.");
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
      await onSubmitReview(photoId, score, comment);
      // Reset form after successful submission
      setScore(0);
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
        <div className="relative rounded-lg overflow-hidden border border-border bg-background aspect-square">
          <Image
            src={photoUrl}
            alt="Photo to review"
            fill
            className="object-contain"
          />
        </div>
      </div>

      {/* Review Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Score Slider */}
        <div>
          <label className="block text-sm font-bold mb-3">
            Score <span className="text-error">*</span>
          </label>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Rate this photo from 0 to 100</span>
              <div className="text-4xl font-bold text-present">
                {score}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-secondary">0</span>
              <input
                type="range"
                min="0"
                max="100"
                value={score}
                onChange={(e) => setScore(parseInt(e.target.value))}
                className="flex-1 h-3 bg-surface rounded-lg appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-present
                  [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:bg-correct
                  [&::-webkit-slider-thumb]:shadow-lg
                  [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6
                  [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-present
                  [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:hover:bg-correct
                  [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-lg"
                style={{
                  background: `linear-gradient(to right, rgb(var(--color-present)) 0%, rgb(var(--color-present)) ${score}%, rgb(var(--color-surface)) ${score}%, rgb(var(--color-surface)) 100%)`
                }}
              />
              <span className="text-xs text-text-secondary">100</span>
            </div>
            <div className="text-xs text-center text-text-secondary">
              {score === 0 && "Move the slider to set a score"}
              {score > 0 && score < 40 && "Poor"}
              {score >= 40 && score < 60 && "Below Average"}
              {score >= 60 && score < 75 && "Average"}
              {score >= 75 && score < 90 && "Good"}
              {score >= 90 && "Excellent"}
            </div>
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
          disabled={isSubmitting || score === 0 || !isValidWordCount}
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
