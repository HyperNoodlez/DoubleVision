import { Db, Collection, Document } from "mongodb";
import clientPromise from "../mongodb";

// Database and collection names
export const DB_NAME = "doublevision";
export const COLLECTIONS = {
  USERS: "users",
  PHOTOS: "photos",
  REVIEWS: "reviews",
  REVIEW_ASSIGNMENTS: "reviewAssignments",
  REVIEW_RATINGS: "reviewRatings",
} as const;

// Get database instance
export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(DB_NAME);
}

// Get specific collection
export async function getCollection<T extends Document = Document>(
  name: string
): Promise<Collection<T>> {
  const db = await getDb();
  return db.collection<T>(name);
}

// Initialize database indexes
export async function initializeIndexes(): Promise<void> {
  try {
    const db = await getDb();

    // Users collection indexes
    await db.collection(COLLECTIONS.USERS).createIndexes([
      { key: { email: 1 }, unique: true },
      { key: { eloRating: -1 } },
      { key: { totalReviews: -1 } },
      { key: { joinedAt: -1 } },
    ]);

    // Photos collection indexes
    await db.collection(COLLECTIONS.PHOTOS).createIndexes([
      { key: { userId: 1, uploadDate: -1 } },
      { key: { uploadDate: -1 } },
      { key: { status: 1 } },
      { key: { reviewsReceived: 1 } },
    ]);

    // Reviews collection indexes
    await db.collection(COLLECTIONS.REVIEWS).createIndexes([
      { key: { photoId: 1, createdAt: -1 } },
      { key: { reviewerId: 1, createdAt: -1 } },
      { key: { moderationStatus: 1, createdAt: -1 } },
      { key: { createdAt: -1 } },
      // Compound index for checking duplicates
      { key: { reviewerId: 1, photoId: 1 }, unique: true },
      // Index for moderation queries
      { key: { moderationStatus: 1, "aiAnalysis.confidence": -1 } },
    ]);

    // ReviewAssignments collection indexes
    await db.collection(COLLECTIONS.REVIEW_ASSIGNMENTS).createIndexes([
      { key: { userId: 1, completed: 1, assignedAt: -1 } },
      { key: { photoId: 1 } },
      { key: { assignedAt: -1 } },
      // Compound unique index to prevent duplicate assignments
      { key: { userId: 1, photoId: 1 }, unique: true },
    ]);

    // ReviewRatings collection indexes
    await db.collection(COLLECTIONS.REVIEW_RATINGS).createIndexes([
      { key: { reviewId: 1 } },
      { key: { photoId: 1 } },
      { key: { ratedBy: 1 } },
      { key: { createdAt: -1 } },
      // Compound unique index to prevent duplicate ratings
      { key: { reviewId: 1, ratedBy: 1 }, unique: true },
    ]);

    console.log("✅ Database indexes created successfully");
  } catch (error) {
    console.error("❌ Error creating indexes:", error);
    throw error;
  }
}

// Check if database is connected
export async function checkConnection(): Promise<boolean> {
  try {
    const client = await clientPromise;
    await client.db("admin").command({ ping: 1 });
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}
