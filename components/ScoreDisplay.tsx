interface ScoreDisplayProps {
  score: number; // 0-100
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function ScoreDisplay({ score, size = "md", showLabel = true }: ScoreDisplayProps) {
  // Determine color based on score ranges
  const getScoreColor = (score: number) => {
    if (score >= 90) return "from-correct to-accentSecondary";
    if (score >= 75) return "from-present to-accent";
    if (score >= 60) return "from-yellow-400 to-present";
    if (score >= 40) return "from-orange-400 to-yellow-500";
    return "from-absent to-absent";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 75) return "Good";
    if (score >= 60) return "Average";
    if (score >= 40) return "Below Average";
    return "Poor";
  };

  const sizeClasses = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-5xl",
  };

  const labelSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const gradient = getScoreColor(score);

  return (
    <div className="flex items-center gap-3">
      <div
        className={`${sizeClasses[size]} font-bold text-transparent bg-clip-text bg-gradient-to-r ${gradient}`}
      >
        {Math.round(score)}
      </div>
      <div className="flex flex-col">
        <span className={`${labelSizeClasses[size]} text-text-secondary`}>/100</span>
        {showLabel && (
          <span
            className={`${labelSizeClasses[size]} font-medium text-transparent bg-clip-text bg-gradient-to-r ${gradient}`}
          >
            {getScoreLabel(score)}
          </span>
        )}
      </div>
    </div>
  );
}

interface ScoreBarProps {
  score: number; // 0-100
  height?: "sm" | "md" | "lg";
}

export function ScoreBar({ score, height = "md" }: ScoreBarProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "from-correct to-accentSecondary";
    if (score >= 75) return "from-present to-accent";
    if (score >= 60) return "from-yellow-400 to-present";
    if (score >= 40) return "from-orange-400 to-yellow-400";
    return "from-absent to-absent";
  };

  const heightClasses = {
    sm: "h-2",
    md: "h-4",
    lg: "h-6",
  };

  return (
    <div className="w-full bg-surfaceMuted rounded-full overflow-hidden">
      <div
        className={`${heightClasses[height]} bg-gradient-to-r ${getScoreColor(score)} transition-all duration-500 rounded-full`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

interface ScoreSummaryProps {
  averageScore: number;
  totalReviews: number;
}

export function ScoreSummary({ averageScore, totalReviews }: ScoreSummaryProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <ScoreDisplay score={averageScore} size="lg" showLabel={true} />
        <div className="text-right">
          <div className="text-sm text-text-secondary">Based on</div>
          <div className="text-lg font-bold text-text-primary">
            {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
          </div>
        </div>
      </div>
      <ScoreBar score={averageScore} height="md" />
    </div>
  );
}
