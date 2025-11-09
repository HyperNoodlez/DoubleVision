import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPhotoById } from "@/lib/db/photos";
import { getApprovedReviewsByPhoto } from "@/lib/db/reviews";
import {
  createReviewRatings,
  hasUserRatedPhoto,
  updateReviewHelpfulness,
  markPhotoReviewsAsRated,
  getReviewRatingsWithReviewers,
} from "@/lib/db/reviewRatings";
import { getUserById, updateUserElo } from "@/lib/db/users";

/**
 * POST /api/rate-reviews
 * Submit ratings for all 5 reviews on a photo
 *
 * Request body:
 * {
 *   photoId: string;
 *   ratings: Array<{
 *     reviewId: string;
 *     specificityScore: number;       // 1-5: How detailed
 *     constructivenessScore: number;  // 1-5: How actionable
 *     relevanceScore: number;         // 1-5: How relevant
 *   }>;
 * }
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { photoId, ratings } = body;

    // Validate input
    if (!photoId || !ratings || !Array.isArray(ratings)) {
      return NextResponse.json(
        { error: "Missing photoId or ratings array" },
        { status: 400 }
      );
    }

    // Validate exactly 5 ratings
    if (ratings.length !== 5) {
      return NextResponse.json(
        { error: "Must rate all 5 reviews" },
        { status: 400 }
      );
    }

    // Validate each rating
    for (const rating of ratings) {
      if (
        !rating.reviewId ||
        typeof rating.specificityScore !== "number" ||
        typeof rating.constructivenessScore !== "number" ||
        typeof rating.relevanceScore !== "number"
      ) {
        return NextResponse.json(
          { error: "Invalid rating format" },
          { status: 400 }
        );
      }

      // Validate all scores are 1-5
      const scores = [
        rating.specificityScore,
        rating.constructivenessScore,
        rating.relevanceScore,
      ];

      for (const score of scores) {
        if (score < 1 || score > 5) {
          return NextResponse.json(
            { error: "All scores must be between 1 and 5" },
            { status: 400 }
          );
        }
      }
    }

    // Check photo exists and belongs to user
    const photo = await getPhotoById(photoId);
    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    if (photo.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only rate reviews on your own photos" },
        { status: 403 }
      );
    }

    // Check photo has exactly 5 approved reviews
    const reviews = await getApprovedReviewsByPhoto(photoId);
    if (reviews.length !== 5) {
      return NextResponse.json(
        { error: "Photo must have exactly 5 approved reviews to rate" },
        { status: 400 }
      );
    }

    // Check user hasn't already rated this photo's reviews
    const alreadyRated = await hasUserRatedPhoto(session.user.id, photoId);
    if (alreadyRated) {
      return NextResponse.json(
        { error: "You have already rated reviews for this photo" },
        { status: 400 }
      );
    }

    // Verify all reviewIds match the photo's approved reviews
    // Convert all to strings for comparison
    const reviewIds = reviews.map((r) => r._id.toString());
    const submittedReviewIds = ratings.map((r) => r.reviewId);
    const allMatch = submittedReviewIds.every((id) => reviewIds.includes(id));
    if (!allMatch) {
      console.error("Review ID mismatch:", {
        reviewIds,
        submittedReviewIds,
      });
      return NextResponse.json(
        { error: "Review IDs do not match photo's reviews" },
        { status: 400 }
      );
    }

    // Create all review ratings with multi-dimensional scores
    const ratingDocuments = ratings.map((rating) => ({
      reviewId: rating.reviewId,
      photoId: photoId,
      ratedBy: session.user.id,
      specificityScore: rating.specificityScore,
      constructivenessScore: rating.constructivenessScore,
      relevanceScore: rating.relevanceScore,
    }));

    await createReviewRatings(ratingDocuments);

    // Update helpfulness scores for each review
    for (const rating of ratings) {
      await updateReviewHelpfulness(rating.reviewId);
    }

    // Calculate ELO changes for each reviewer based on overall quality
    // Formula: ELO change = (overallQuality - 3) * 15
    // This means: 5.0 avg = +30, 4.0 avg = +15, 3.0 avg = 0, 2.0 avg = -15, 1.0 avg = -30
    const eloChanges: Record<string, number> = {};

    for (const rating of ratings) {
      const review = reviews.find((r) => r._id === rating.reviewId);
      if (!review) continue;

      const reviewerId = review.reviewerId;

      // Calculate overall quality (average of the three dimensions)
      const overallQuality = (
        rating.specificityScore +
        rating.constructivenessScore +
        rating.relevanceScore
      ) / 3;

      // ELO change scales from -30 to +30 based on quality
      const eloChange = Math.round((overallQuality - 3) * 15);

      if (!eloChanges[reviewerId]) {
        eloChanges[reviewerId] = 0;
      }
      eloChanges[reviewerId] += eloChange;
    }

    // Apply ELO changes to all reviewers
    for (const [reviewerId, eloChange] of Object.entries(eloChanges)) {
      const reviewer = await getUserById(reviewerId);
      if (reviewer) {
        const newElo = reviewer.eloRating + eloChange;
        await updateUserElo(reviewerId, newElo);
      }
    }

    // Mark photo as all reviews rated
    await markPhotoReviewsAsRated(photoId, 5);

    // Get detailed reviewer information to return
    const reviewRatingsWithReviewers = await getReviewRatingsWithReviewers(photoId);

    const reviewerData = await Promise.all(
      reviewRatingsWithReviewers.map(async (ratingData) => {
        const reviewer = await getUserById(ratingData.reviewerId);
        return {
          reviewerId: ratingData.reviewerId,
          name: reviewer?.name || "Unknown",
          image: reviewer?.image,
          eloRating: reviewer?.eloRating || 1000,
          eloChange: eloChanges[ratingData.reviewerId] || 0,
          specificityScore: ratingData.specificityScore,
          constructivenessScore: ratingData.constructivenessScore,
          relevanceScore: ratingData.relevanceScore,
          overallQuality: ratingData.overallQuality,
          reviewScore: ratingData.reviewScore,
          comment: ratingData.comment,
          wordCount: ratingData.wordCount,
          aiConfidence: ratingData.aiConfidence,
        };
      })
    );

    return NextResponse.json(
      {
        success: true,
        reviewers: reviewerData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Rate reviews error:", error);
    return NextResponse.json(
      { error: "Failed to submit review ratings" },
      { status: 500 }
    );
  }
}
