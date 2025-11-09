"use client";

import { useState } from "react";

interface TestingToolsProps {
  photoId?: string;
  onReviewSubmitted?: () => void;
  onStrikeReceived?: (strikes: number, isTimedOut: boolean, timeoutUntil?: string) => void;
}

export default function ClearReviewsButton({ photoId, onReviewSubmitted, onStrikeReceived }: TestingToolsProps = {}) {
  const [isClearing, setIsClearing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleClear = async () => {
    if (!confirm("Clear all your reviews? This will let you test the moderation system again.")) {
      return;
    }

    setIsClearing(true);
    setMessage("");

    try {
      // Clear reviews
      const response = await fetch("/api/clear-reviews", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        // Also reset strikes
        await fetch("/api/reset-strikes", { method: "POST" });

        setMessage(`✅ Cleared ${data.deletedReviews} reviews and reset strikes! Refreshing...`);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setMessage(`❌ Error: ${data.error}`);
        setIsClearing(false);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error}`);
      setIsClearing(false);
    }
  };

  const submitTestReview = async (type: "good" | "offensive" | "spam" | "generic") => {
    if (!photoId) {
      setMessage("❌ No photo assigned");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    const testReviews = {
      good: {
        score: 78,
        comment: "The composition follows the rule of thirds nicely, positioning your subject at the intersection which creates visual balance. However, I notice the horizon line tilts slightly to the left, creating unintended tension. For landscape shots like this, I typically shoot at f/8 to f/11 for maximum depth of field, ensuring both foreground and background elements stay sharp. The golden hour lighting you captured is beautiful, but consider exposing for the highlights next time to preserve more detail in the sky. Overall, strong work with room for technical refinement."
      },
      offensive: {
        score: 15,
        comment: "This is absolute garbage and a complete waste of time. Why would you even bother posting this trash? You clearly have zero talent and no understanding of photography whatsoever. The composition is pathetic, the lighting is terrible, and honestly you should just give up and stop embarrassing yourself. This is one of the worst photos I've ever seen and you're delusional if you think otherwise. Seriously, find a different hobby because photography is definitely not for you at all."
      },
      spam: {
        score: 90,
        comment: "Nice photo! I really enjoyed looking at this image, it has great potential! If you want to learn more amazing photography tips and tricks, make sure to follow me on Instagram at @photospammer for daily content! Also check out my YouTube channel where I post tutorials every week! Click the link in my bio to download my FREE photography ebook with over 100 pages of expert advice! Don't forget to like and subscribe!"
      },
      generic: {
        score: 85,
        comment: "This is a really nice photograph that I enjoyed viewing! The colors are beautiful and work well together in the composition. You clearly have a good eye for capturing interesting moments and scenes. The overall execution is solid and demonstrates good technique. I think you're doing a great job and should keep practicing and experimenting with your craft. Keep up the excellent work and continue to develop your unique photographic style!"
      }
    };

    const review = testReviews[type];

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          photoId,
          score: review.score,
          comment: review.comment
        })
      });

      const data = await response.json();

      if (response.ok) {
        const labels = {
          good: "✅ Good Review",
          offensive: "❌ Offensive Review",
          spam: "❌ Spam Review",
          generic: "⚠️ Generic Review"
        };
        setMessage(`${labels[type]} submitted! Check terminal for moderation...`);

        // Check for strikes in the response
        if (data.moderation && data.moderation.strikes !== undefined && data.moderation.strikes > 0) {
          console.log("🚨 Test button detected strike!", data.moderation);
          onStrikeReceived?.(
            data.moderation.strikes,
            data.moderation.isTimedOut || false,
            data.moderation.timeoutUntil
          );
        }

        setTimeout(() => {
          setMessage("");
          onReviewSubmitted?.();
        }, 3000);
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="card bg-yellow-500/10 border-yellow-500">
      <h3 className="text-sm font-bold mb-3">🧪 Testing Tools (Dev Only)</h3>

      {/* Quick Test Reviews */}
      {photoId && (
        <div className="mb-4">
          <p className="text-xs font-medium mb-2">Generate Test Reviews:</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => submitTestReview("good")}
              disabled={isSubmitting}
              className="px-3 py-2 text-xs bg-correct/20 border border-correct text-correct rounded hover:bg-correct/30 disabled:opacity-50"
            >
              ✅ Good Review
              <div className="text-[10px] opacity-70">Should approve</div>
            </button>
            <button
              onClick={() => submitTestReview("offensive")}
              disabled={isSubmitting}
              className="px-3 py-2 text-xs bg-error/20 border border-error text-error rounded hover:bg-error/30 disabled:opacity-50"
            >
              ❌ Offensive
              <div className="text-[10px] opacity-70">Should reject</div>
            </button>
            <button
              onClick={() => submitTestReview("spam")}
              disabled={isSubmitting}
              className="px-3 py-2 text-xs bg-error/20 border border-error text-error rounded hover:bg-error/30 disabled:opacity-50"
            >
              ❌ Spam
              <div className="text-[10px] opacity-70">Should reject</div>
            </button>
            <button
              onClick={() => submitTestReview("generic")}
              disabled={isSubmitting}
              className="px-3 py-2 text-xs bg-present/20 border border-present text-present rounded hover:bg-present/30 disabled:opacity-50"
            >
              ⚠️ Generic
              <div className="text-[10px] opacity-70">Should approve</div>
            </button>
          </div>
        </div>
      )}

      {/* Clear Reviews */}
      <div className="pt-3 border-t border-yellow-500/30">
        <button
          onClick={handleClear}
          disabled={isClearing || isSubmitting}
          className="btn-primary text-sm w-full"
        >
          {isClearing ? "Clearing..." : "Clear My Reviews"}
        </button>
        <p className="mt-2 text-xs text-text-secondary">
          Reset all reviews and assignments to test again
        </p>
      </div>

      {message && (
        <div className="mt-3 p-2 bg-background rounded text-xs font-medium">
          {message}
        </div>
      )}
    </div>
  );
}
