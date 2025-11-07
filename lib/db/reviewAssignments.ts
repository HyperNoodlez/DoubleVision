import { ObjectId } from "mongodb";
import { getCollection, COLLECTIONS } from "./index";
import { ReviewAssignmentDocument } from "../types";
import { getPhotosNeedingReview } from "./photos";

// Assign photos to a user for review
export async function assignPhotosToReviewer(
  userId: string,
  count: number = 5
): Promise<ReviewAssignmentDocument[]> {
  const collection = await getCollection<ReviewAssignmentDocument>(
    COLLECTIONS.REVIEW_ASSIGNMENTS
  );

  // Get random photos that need review (excluding user's own photos)
  const photos = await getPhotosNeedingReview(userId, count);

  if (photos.length === 0) {
    return [];
  }

  const assignments: Omit<ReviewAssignmentDocument, "_id">[] = photos.map((photo) => ({
    userId,
    photoId: photo._id,
    completed: false,
    assignedAt: new Date(),
  }));

  const result = await collection.insertMany(assignments as any);

  return assignments.map((assignment, index) => ({
    _id: result.insertedIds[index].toString(),
    ...assignment,
  }));
}

// Get all assignments for a user
export async function getAssignmentsForUser(
  userId: string,
  includeCompleted: boolean = false
): Promise<ReviewAssignmentDocument[]> {
  const collection = await getCollection<ReviewAssignmentDocument>(
    COLLECTIONS.REVIEW_ASSIGNMENTS
  );

  const query: any = { userId };
  if (!includeCompleted) {
    query.completed = false;
  }

  return await collection
    .find(query)
    .sort({ assignedAt: -1 })
    .toArray();
}

// Get pending (incomplete) assignments for a user
export async function getPendingAssignments(userId: string): Promise<ReviewAssignmentDocument[]> {
  const collection = await getCollection<ReviewAssignmentDocument>(
    COLLECTIONS.REVIEW_ASSIGNMENTS
  );

  return await collection
    .find({
      userId,
      completed: false,
    })
    .sort({ assignedAt: 1 })
    .toArray();
}

// Mark assignment as completed
export async function markAssignmentComplete(
  userId: string,
  photoId: string
): Promise<void> {
  const collection = await getCollection<ReviewAssignmentDocument>(
    COLLECTIONS.REVIEW_ASSIGNMENTS
  );

  // Try to update with string photoId first
  let result = await collection.updateOne(
    { userId, photoId, completed: false },
    {
      $set: {
        completed: true,
        completedAt: new Date(),
      },
    }
  );

  // If no document was updated and photoId is valid ObjectId, try with ObjectId
  if (result.matchedCount === 0 && ObjectId.isValid(photoId)) {
    await collection.updateOne(
      { userId, photoId: new ObjectId(photoId) as any, completed: false },
      {
        $set: {
          completed: true,
          completedAt: new Date(),
        },
      }
    );
  }
}

// Check if user has completed all assigned reviews (5 reviews)
export async function hasUserCompletedAllReviews(userId: string): Promise<boolean> {
  const collection = await getCollection<ReviewAssignmentDocument>(
    COLLECTIONS.REVIEW_ASSIGNMENTS
  );

  // Get today's assignments
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const assignments = await collection
    .find({
      userId,
      assignedAt: { $gte: todayStart },
    })
    .toArray();

  // Check if user has 5 assignments and all are completed
  return assignments.length >= 5 && assignments.every((a) => a.completed);
}

// Check if user has completed minimum required reviews (5)
export async function hasCompletedMinimumReviews(userId: string): Promise<boolean> {
  const collection = await getCollection<ReviewAssignmentDocument>(
    COLLECTIONS.REVIEW_ASSIGNMENTS
  );

  const completedCount = await collection.countDocuments({
    userId,
    completed: true,
  });

  return completedCount >= 5;
}

// Get count of completed reviews for today
export async function getTodayCompletedReviewCount(userId: string): Promise<number> {
  const collection = await getCollection<ReviewAssignmentDocument>(
    COLLECTIONS.REVIEW_ASSIGNMENTS
  );

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  return await collection.countDocuments({
    userId,
    completed: true,
    completedAt: { $gte: todayStart },
  });
}

// Get assignment by user and photo ID
export async function getAssignment(
  userId: string,
  photoId: string
): Promise<ReviewAssignmentDocument | null> {
  const collection = await getCollection<ReviewAssignmentDocument>(
    COLLECTIONS.REVIEW_ASSIGNMENTS
  );

  // Try both string comparison and ObjectId comparison
  let assignment = await collection.findOne({ userId, photoId });

  // If not found with string comparison, try with ObjectId
  if (!assignment && ObjectId.isValid(photoId)) {
    assignment = await collection.findOne({
      userId,
      photoId: new ObjectId(photoId) as any
    });
  }

  return assignment;
}

// Check if photo is assigned to user
export async function isPhotoAssignedToUser(
  userId: string,
  photoId: string
): Promise<boolean> {
  const collection = await getCollection<ReviewAssignmentDocument>(
    COLLECTIONS.REVIEW_ASSIGNMENTS
  );

  // Try both string comparison and ObjectId comparison
  // MongoDB might store photoId as ObjectId or string depending on how it was inserted
  let assignment = await collection.findOne({ userId, photoId });

  // If not found with string comparison, try with ObjectId
  if (!assignment && ObjectId.isValid(photoId)) {
    assignment = await collection.findOne({
      userId,
      photoId: new ObjectId(photoId) as any
    });
  }

  return !!assignment;
}

// Get assignment statistics for user
export async function getUserAssignmentStats(userId: string): Promise<{
  totalAssigned: number;
  completed: number;
  pending: number;
  completionRate: number;
}> {
  const collection = await getCollection<ReviewAssignmentDocument>(
    COLLECTIONS.REVIEW_ASSIGNMENTS
  );

  const stats = await collection
    .aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalAssigned: { $sum: 1 },
          completed: {
            $sum: { $cond: ["$completed", 1, 0] },
          },
          pending: {
            $sum: { $cond: ["$completed", 0, 1] },
          },
        },
      },
    ])
    .toArray();

  if (stats.length === 0) {
    return {
      totalAssigned: 0,
      completed: 0,
      pending: 0,
      completionRate: 0,
    };
  }

  const { totalAssigned, completed, pending } = stats[0];
  const completionRate = totalAssigned > 0 ? (completed / totalAssigned) * 100 : 0;

  return {
    totalAssigned,
    completed,
    pending,
    completionRate,
  };
}

// Clear old incomplete assignments (optional cleanup function)
export async function clearOldIncompleteAssignments(daysOld: number = 7): Promise<number> {
  const collection = await getCollection<ReviewAssignmentDocument>(
    COLLECTIONS.REVIEW_ASSIGNMENTS
  );

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await collection.deleteMany({
    completed: false,
    assignedAt: { $lt: cutoffDate },
  });

  return result.deletedCount;
}
