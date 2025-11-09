import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { hasCompletedMinimumReviews } from "@/lib/db/reviewAssignments";
import { getUserLatestPhotoWithStats, getPhotoWithStats } from "@/lib/db/photos";
import { getApprovedReviewsByPhoto } from "@/lib/db/reviews";
import { ScoreSummary, ScoreDisplay } from "@/components/ScoreDisplay";
import ReviewRating from "@/components/ReviewRating";
import RatedReviews from "@/components/RatedReviews";
import { hasPhotoBeenRated } from "@/lib/db/reviewRatings";

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ photoId?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const params = await searchParams;
  const userId = session.user.id;

  // Check if user has completed 5 reviews
  const hasCompleted5Reviews = await hasCompletedMinimumReviews(userId);

  if (!hasCompleted5Reviews) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card max-w-md w-full text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-bold mb-2">Feedback Locked</h2>
          <p className="text-text-secondary mb-6">
            Complete 5 photo reviews to unlock feedback on your own photo.
          </p>
          <Link href="/review" className="btn-primary inline-block">
            Start Reviewing
          </Link>
        </div>
      </div>
    );
  }

  // Get photo with stats - either specific photo from archive or latest photo
  let photoData;
  if (params.photoId) {
    // Get specific photo from archive
    photoData = await getPhotoWithStats(params.photoId);

    // Verify the photo belongs to the current user
    if (photoData && photoData.photo.userId !== userId) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="card max-w-md w-full text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-text-secondary mb-6">
              You can only view feedback for your own photos.
            </p>
            <Link href="/archive" className="btn-primary inline-block">
              Back to Archive
            </Link>
          </div>
        </div>
      );
    }
  } else {
    // Get user's latest photo with stats
    photoData = await getUserLatestPhotoWithStats(userId);
  }

  if (!photoData) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card max-w-md w-full text-center">
          <div className="text-4xl mb-4">📸</div>
          <h2 className="text-xl font-bold mb-2">No Photo Yet</h2>
          <p className="text-text-secondary mb-6">
            You haven&apos;t uploaded a photo yet. Upload one to receive feedback!
          </p>
          <Link href="/dashboard" className="btn-primary inline-block">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { photo: latestPhoto, stats } = photoData;

  // Get approved reviews for the photo
  const reviews = await getApprovedReviewsByPhoto(latestPhoto._id.toString());

  // Check if user has already rated this photo's reviews
  const hasBeenRated = await hasPhotoBeenRated(latestPhoto._id.toString());

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="card">
          <h1 className="text-3xl font-bold mb-2">Your Feedback</h1>
          <p className="text-text-secondary">
            Reviews for your photo uploaded on{" "}
            {new Date(latestPhoto.uploadDate).toLocaleDateString()}
          </p>
        </div>

        {/* Photo and Stats */}
        <div className="card">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <img
                src={latestPhoto.imageUrl}
                alt="Your photo"
                className="w-full rounded-lg border border-border"
              />
            </div>
            <div className="space-y-6">
              {/* Score Summary */}
              {stats.averageScore !== undefined && (
                <div>
                  <h3 className="text-lg font-bold mb-3">Your Score</h3>
                  <ScoreSummary
                    averageScore={stats.averageScore}
                    totalReviews={stats.totalReviews}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews */}
        {reviews.length === 5 && hasBeenRated ? (
          // Photo has 5 reviews and has been rated - show reviewers
          <RatedReviews photoId={latestPhoto._id.toString()} />
        ) : reviews.length === 5 && !hasBeenRated ? (
          // Photo has 5 reviews but hasn't been rated - show rating UI
          <ReviewRating
            photoId={latestPhoto._id.toString()}
            reviews={reviews.map((r) => ({
              _id: r._id.toString(),
              score: r.score,
              comment: r.comment,
              wordCount: r.wordCount,
              createdAt: r.createdAt,
            }))}
          />
        ) : reviews.length > 0 ? (
          // Photo has some reviews but not 5 yet - show progress
          <>
            <div className="card text-center">
              <div className="text-4xl mb-4">⏳</div>
              <h3 className="text-lg font-bold mb-2">
                {reviews.length}/5 Reviews Received
              </h3>
              <p className="text-text-secondary">
                Your photo needs {5 - reviews.length} more review
                {5 - reviews.length > 1 ? "s" : ""} before you can rate them.
              </p>
            </div>

            {/* Show received reviews with scores */}
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review._id} className="card">
                  <div className="flex items-center justify-between mb-3">
                    <ScoreDisplay score={review.score} size="sm" showLabel={false} />
                    <div className="text-sm text-text-secondary">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <p className="text-text-primary leading-relaxed whitespace-pre-wrap">
                    {review.comment}
                  </p>
                  <div className="mt-3 text-sm text-text-secondary">
                    {review.wordCount} words
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="card text-center">
              <div className="text-4xl mb-4">⏳</div>
              <h3 className="text-lg font-bold mb-2">No Reviews Yet</h3>
              <p className="text-text-secondary">
                Your photo is waiting to be reviewed. Check back soon!
              </p>
            </div>
          </>
        )}

        {/* Back Button */}
        <div className="card">
          <Link
            href={params.photoId ? "/archive" : "/dashboard"}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            ← Back to {params.photoId ? "Archive" : "Dashboard"}
          </Link>
        </div>
      </div>
    </div>
  );
}
