/**
 * Fix Review Counts Script
 *
 * This script updates all photos' reviewsReceived count based on
 * the actual number of approved reviews in the database.
 *
 * Usage: npx tsx scripts/fix-review-counts.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

import { getDb, COLLECTIONS } from "../lib/db/index";
import { ReviewDocument, PhotoDocument } from "../lib/types";

async function fixReviewCounts() {
  console.log("🔧 Starting review count fix...\n");

  try {
    const db = await getDb();
    const photosCollection = db.collection<PhotoDocument>(COLLECTIONS.PHOTOS);
    const reviewsCollection = db.collection<ReviewDocument>(COLLECTIONS.REVIEWS);

    // Get all photos
    const photos = await photosCollection.find({}).toArray();
    console.log(`📸 Found ${photos.length} photos\n`);

    let updatedCount = 0;

    for (const photo of photos) {
      // Count approved reviews for this photo
      const photoIdStr = photo._id.toString();
      const approvedReviewCount = await reviewsCollection.countDocuments({
        photoId: photoIdStr,
        moderationStatus: "approved",
      });

      // Calculate average score
      const reviews = await reviewsCollection
        .find({ photoId: photoIdStr, moderationStatus: "approved" })
        .toArray();

      const averageScore =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length
          : undefined;

      // Update photo if counts don't match
      if (photo.reviewsReceived !== approvedReviewCount || photo.averageScore !== averageScore) {
        await photosCollection.updateOne(
          { _id: photo._id },
          {
            $set: {
              reviewsReceived: approvedReviewCount,
              averageScore: averageScore,
            },
          }
        );

        console.log(
          `✅ Updated photo ${photoIdStr.slice(0, 8)}... | Reviews: ${photo.reviewsReceived} → ${approvedReviewCount} | Avg Score: ${photo.averageScore?.toFixed(1) || "N/A"} → ${averageScore?.toFixed(1) || "N/A"}`
        );
        updatedCount++;
      } else {
        console.log(
          `⏭️  Photo ${photoIdStr.slice(0, 8)}... already correct (${approvedReviewCount} reviews, ${averageScore?.toFixed(1) || "N/A"} avg)`
        );
      }
    }

    console.log(`\n✨ Done! Updated ${updatedCount} out of ${photos.length} photos`);
  } catch (error) {
    console.error("❌ Error fixing review counts:", error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the script
fixReviewCounts();
