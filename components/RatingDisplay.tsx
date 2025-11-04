import { getRatingTier } from "@/lib/elo";

interface RatingDisplayProps {
  rating: number;
  showTier?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function RatingDisplay({
  rating,
  showTier = true,
  size = "md",
}: RatingDisplayProps) {
  const tier = getRatingTier(rating);

  // Size configurations
  const sizeClasses = {
    sm: {
      rating: "text-2xl",
      icon: "text-xl",
      tierName: "text-xs",
      container: "gap-2",
    },
    md: {
      rating: "text-3xl",
      icon: "text-2xl",
      tierName: "text-sm",
      container: "gap-3",
    },
    lg: {
      rating: "text-4xl",
      icon: "text-3xl",
      tierName: "text-base",
      container: "gap-4",
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className={`flex items-center ${classes.container}`}>
      {/* Rating Number */}
      <div className={`${classes.rating} font-bold text-present`}>
        {rating}
      </div>

      {/* Tier Badge */}
      {showTier && (
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-1">
            <span className={classes.icon}>{tier.icon}</span>
            <span className={`${classes.tierName} font-semibold ${tier.color}`}>
              {tier.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for inline display
 */
export function RatingBadge({ rating }: { rating: number }) {
  const tier = getRatingTier(rating);

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface rounded-full border border-border">
      <span className="text-lg">{tier.icon}</span>
      <span className="text-sm font-bold text-present">{rating}</span>
      <span className={`text-xs font-semibold ${tier.color}`}>
        {tier.name}
      </span>
    </div>
  );
}

/**
 * Progress bar showing rating relative to tier thresholds
 */
export function RatingProgress({ rating }: { rating: number }) {
  const tiers = [
    { threshold: 0, name: "Beginner" },
    { threshold: 900, name: "Intermediate" },
    { threshold: 1200, name: "Advanced" },
    { threshold: 1500, name: "Expert" },
    { threshold: 1800, name: "Master" },
  ];

  // Find current tier
  let currentTierIndex = 0;
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (rating >= tiers[i].threshold) {
      currentTierIndex = i;
      break;
    }
  }

  const currentTier = tiers[currentTierIndex];
  const nextTier = tiers[currentTierIndex + 1];

  // Calculate progress to next tier
  let progress = 100;
  let pointsNeeded = 0;

  if (nextTier) {
    const tierRange = nextTier.threshold - currentTier.threshold;
    const currentProgress = rating - currentTier.threshold;
    progress = (currentProgress / tierRange) * 100;
    pointsNeeded = nextTier.threshold - rating;
  }

  return (
    <div className="space-y-2">
      {/* Progress Bar */}
      <div className="w-full bg-surface rounded-full h-2 overflow-hidden">
        <div
          className="bg-correct h-full transition-all duration-500 rounded-full"
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>

      {/* Progress Text */}
      {nextTier && (
        <p className="text-xs text-text-secondary">
          {Math.round(pointsNeeded)} points until {nextTier.name}
        </p>
      )}
    </div>
  );
}
