import { ObjectId } from "mongodb";
import { getCollection, COLLECTIONS } from "./index";
import { ReviewDocument } from "../types";

// Create new review
export async function createReview(data: {
  photoId: string;
  reviewerId: string;
  score: number;
  comment: string;
}): Promise<ReviewDocument> {
  const collection = await getCollection<ReviewDocument>(COLLECTIONS.REVIEWS);

  // Calculate word count
  const wordCount = data.comment.trim().split(/\s+/).length;

  const reviewData: Omit<ReviewDocument, "_id"> = {
    photoId: data.photoId,
    reviewerId: data.reviewerId,
    score: data.score,
    comment: data.comment,
    wordCount,
    moderationStatus: "pending",
    aiAnalysis: {
      isOffensive: false,
      isAiGenerated: false,
      isRelevant: false,
      confidence: 0,
      reasoning: "",
    },
    createdAt: new Date(),
  };

  const result = await collection.insertOne(reviewData as any);

  return {
    _id: result.insertedId.toString(),
    ...reviewData,
  };
}

// Get review by ID
export async function getReviewById(reviewId: string): Promise<ReviewDocument | null> {
  const collection = await getCollection<ReviewDocument>(COLLECTIONS.REVIEWS);
  return await collection.findOne({ _id: reviewId });
}

// Get all reviews for a photo
export async function getReviewsByPhoto(photoId: string): Promise<ReviewDocument[]> {
  const collection = await getCollection<ReviewDocument>(COLLECTIONS.REVIEWS);
  return await collection
    .find({ photoId })
    .sort({ createdAt: -1 })
    .toArray();
}

// Get approved reviews for a photo (for display to photo owner)
export async function getApprovedReviewsByPhoto(photoId: string): Promise<ReviewDocument[]> {
  const collection = await getCollection<ReviewDocument>(COLLECTIONS.REVIEWS);
  return await collection
    .find({
      photoId,
      moderationStatus: "approved",
    })
    .sort({ createdAt: -1 })
    .toArray();
}

// Get all reviews by a reviewer
export async function getReviewsByReviewer(
  reviewerId: string,
  limit: number = 20
): Promise<ReviewDocument[]> {
  const collection = await getCollection<ReviewDocument>(COLLECTIONS.REVIEWS);
  return await collection
    .find({ reviewerId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}

// Get pending reviews (awaiting AI moderation)
export async function getPendingReviews(limit: number = 50): Promise<ReviewDocument[]> {
  const collection = await getCollection<ReviewDocument>(COLLECTIONS.REVIEWS);
  return await collection
    .find({ moderationStatus: "pending" })
    .sort({ createdAt: 1 })
    .limit(limit)
    .toArray();
}

// Update moderation status and AI analysis
export async function updateReviewModeration(
  reviewId: string,
  moderationStatus: "pending" | "approved" | "rejected",
  aiAnalysis: {
    isOffensive: boolean;
    isAiGenerated: boolean;
    isRelevant: boolean;
    confidence: number;
    reasoning: string;
  }
): Promise<void> {
  const collection = await getCollection<ReviewDocument>(COLLECTIONS.REVIEWS);
  await collection.updateOne(
    { _id: reviewId },
    {
      $set: {
        moderationStatus,
        aiAnalysis,
      },
    }
  );
}

// Check if reviewer has already reviewed a photo
export async function hasReviewerReviewedPhoto(
  reviewerId: string,
  photoId: string
): Promise<boolean> {
  const collection = await getCollection<ReviewDocument>(COLLECTIONS.REVIEWS);
  const review = await collection.findOne({ reviewerId, photoId });
  return !!review;
}

// Get average score for a photo (only approved reviews)
export async function getPhotoAverageScore(photoId: string): Promise<number | null> {
  const collection = await getCollection<ReviewDocument>(COLLECTIONS.REVIEWS);

  const result = await collection
    .aggregate([
      {
        $match: {
          photoId,
          moderationStatus: "approved",
        },
      },
      {
        $group: {
          _id: null,
          averageScore: { $avg: "$score" },
        },
      },
    ])
    .toArray();

  return result.length > 0 ? result[0].averageScore : null;
}

// Get count of approved reviews for a photo
export async function getApprovedReviewCount(photoId: string): Promise<number> {
  const collection = await getCollection<ReviewDocument>(COLLECTIONS.REVIEWS);
  return await collection.countDocuments({
    photoId,
    moderationStatus: "approved",
  });
}

// Get reviewer's statistics (for ELO calculation)
export async function getReviewerStats(reviewerId: string): Promise<{
  totalReviews: number;
  approvedReviews: number;
  rejectedReviews: number;
  averageWordCount: number;
}> {
  const collection = await getCollection<ReviewDocument>(COLLECTIONS.REVIEWS);

  const stats = await collection
    .aggregate([
      { $match: { reviewerId } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          approvedReviews: {
            $sum: { $cond: [{ $eq: ["$moderationStatus", "approved"] }, 1, 0] },
          },
          rejectedReviews: {
            $sum: { $cond: [{ $eq: ["$moderationStatus", "rejected"] }, 1, 0] },
          },
          averageWordCount: { $avg: "$wordCount" },
        },
      },
    ])
    .toArray();

  return stats.length > 0
    ? (stats[0] as {
        totalReviews: number;
        approvedReviews: number;
        rejectedReviews: number;
        averageWordCount: number;
      })
    : {
        totalReviews: 0,
        approvedReviews: 0,
        rejectedReviews: 0,
        averageWordCount: 0,
      };
}

// Get recent rejected reviews for moderation dashboard
export async function getRecentRejectedReviews(limit: number = 10): Promise<ReviewDocument[]> {
  const collection = await getCollection<ReviewDocument>(COLLECTIONS.REVIEWS);

  return await collection
    .find({ moderationStatus: "rejected" })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray() as ReviewDocument[];
}

// Get moderation statistics
export async function getModerationStatistics(): Promise<{
  totalReviews: number;
  approved: number;
  rejected: number;
  pending: number;
  rejectionRate: number;
  avgConfidence: number;
  byReason: {
    offensive: number;
    irrelevant: number;
    aiGenerated: number;
  };
}> {
  const collection = await getCollection<ReviewDocument>(COLLECTIONS.REVIEWS);

  const stats = await collection
    .aggregate([
      {
        $facet: {
          statusCounts: [
            {
              $group: {
                _id: "$moderationStatus",
                count: { $sum: 1 },
              },
            },
          ],
          averageConfidence: [
            {
              $group: {
                _id: null,
                avgConfidence: { $avg: "$aiAnalysis.confidence" },
              },
            },
          ],
          reasonCounts: [
            {
              $match: { moderationStatus: "rejected" },
            },
            {
              $group: {
                _id: null,
                offensive: {
                  $sum: { $cond: [{ $eq: ["$aiAnalysis.isOffensive", true] }, 1, 0] },
                },
                irrelevant: {
                  $sum: {
                    $cond: [{ $eq: ["$aiAnalysis.isRelevant", false] }, 1, 0],
                  },
                },
                aiGenerated: {
                  $sum: {
                    $cond: [{ $eq: ["$aiAnalysis.isAiGenerated", true] }, 1, 0],
                  },
                },
              },
            },
          ],
        },
      },
    ])
    .toArray();

  const result = stats[0] as any;

  const statusMap = new Map<string, number>(
    result.statusCounts.map((s: any) => [s._id, s.count])
  );

  const totalReviews = Array.from(statusMap.values() as IterableIterator<number>).reduce(
    (a, b) => a + b,
    0
  );
  const approved = statusMap.get("approved") || 0;
  const rejected = statusMap.get("rejected") || 0;
  const pending = statusMap.get("pending") || 0;

  const reasons = result.reasonCounts[0] || {
    offensive: 0,
    irrelevant: 0,
    aiGenerated: 0,
  };

  return {
    totalReviews,
    approved,
    rejected,
    pending,
    rejectionRate: totalReviews > 0 ? (rejected / totalReviews) * 100 : 0,
    avgConfidence: result.averageConfidence[0]?.avgConfidence || 0,
    byReason: {
      offensive: reasons.offensive,
      irrelevant: reasons.irrelevant,
      aiGenerated: reasons.aiGenerated,
    },
  };
}
