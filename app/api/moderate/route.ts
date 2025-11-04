import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { moderateReview, getModerationDecision } from "@/lib/gemini";
import { getReviewById, updateReviewModeration } from "@/lib/db/reviews";

/**
 * Moderate a specific review using AI
 * This can be called manually or as part of a background job
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication (admin only in production)
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { reviewId } = body;

    if (!reviewId) {
      return NextResponse.json(
        { error: "Missing required field: reviewId" },
        { status: 400 }
      );
    }

    // Get the review
    const review = await getReviewById(reviewId);
    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    // Skip if already moderated
    if (review.moderationStatus !== "pending") {
      return NextResponse.json(
        {
          success: true,
          message: "Review already moderated",
          moderationStatus: review.moderationStatus,
        },
        { status: 200 }
      );
    }

    // Perform AI moderation
    const aiAnalysis = await moderateReview(review.comment);

    // Determine approval status
    const moderationStatus = getModerationDecision(aiAnalysis);

    // Update review with moderation results
    await updateReviewModeration(reviewId, moderationStatus, aiAnalysis);

    return NextResponse.json(
      {
        success: true,
        reviewId,
        moderationStatus,
        aiAnalysis,
        message: `Review ${moderationStatus}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Moderation error:", error);
    return NextResponse.json(
      {
        error: "Failed to moderate review. Please try again.",
      },
      { status: 500 }
    );
  }
}
