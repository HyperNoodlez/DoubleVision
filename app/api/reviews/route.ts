import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createReview, hasReviewerReviewedPhoto } from "@/lib/db/reviews";
import { isPhotoAssignedToUser, markAssignmentComplete } from "@/lib/db/reviewAssignments";
import { incrementPhotoReviewCount } from "@/lib/db/photos";
import { incrementReviewCount } from "@/lib/db/users";
import { moderateReview, getModerationDecision } from "@/lib/gemini";
import { updateReviewModeration } from "@/lib/db/reviews";
import { calculateNewElo } from "@/lib/elo";
import { getUserById, updateUserElo } from "@/lib/db/users";
import { createModerationAlertIssue, type ModerationAlert } from "@/lib/linear";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { validateReviewComment, validateReviewScore, validateObjectId } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Rate limiting
    const rateLimitResult = checkRateLimit(
      `review:${userId}`,
      RATE_LIMITS.REVIEW_SUBMISSION.limit,
      RATE_LIMITS.REVIEW_SUBMISSION.windowMs
    );

    if (!rateLimitResult.allowed) {
      const resetDate = new Date(rateLimitResult.resetTime);
      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          resetAt: resetDate.toISOString(),
        },
        { status: 429 }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { photoId, score, comment } = body;

    // Validate required fields
    if (!photoId || score === null || score === undefined || !comment) {
      return NextResponse.json(
        { error: "Missing required fields: photoId, score, comment" },
        { status: 400 }
      );
    }

    // Validate photoId format
    const photoIdValidation = validateObjectId(photoId);
    if (!photoIdValidation.valid) {
      return NextResponse.json(
        { error: photoIdValidation.error || "Invalid photo ID" },
        { status: 400 }
      );
    }

    // Validate score
    const scoreValidation = validateReviewScore(score);
    if (!scoreValidation.valid) {
      return NextResponse.json(
        { error: scoreValidation.error || "Invalid score" },
        { status: 400 }
      );
    }

    // Validate and sanitize comment
    const commentValidation = validateReviewComment(comment);
    if (!commentValidation.valid) {
      return NextResponse.json(
        { error: commentValidation.error || "Invalid comment", wordCount: commentValidation.wordCount },
        { status: 400 }
      );
    }

    const trimmedComment = commentValidation.sanitized;
    const wordCount = commentValidation.wordCount;

    // Check if photo is assigned to user
    const isAssigned = await isPhotoAssignedToUser(userId, photoId);
    console.log(`🔍 Checking assignment: userId=${userId}, photoId=${photoId}, isAssigned=${isAssigned}`);
    if (!isAssigned) {
      return NextResponse.json(
        { error: "This photo is not assigned to you for review." },
        { status: 403 }
      );
    }

    // Check if user already reviewed this photo
    const alreadyReviewed = await hasReviewerReviewedPhoto(userId, photoId);
    if (alreadyReviewed) {
      return NextResponse.json(
        { error: "You have already reviewed this photo." },
        { status: 403 }
      );
    }

    // Create review with validated data
    const review = await createReview({
      photoId,
      reviewerId: userId,
      score: scoreValidation.value,
      comment: trimmedComment,
    });

    // Mark assignment as complete
    await markAssignmentComplete(userId, photoId);

    // Increment photo review count
    await incrementPhotoReviewCount(photoId);

    // Increment user's review count
    await incrementReviewCount(userId);

    // Trigger AI moderation and ELO update asynchronously (don't block response)
    // This runs in the background and updates the review status
    moderateReviewAsync(review._id, userId, photoId, trimmedComment, wordCount);

    return NextResponse.json(
      {
        success: true,
        review: {
          id: review._id,
          score: review.score,
          wordCount: review.wordCount,
          createdAt: review.createdAt,
        },
        message: "Review submitted successfully! 🎉",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Review submission error:", error);
    return NextResponse.json(
      {
        error: "Failed to submit review. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * Moderate a review asynchronously in the background
 * This doesn't block the API response
 */
async function moderateReviewAsync(
  reviewId: string,
  reviewerId: string,
  photoId: string,
  comment: string,
  wordCount: number
) {
  try {
    // Perform AI moderation
    const aiAnalysis = await moderateReview(comment);

    // Determine approval status
    const moderationStatus = getModerationDecision(aiAnalysis);

    // Update review with moderation results
    await updateReviewModeration(reviewId, moderationStatus, aiAnalysis);

    console.log(`✅ Review ${reviewId} moderated: ${moderationStatus}`);

    // If moderation rejected the review with high confidence, create Linear alert
    if (moderationStatus === "rejected" && aiAnalysis.confidence >= 70) {
      const reason = aiAnalysis.isOffensive
        ? "offensive"
        : aiAnalysis.isRelevant === false
        ? "irrelevant"
        : "ai-generated";

      const alert: ModerationAlert = {
        reviewId,
        photoId,
        reviewerId,
        moderationStatus,
        reason,
        confidence: aiAnalysis.confidence,
        reasoning: aiAnalysis.reasoning,
        reviewText: comment,
      };

      // Create Linear issue asynchronously
      createModerationAlertIssue(alert).catch((err) =>
        console.error("Failed to create Linear alert:", err)
      );

      console.log(
        `🚨 High-confidence rejection (${aiAnalysis.confidence}%) - Linear alert created`
      );
    }

    // Update reviewer's ELO rating based on moderation results
    try {
      const reviewer = await getUserById(reviewerId);
      if (reviewer) {
        const currentElo = reviewer.eloRating;
        const reviewApproved = moderationStatus === "approved";
        const aiConfidence = aiAnalysis.confidence;

        const newElo = calculateNewElo(
          currentElo,
          reviewApproved,
          aiConfidence,
          wordCount
        );

        await updateUserElo(reviewerId, newElo);

        const change = newElo - currentElo;
        const changeStr = change > 0 ? `+${change}` : `${change}`;
        console.log(
          `📊 ELO updated for reviewer ${reviewerId}: ${currentElo} → ${newElo} (${changeStr})`
        );
      }
    } catch (eloError) {
      console.error(`❌ Failed to update ELO for reviewer ${reviewerId}:`, eloError);
      // Don't throw - moderation succeeded, ELO update is secondary
    }
  } catch (error) {
    console.error(`❌ Failed to moderate review ${reviewId}:`, error);
    // On error, default to approved to avoid blocking user experience
    try {
      await updateReviewModeration(reviewId, "approved", {
        isOffensive: false,
        isAiGenerated: false,
        isRelevant: true,
        confidence: 0,
        reasoning: "Moderation failed - defaulted to approval",
      });
    } catch (updateError) {
      console.error("Failed to update review after moderation error:", updateError);
    }
  }
}
