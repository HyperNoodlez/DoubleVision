"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ReviewCard from "@/components/ReviewCard";
import { RatingBadge } from "@/components/RatingDisplay";
import StrikeNotificationModal from "@/components/StrikeNotificationModal";

interface Assignment {
  assignmentId: string;
  photoId: string;
  assignedAt: Date;
  completed: boolean;
  photo: {
    imageUrl: string;
    uploadDate: Date;
    reviewsReceived: number;
  } | null;
}

interface AssignmentStats {
  totalAssigned: number;
  completed: number;
  pending: number;
  completionRate: number;
}

export default function ReviewPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [stats, setStats] = useState<AssignmentStats | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [userRating, setUserRating] = useState<number>(1000);

  // Strike notification state
  const [showStrikeModal, setShowStrikeModal] = useState(false);
  const [strikeData, setStrikeData] = useState<{
    strikes: number;
    isTimedOut: boolean;
    timeoutUntil?: string;
  } | null>(null);

  // Fetch assignments and user rating on mount
  useEffect(() => {
    fetchAssignments();
    fetchUserRating();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUserRating = async () => {
    try {
      const response = await fetch("/api/user/stats");
      if (response.ok) {
        const data = await response.json();
        setUserRating(data.eloRating || 1000);
      }
    } catch (err) {
      console.error("Failed to fetch user rating:", err);
    }
  };

  const fetchAssignments = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/assignments");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch assignments");
      }

      // Filter out completed assignments
      const pendingAssignments = data.assignments.filter(
        (a: Assignment) => !a.completed && a.photo !== null
      );

      setAssignments(pendingAssignments);
      setStats(data.stats);

      // If no pending assignments, redirect to dashboard
      if (pendingAssignments.length === 0) {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load assignments"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReview = async (
    photoId: string,
    score: number,
    comment: string
  ) => {
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ photoId, score, comment }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if timed out
        if (data.timedOut) {
          setStrikeData({
            strikes: data.strikes,
            isTimedOut: true,
            timeoutUntil: data.timeoutUntil,
          });
          setShowStrikeModal(true);
        }
        throw new Error(data.error || "Failed to submit review");
      }

      // Show success message
      setSuccessMessage(data.message || "Review submitted successfully!");

      // Check if moderation resulted in a strike (strikes can be any number >= 1)
      if (data.moderation && data.moderation.strikes !== undefined && data.moderation.strikes > 0) {
        const strikeInfo = {
          strikes: data.moderation.strikes,
          isTimedOut: data.moderation.isTimedOut || false,
          timeoutUntil: data.moderation.timeoutUntil,
        };

        setStrikeData(strikeInfo);
        setShowStrikeModal(true);
      }

      // Move to next photo after 2 seconds (or wait for modal to be closed)
      setTimeout(() => {
        if (currentIndex < assignments.length - 1) {
          setCurrentIndex(currentIndex + 1);
          setSuccessMessage(null);
        } else {
          // All reviews completed, redirect to dashboard
          router.push("/dashboard");
        }
      }, 2000);
    } catch (err) {
      throw err; // Re-throw to let ReviewCard handle the error
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📸</div>
          <p className="text-text-secondary">Loading photos to review...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card max-w-md w-full text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p className="text-text-secondary mb-4">{error}</p>
          <button onClick={() => router.push("/dashboard")} className="btn-primary">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-4">
          <div className="card text-center">
            <div className="text-4xl mb-4">🎉</div>
            <h2 className="text-xl font-bold mb-2">All Done!</h2>
            <p className="text-text-secondary mb-4">
              You&apos;ve completed all your reviews. Great job!
            </p>
            <button onClick={() => router.push("/dashboard")} className="btn-primary">
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentAssignment = assignments[currentIndex];
  const progress = stats ? stats.completed : 0;
  const total = stats ? stats.totalAssigned : 5;

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with Progress */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Review Photos</h1>
              <p className="text-text-secondary">
                Photo {currentIndex + 1} of {assignments.length}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <RatingBadge rating={userRating} />
              <div className="text-right">
                <div className="text-3xl font-bold text-correct">{progress}</div>
                <div className="text-sm text-text-secondary">
                  of {total} reviews
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex gap-2">
            {Array.from({ length: assignments.length }).map((_, idx) => (
              <div
                key={idx}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  idx < currentIndex
                    ? "bg-correct"
                    : idx === currentIndex
                    ? "bg-present"
                    : "bg-surface"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="card bg-correct/20 border-correct">
            <p className="text-correct font-bold text-center">
              {successMessage}
            </p>
          </div>
        )}

        {/* Review Card */}
        {currentAssignment.photo && (
          <ReviewCard
            photoUrl={currentAssignment.photo.imageUrl}
            photoId={currentAssignment.photoId}
            onSubmitReview={handleSubmitReview}
          />
        )}

        {/* Navigation */}
        <div className="card">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              ← Back to Dashboard
            </button>
            <p className="text-sm text-text-secondary">
              {assignments.length - currentIndex - 1} reviews remaining
            </p>
          </div>
        </div>

      </div>

      {/* Strike Notification Modal */}
      <StrikeNotificationModal
        isOpen={showStrikeModal}
        onClose={() => setShowStrikeModal(false)}
        strikes={strikeData?.strikes || 0}
        isTimedOut={strikeData?.isTimedOut || false}
        timeoutUntil={strikeData?.timeoutUntil}
      />
    </div>
  );
}
