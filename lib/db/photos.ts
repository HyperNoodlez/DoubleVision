import { ObjectId } from "mongodb";
import { getCollection, COLLECTIONS } from "./index";
import { PhotoDocument } from "../types";

// Create new photo
export async function createPhoto(data: {
  userId: string;
  imageUrl: string;
}): Promise<PhotoDocument> {
  const collection = await getCollection<PhotoDocument>(COLLECTIONS.PHOTOS);

  const photoData: Omit<PhotoDocument, "_id"> = {
    userId: data.userId,
    imageUrl: data.imageUrl,
    uploadDate: new Date(),
    reviewsReceived: 0,
    status: "pending",
  };

  const result = await collection.insertOne(photoData as any);

  return {
    _id: result.insertedId.toString(),
    ...photoData,
  };
}

// Get photo by ID
export async function getPhotoById(photoId: string): Promise<PhotoDocument | null> {
  const collection = await getCollection<PhotoDocument>(COLLECTIONS.PHOTOS);
  return await collection.findOne({ _id: photoId });
}

// Get all photos by user
export async function getPhotosByUser(
  userId: string,
  limit: number = 10
): Promise<PhotoDocument[]> {
  const collection = await getCollection<PhotoDocument>(COLLECTIONS.PHOTOS);
  return await collection
    .find({ userId })
    .sort({ uploadDate: -1 })
    .limit(limit)
    .toArray();
}

// Get random photos needing review (excluding user's own photos)
export async function getPhotosNeedingReview(
  excludeUserId: string,
  count: number = 5
): Promise<PhotoDocument[]> {
  const collection = await getCollection<PhotoDocument>(COLLECTIONS.PHOTOS);

  // Get photos that need reviews (less than 5 reviews received)
  // Exclude the user's own photos
  const photos = await collection
    .aggregate([
      {
        $match: {
          userId: { $ne: excludeUserId },
          reviewsReceived: { $lt: 5 },
          status: "pending",
        },
      },
      { $sample: { size: count } },
    ])
    .toArray();

  return photos as PhotoDocument[];
}

// Update photo status
export async function updatePhotoStatus(
  photoId: string,
  status: "pending" | "reviewed" | "archived"
): Promise<void> {
  const collection = await getCollection<PhotoDocument>(COLLECTIONS.PHOTOS);
  await collection.updateOne(
    { _id: photoId },
    { $set: { status } }
  );
}

// Increment review count for a photo
export async function incrementPhotoReviewCount(photoId: string): Promise<void> {
  const collection = await getCollection<PhotoDocument>(COLLECTIONS.PHOTOS);
  await collection.updateOne(
    { _id: photoId },
    { $inc: { reviewsReceived: 1 } }
  );
}

// Update average score for a photo
export async function updatePhotoAverageScore(
  photoId: string,
  averageScore: number
): Promise<void> {
  const collection = await getCollection<PhotoDocument>(COLLECTIONS.PHOTOS);
  await collection.updateOne(
    { _id: photoId },
    { $set: { averageScore } }
  );
}

// Get user's most recent photo
export async function getUserLatestPhoto(userId: string): Promise<PhotoDocument | null> {
  const collection = await getCollection<PhotoDocument>(COLLECTIONS.PHOTOS);
  return await collection.findOne(
    { userId },
    { sort: { uploadDate: -1 } }
  );
}

// Check if photo has received minimum reviews (5)
export async function hasPhotoReceivedMinimumReviews(photoId: string): Promise<boolean> {
  const collection = await getCollection<PhotoDocument>(COLLECTIONS.PHOTOS);
  const photo = await collection.findOne({ _id: photoId });
  return photo ? photo.reviewsReceived >= 5 : false;
}

// Get photos with status and review count
export async function getPhotoStats(photoId: string): Promise<{
  reviewsReceived: number;
  averageScore?: number;
  status: string;
} | null> {
  const collection = await getCollection<PhotoDocument>(COLLECTIONS.PHOTOS);
  const photo = await collection.findOne(
    { _id: photoId },
    {
      projection: {
        reviewsReceived: 1,
        averageScore: 1,
        status: 1,
      },
    }
  );

  return photo ? {
    reviewsReceived: photo.reviewsReceived,
    averageScore: photo.averageScore,
    status: photo.status,
  } : null;
}

// Get all photos by user with pagination
export async function getUserPhotosWithPagination(
  userId: string,
  page: number = 1,
  limit: number = 12
): Promise<{
  photos: PhotoDocument[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const collection = await getCollection<PhotoDocument>(COLLECTIONS.PHOTOS);

  const skip = (page - 1) * limit;
  const total = await collection.countDocuments({ userId });

  const photos = await collection
    .find({ userId })
    .sort({ uploadDate: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  return {
    photos: photos as PhotoDocument[],
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

// Get user's latest photo with review statistics
export async function getUserLatestPhotoWithStats(userId: string): Promise<{
  photo: PhotoDocument;
  stats: {
    totalReviews: number;
    averageScore: number;
    ratingDistribution: { [key: number]: number };
  };
} | null> {
  const photo = await getUserLatestPhoto(userId);

  if (!photo) return null;

  // Import getReviewsByPhoto dynamically to avoid circular dependency
  const { getApprovedReviewsByPhoto } = await import("./reviews");
  const reviews = await getApprovedReviewsByPhoto(photo._id);

  // Calculate rating distribution
  const ratingDistribution: { [key: number]: number } = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  reviews.forEach((review) => {
    ratingDistribution[review.score]++;
  });

  const averageScore =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length
      : 0;

  return {
    photo,
    stats: {
      totalReviews: reviews.length,
      averageScore,
      ratingDistribution,
    },
  };
}

// Get photo with review statistics by photoId
export async function getPhotoWithStats(photoId: string): Promise<{
  photo: PhotoDocument;
  stats: {
    totalReviews: number;
    averageScore: number;
    ratingDistribution: { [key: number]: number };
  };
} | null> {
  const collection = await getCollection<PhotoDocument>(COLLECTIONS.PHOTOS);
  const photo = await collection.findOne({ _id: photoId });

  if (!photo) return null;

  // Import getReviewsByPhoto dynamically to avoid circular dependency
  const { getApprovedReviewsByPhoto } = await import("./reviews");
  const reviews = await getApprovedReviewsByPhoto(photoId);

  // Calculate rating distribution
  const ratingDistribution: { [key: number]: number } = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  reviews.forEach((review) => {
    ratingDistribution[review.score]++;
  });

  const averageScore =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length
      : 0;

  return {
    photo: photo as PhotoDocument,
    stats: {
      totalReviews: reviews.length,
      averageScore,
      ratingDistribution,
    },
  };
}
