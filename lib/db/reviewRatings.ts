import { getCollection, COLLECTIONS } from "./index";
import { ReviewRatingDocument, ReviewDocument, PhotoDocument } from "../types";
import { ObjectId } from "mongodb";

// Create review ratings (batch insert for all 5 reviews)
export async function createReviewRatings(
  ratings: Array<{
    reviewId: string;
    photoId: string;
    ratedBy: string;
    specificityScore: number;
    constructivenessScore: number;
    relevanceScore: number;
  }>
): Promise<ReviewRatingDocument[]> {
  const collection = await getCollection<ReviewRatingDocument>(COLLECTIONS.REVIEW_RATINGS);

  const ratingDocuments: Omit<ReviewRatingDocument, "_id">[] = ratings.map((rating) => {
    const overallQuality = (
      rating.specificityScore +
      rating.constructivenessScore +
      rating.relevanceScore
    ) / 3;

    return {
      reviewId: rating.reviewId,
      photoId: rating.photoId,
      ratedBy: rating.ratedBy,
      specificityScore: rating.specificityScore,
      constructivenessScore: rating.constructivenessScore,
      relevanceScore: rating.relevanceScore,
      overallQuality: overallQuality,
      createdAt: new Date(),
    };
  });

  const result = await collection.insertMany(ratingDocuments as any);

  return ratingDocuments.map((doc, index) => ({
    _id: result.insertedIds[index].toString(),
    ...doc,
  }));
}

// Check if user has already rated reviews for a photo
export async function hasUserRatedPhoto(userId: string, photoId: string): Promise<boolean> {
  const collection = await getCollection<ReviewRatingDocument>(COLLECTIONS.REVIEW_RATINGS);
  const count = await collection.countDocuments({
    ratedBy: userId,
    photoId,
  });
  return count > 0;
}

// Get rating count for a photo by user
export async function getUserRatingCountForPhoto(
  userId: string,
  photoId: string
): Promise<number> {
  const collection = await getCollection<ReviewRatingDocument>(COLLECTIONS.REVIEW_RATINGS);
  return await collection.countDocuments({
    ratedBy: userId,
    photoId,
  });
}

// Get all ratings for a photo
export async function getRatingsForPhoto(photoId: string): Promise<ReviewRatingDocument[]> {
  const collection = await getCollection<ReviewRatingDocument>(COLLECTIONS.REVIEW_RATINGS);
  return await collection.find({ photoId }).sort({ createdAt: -1 }).toArray();
}

// Get rating for a specific review
export async function getRatingForReview(
  reviewId: string,
  ratedBy: string
): Promise<ReviewRatingDocument | null> {
  const collection = await getCollection<ReviewRatingDocument>(COLLECTIONS.REVIEW_RATINGS);
  return await collection.findOne({ reviewId, ratedBy });
}

// Update review's helpfulness score (average)
export async function updateReviewHelpfulness(reviewId: string): Promise<void> {
  const ratingsCollection = await getCollection<ReviewRatingDocument>(
    COLLECTIONS.REVIEW_RATINGS
  );
  const reviewsCollection = await getCollection<ReviewDocument>(COLLECTIONS.REVIEWS);

  // Calculate average helpfulness score
  const ratings = await ratingsCollection.find({ reviewId }).toArray();

  if (ratings.length === 0) return;

  const averageScore =
    ratings.reduce((sum, r) => sum + r.overallQuality, 0) / ratings.length;

  // Try string match first
  let result = await reviewsCollection.updateOne(
    { _id: reviewId },
    {
      $set: {
        helpfulnessScore: averageScore,
        helpfulnessCount: ratings.length,
      },
    }
  );

  // If not found with string, try ObjectId
  if (result.matchedCount === 0 && ObjectId.isValid(reviewId)) {
    await reviewsCollection.updateOne(
      { _id: new ObjectId(reviewId) as any },
      {
        $set: {
          helpfulnessScore: averageScore,
          helpfulnessCount: ratings.length,
        },
      }
    );
  }
}

// Mark photo as all reviews rated
export async function markPhotoReviewsAsRated(photoId: string, count: number): Promise<void> {
  const collection = await getCollection<PhotoDocument>(COLLECTIONS.PHOTOS);

  // Try string match first
  let result = await collection.updateOne(
    { _id: photoId },
    {
      $set: {
        allReviewsRated: true,
        reviewsRatedCount: count,
      },
    }
  );

  // If not found with string, try ObjectId
  if (result.matchedCount === 0 && ObjectId.isValid(photoId)) {
    await collection.updateOne(
      { _id: new ObjectId(photoId) as any },
      {
        $set: {
          allReviewsRated: true,
          reviewsRatedCount: count,
        },
      }
    );
  }
}

// Check if photo has all reviews rated
export async function hasPhotoBeenRated(photoId: string): Promise<boolean> {
  const collection = await getCollection<PhotoDocument>(COLLECTIONS.PHOTOS);

  // Try string match first
  let photo = await collection.findOne({ _id: photoId });

  // If not found with string, try ObjectId
  if (!photo && ObjectId.isValid(photoId)) {
    photo = await collection.findOne({ _id: new ObjectId(photoId) as any });
  }

  return photo?.allReviewsRated === true;
}

// Get review ratings with reviewer information
export async function getReviewRatingsWithReviewers(
  photoId: string
): Promise<
  Array<{
    reviewId: string;
    reviewerId: string;
    specificityScore: number;
    constructivenessScore: number;
    relevanceScore: number;
    overallQuality: number;
    reviewScore: number;
    comment: string;
    wordCount: number;
    aiConfidence: number;
  }>
> {
  const ratingsCollection = await getCollection<ReviewRatingDocument>(
    COLLECTIONS.REVIEW_RATINGS
  );
  const reviewsCollection = await getCollection<ReviewDocument>(COLLECTIONS.REVIEWS);

  const ratings = await ratingsCollection.find({ photoId }).toArray();

  const result = await Promise.all(
    ratings.map(async (rating) => {
      // Try string match first
      let review = await reviewsCollection.findOne({ _id: rating.reviewId });

      // If not found with string, try ObjectId
      if (!review && ObjectId.isValid(rating.reviewId)) {
        review = await reviewsCollection.findOne({
          _id: new ObjectId(rating.reviewId) as any,
        });
      }

      if (!review) {
        throw new Error(`Review not found for rating: ${rating.reviewId}`);
      }

      return {
        reviewId: rating.reviewId,
        reviewerId: review.reviewerId,
        specificityScore: rating.specificityScore,
        constructivenessScore: rating.constructivenessScore,
        relevanceScore: rating.relevanceScore,
        overallQuality: rating.overallQuality,
        reviewScore: review.score,
        comment: review.comment,
        wordCount: review.wordCount,
        aiConfidence: review.aiAnalysis.confidence,
      };
    })
  );

  return result;
}
