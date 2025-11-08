import { NextResponse } from "next/server";
import { getDb, COLLECTIONS } from "@/lib/db/index";
import { ReviewDocument, PhotoDocument } from "@/lib/types";

/**
 * POST /api/fix-review-counts
 * Fix review counts for all photos based on actual approved reviews
 * Development only
 */
export async function POST() {
  try {
    // Only allow in development mode
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "This endpoint is only available in development mode" },
        { status: 403 }
      );
    }

    const db = await getDb();
    const photosCollection = db.collection<PhotoDocument>(COLLECTIONS.PHOTOS);
    const reviewsCollection = db.collection<ReviewDocument>(COLLECTIONS.REVIEWS);

    // Get all photos
    const photos = await photosCollection.find({}).toArray();
    console.log(`📸 Found ${photos.length} photos`);

    const updates = [];

    for (const photo of photos) {
      // Count approved reviews for this photo (try both string and ObjectId)
      const photoIdStr = photo._id.toString();
      const photoIdObj = photo._id;

      const approvedReviewCount = await reviewsCollection.countDocuments({
        $or: [
          { photoId: photoIdStr },
          { photoId: photoIdObj as any },
        ],
        moderationStatus: "approved",
      });

      // Calculate average score
      const reviews = await reviewsCollection
        .find({
          $or: [
            { photoId: photoIdStr },
            { photoId: photoIdObj as any },
          ],
          moderationStatus: "approved",
        })
        .toArray();

      const averageScore =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length
          : undefined;

      // Update photo if counts don't match
      if (
        photo.reviewsReceived !== approvedReviewCount ||
        photo.averageScore !== averageScore
      ) {
        await photosCollection.updateOne(
          { _id: photo._id },
          {
            $set: {
              reviewsReceived: approvedReviewCount,
              averageScore: averageScore,
            },
          }
        );

        const update = {
          photoId: photoIdStr.slice(0, 8) + "...",
          reviewsBefore: photo.reviewsReceived,
          reviewsAfter: approvedReviewCount,
          avgScoreBefore: photo.averageScore?.toFixed(1) || "N/A",
          avgScoreAfter: averageScore?.toFixed(1) || "N/A",
        };

        updates.push(update);
        console.log(
          `✅ Updated photo ${update.photoId} | Reviews: ${update.reviewsBefore} → ${update.reviewsAfter} | Avg: ${update.avgScoreBefore} → ${update.avgScoreAfter}`
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Fixed ${updates.length} out of ${photos.length} photos`,
        updates,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fix review counts error:", error);
    return NextResponse.json(
      { error: "Failed to fix review counts" },
      { status: 500 }
    );
  }
}
