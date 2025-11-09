import { getCollection, COLLECTIONS } from "./index";
import { PhotoDocument } from "../types";

export interface PhotoAnalytics {
  latestPhotoScore: number | null;
  latestPhotoDate: Date | null;
  highestScoreThisMonth: number | null;
  highestScoreThisYear: number | null;
  highestScoreAllTime: number | null;
  averageScoreOverall: number | null;
  totalPhotos: number;
  totalReviewed: number;
}

export async function getUserPhotoAnalytics(userId: string): Promise<PhotoAnalytics> {
  const collection = await getCollection<PhotoDocument>(COLLECTIONS.PHOTOS);

  // Get all user's photos
  const allPhotos = await collection.find({ userId }).sort({ uploadDate: -1 }).toArray();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // Get latest photo
  const latestPhoto = allPhotos[0];

  // Get photos with scores only
  const reviewedPhotos = allPhotos.filter((p) => p.averageScore !== undefined);

  // Get photos this month
  const photosThisMonth = allPhotos.filter((p) => new Date(p.uploadDate) >= startOfMonth);
  const reviewedThisMonth = photosThisMonth.filter((p) => p.averageScore !== undefined);

  // Get photos this year
  const photosThisYear = allPhotos.filter((p) => new Date(p.uploadDate) >= startOfYear);
  const reviewedThisYear = photosThisYear.filter((p) => p.averageScore !== undefined);

  // Calculate analytics
  const analytics: PhotoAnalytics = {
    latestPhotoScore: latestPhoto?.averageScore || null,
    latestPhotoDate: latestPhoto?.uploadDate || null,
    highestScoreThisMonth:
      reviewedThisMonth.length > 0
        ? Math.max(...reviewedThisMonth.map((p) => p.averageScore!))
        : null,
    highestScoreThisYear:
      reviewedThisYear.length > 0
        ? Math.max(...reviewedThisYear.map((p) => p.averageScore!))
        : null,
    highestScoreAllTime:
      reviewedPhotos.length > 0 ? Math.max(...reviewedPhotos.map((p) => p.averageScore!)) : null,
    averageScoreOverall:
      reviewedPhotos.length > 0
        ? reviewedPhotos.reduce((sum, p) => sum + p.averageScore!, 0) / reviewedPhotos.length
        : null,
    totalPhotos: allPhotos.length,
    totalReviewed: reviewedPhotos.length,
  };

  return analytics;
}

export interface ScoreDistribution {
  excellent: number; // 90-100
  good: number; // 75-89
  average: number; // 60-74
  belowAverage: number; // 40-59
  poor: number; // 0-39
}

export async function getUserScoreDistribution(userId: string): Promise<ScoreDistribution> {
  const collection = await getCollection<PhotoDocument>(COLLECTIONS.PHOTOS);

  const reviewedPhotos = await collection
    .find({
      userId,
      averageScore: { $exists: true },
    })
    .toArray();

  const distribution: ScoreDistribution = {
    excellent: 0,
    good: 0,
    average: 0,
    belowAverage: 0,
    poor: 0,
  };

  reviewedPhotos.forEach((photo) => {
    const score = photo.averageScore!;
    if (score >= 90) distribution.excellent++;
    else if (score >= 75) distribution.good++;
    else if (score >= 60) distribution.average++;
    else if (score >= 40) distribution.belowAverage++;
    else distribution.poor++;
  });

  return distribution;
}
