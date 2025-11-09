import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import PhotoUpload from "@/components/PhotoUpload";
import RatingDisplay, { RatingProgress } from "@/components/RatingDisplay";
import StrikeStatus from "@/components/StrikeStatus";
import { getUserStats, canUserUploadToday } from "@/lib/db/users";
import {
  getTodayCompletedReviewCount,
  hasCompletedMinimumReviews,
} from "@/lib/db/reviewAssignments";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Fetch user stats and upload eligibility
  const [userStats, canUpload, completedReviews, hasCompleted5Reviews] =
    await Promise.all([
      getUserStats(userId),
      canUserUploadToday(userId),
      getTodayCompletedReviewCount(userId),
      hasCompletedMinimumReviews(userId),
    ]);

  const stats = userStats || {
    eloRating: 1000,
    totalReviews: 0,
    photoCount: 0,
    joinedAt: new Date(),
  };

  // Determine upload disabled reason
  const isDevelopment = process.env.NODE_ENV === "development";
  let uploadDisabledReason = "";

  if (!canUpload) {
    uploadDisabledReason =
      "You've already uploaded a photo today. Come back tomorrow!";
  } else if (!hasCompleted5Reviews && !isDevelopment) {
    uploadDisabledReason = `Complete ${5 - completedReviews} more reviews to unlock photo upload.`;
  }

  const canUploadPhoto = canUpload && (hasCompleted5Reviews || isDevelopment);

  return (
    <div className="min-h-screen flex flex-col py-8 px-4">
      <div className="max-w-4xl w-full mx-auto space-y-6">
        {/* Header */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">DoubleVision</h1>
              <p className="text-text-secondary">
                Signed in as {session.user.email}
              </p>
            </div>
            {session.user.image && (
              <img
                src={session.user.image}
                alt={session.user.name || "User"}
                className="w-16 h-16 rounded-full border-2 border-border"
              />
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="card">
          <h2 className="text-lg font-bold mb-4">Your Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <RatingDisplay rating={stats.eloRating} size="md" />
              <div className="text-sm text-text-secondary">ELO Rating</div>
              <RatingProgress rating={stats.eloRating} />
            </div>
            <div>
              <div className="text-3xl font-bold text-correct">
                {stats.totalReviews}
              </div>
              <div className="text-sm text-text-secondary">Reviews Given</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-text-primary">
                {stats.photoCount}
              </div>
              <div className="text-sm text-text-secondary">Photos Uploaded</div>
            </div>
          </div>
        </div>

        {/* Strike Status */}
        <StrikeStatus />

        {/* Today&apos;s Challenge */}
        <div className="card">
          <h2 className="text-lg font-bold mb-2">Today&apos;s Challenge</h2>
          <p className="text-text-secondary mb-4">
            Complete 5 reviews to unlock the ability to upload your photo
          </p>
          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`flex-1 h-3 rounded-full transition-colors ${
                  i <= completedReviews ? "bg-correct" : "bg-surface"
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-text-secondary">
            {completedReviews} of 5 reviews completed today
          </p>
        </div>

        {/* Development Mode Notice */}
        {isDevelopment && !hasCompleted5Reviews && (
          <div className="card border-2 border-dashed border-present bg-present/5">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🧪</div>
              <div>
                <h3 className="font-bold text-present">Development Mode</h3>
                <p className="text-sm text-text-secondary">
                  Review requirement bypassed for testing. Upload is enabled!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Photo Upload */}
        <PhotoUpload
          disabled={!canUploadPhoto}
          disabledReason={uploadDisabledReason}
        />

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/review" className="btn-primary text-center">
            {completedReviews < 5 ? "Start Reviewing" : "Review More Photos"}
          </Link>
          <Link href="/feedback" className="btn-secondary text-center">
            View Your Feedback
          </Link>
          <Link href="/archive" className="btn-secondary text-center">
            Photo Archive
          </Link>
        </div>

        {/* Sign Out */}
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="w-full px-6 py-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}
