import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getPendingAssignments,
  assignPhotosToReviewer,
  getUserAssignmentStats,
} from "@/lib/db/reviewAssignments";
import { getPhotoById } from "@/lib/db/photos";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get pending assignments
    let assignments = await getPendingAssignments(userId);

    // If no pending assignments, create new ones
    if (assignments.length === 0) {
      assignments = await assignPhotosToReviewer(userId, 5);

      // Check if we got any assignments
      if (assignments.length === 0) {
        return NextResponse.json(
          {
            assignments: [],
            message:
              "No photos available for review right now. Check back later!",
          },
          { status: 200 }
        );
      }
    }

    // Fetch full photo details for each assignment
    const photosWithDetails = await Promise.all(
      assignments.map(async (assignment) => {
        const photo = await getPhotoById(assignment.photoId);
        return {
          assignmentId: assignment._id,
          photoId: assignment.photoId,
          assignedAt: assignment.assignedAt,
          completed: assignment.completed,
          photo: photo
            ? {
                imageUrl: photo.imageUrl,
                uploadDate: photo.uploadDate,
                reviewsReceived: photo.reviewsReceived,
              }
            : null,
        };
      })
    );

    // Get assignment stats
    const stats = await getUserAssignmentStats(userId);

    return NextResponse.json(
      {
        success: true,
        assignments: photosWithDetails,
        stats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Assignment fetch error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch assignments. Please try again.",
      },
      { status: 500 }
    );
  }
}
