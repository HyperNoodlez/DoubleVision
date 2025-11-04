interface RatingDistributionProps {
  distribution: { [key: number]: number };
  totalReviews: number;
}

export default function RatingDistribution({
  distribution,
  totalReviews,
}: RatingDistributionProps) {
  const ratings = [5, 4, 3, 2, 1]; // Display from high to low

  if (totalReviews === 0) {
    return (
      <div className="text-center text-text-secondary py-4">
        No reviews yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {ratings.map((rating) => {
        const count = distribution[rating] || 0;
        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

        return (
          <div key={rating} className="flex items-center gap-3">
            {/* Rating Label */}
            <div className="flex items-center gap-1 w-12">
              <span className="text-sm font-medium">{rating}</span>
              <span className="text-present text-sm">★</span>
            </div>

            {/* Progress Bar */}
            <div className="flex-1 bg-surface rounded-full h-2 overflow-hidden">
              <div
                className="bg-present h-full rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>

            {/* Count */}
            <div className="text-sm text-text-secondary w-8 text-right">
              {count}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Star rating visualization for average scores
 */
export function StarRating({
  rating,
  size = "md",
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "text-base",
    md: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(rating);
        return (
          <span
            key={star}
            className={`${sizeClasses[size]} ${
              filled ? "text-present" : "text-border"
            }`}
          >
            ★
          </span>
        );
      })}
    </div>
  );
}

/**
 * Compact rating summary
 */
export function RatingSummary({
  averageScore,
  totalReviews,
}: {
  averageScore: number;
  totalReviews: number;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="text-center">
        <div className="text-4xl font-bold text-present">
          {averageScore.toFixed(1)}
        </div>
        <StarRating rating={averageScore} size="sm" />
      </div>
      <div className="text-sm text-text-secondary">
        Based on {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
      </div>
    </div>
  );
}
