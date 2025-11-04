import { ObjectId } from "mongodb";
import { getCollection, COLLECTIONS } from "./index";
import { UserDocument } from "../types";

// Create or update user with ELO rating
export async function createOrUpdateUser(data: {
  id: string;
  email: string;
  name: string;
  image?: string;
  provider: "google" | "github";
}): Promise<UserDocument> {
  const collection = await getCollection<UserDocument>(COLLECTIONS.USERS);

  const now = new Date();
  const userData: Partial<UserDocument> = {
    email: data.email,
    name: data.name,
    image: data.image,
    provider: data.provider,
  };

  const result = await collection.findOneAndUpdate(
    { email: data.email },
    {
      $set: userData,
      $setOnInsert: {
        _id: data.id,
        eloRating: 1000, // Starting ELO rating
        totalReviews: 0,
        photoCount: 0,
        joinedAt: now,
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  return result!;
}

// Get user by ID
export async function getUserById(userId: string): Promise<UserDocument | null> {
  const collection = await getCollection<UserDocument>(COLLECTIONS.USERS);
  return await collection.findOne({ _id: userId });
}

// Get user by email
export async function getUserByEmail(email: string): Promise<UserDocument | null> {
  const collection = await getCollection<UserDocument>(COLLECTIONS.USERS);
  return await collection.findOne({ email });
}

// Update user ELO rating
export async function updateUserElo(
  userId: string,
  newRating: number
): Promise<void> {
  const collection = await getCollection<UserDocument>(COLLECTIONS.USERS);
  await collection.updateOne(
    { _id: userId },
    { $set: { eloRating: newRating } }
  );
}

// Increment user review count
export async function incrementReviewCount(userId: string): Promise<void> {
  const collection = await getCollection<UserDocument>(COLLECTIONS.USERS);
  await collection.updateOne(
    { _id: userId },
    { $inc: { totalReviews: 1 } }
  );
}

// Increment user photo count and update last upload date
export async function incrementPhotoCount(userId: string): Promise<void> {
  const collection = await getCollection<UserDocument>(COLLECTIONS.USERS);
  await collection.updateOne(
    { _id: userId },
    {
      $inc: { photoCount: 1 },
      $set: { lastUpload: new Date() },
    }
  );
}

// Check if user can upload today (hasn't uploaded yet)
export async function canUserUploadToday(userId: string): Promise<boolean> {
  const collection = await getCollection<UserDocument>(COLLECTIONS.USERS);
  const user = await collection.findOne({ _id: userId });

  if (!user || !user.lastUpload) return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastUpload = new Date(user.lastUpload);
  lastUpload.setHours(0, 0, 0, 0);

  return today > lastUpload;
}

// Get top users by ELO rating (leaderboard)
export async function getTopUsersByElo(limit: number = 10): Promise<UserDocument[]> {
  const collection = await getCollection<UserDocument>(COLLECTIONS.USERS);
  return await collection
    .find({})
    .sort({ eloRating: -1 })
    .limit(limit)
    .toArray();
}

// Get user stats
export async function getUserStats(userId: string): Promise<{
  eloRating: number;
  totalReviews: number;
  photoCount: number;
  joinedAt: Date;
} | null> {
  const collection = await getCollection<UserDocument>(COLLECTIONS.USERS);
  const user = await collection.findOne(
    { _id: userId },
    {
      projection: {
        eloRating: 1,
        totalReviews: 1,
        photoCount: 1,
        joinedAt: 1,
      },
    }
  );

  return user ? {
    eloRating: user.eloRating,
    totalReviews: user.totalReviews,
    photoCount: user.photoCount,
    joinedAt: user.joinedAt,
  } : null;
}
