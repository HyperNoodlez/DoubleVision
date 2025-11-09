import { getReviewRatingsWithReviewers } from "@/lib/db/reviewRatings";
import { getUserById } from "@/lib/db/users";

interface RatedReviewsProps {
  photoId: string;
}

export default async function RatedReviews({ photoId }: RatedReviewsProps) {
  const reviewRatings = await getReviewRatingsWithReviewers(photoId);

  const reviewersWithData = await Promise.all(
    reviewRatings.map(async (rating) => {
      const reviewer = await getUserById(rating.reviewerId);
      return {
        ...rating,
        name: reviewer?.name || "Unknown",
        image: reviewer?.image,
        eloRating: reviewer?.eloRating || 1000,
      };
    })
  );

  if (reviewersWithData.length === 0) {
    return (
      <div className="card text-center">
        <div className="text-4xl mb-4">⏳</div>
        <h3 className="text-lg font-bold mb-2">No Reviews Yet</h3>
        <p className="text-text-secondary">
          This photo is waiting to be reviewed. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card bg-present/10 border-present">
        <h2 className="text-xl font-bold text-present mb-2">✅ Reviews Rated</h2>
        <p className="text-text-secondary">
          You&apos;ve rated these reviews. Here are the reviewers who provided feedback:
        </p>
      </div>

      {reviewersWithData.map((reviewer) => (
        <div key={reviewer.reviewId} className="card">
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
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-lg ${
                    star <= reviewer.reviewScore ? "text-present" : "text-border"
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
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

          <div className="flex items-center justify-between text-sm text-text-secondary mt-3">
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
