import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserStats } from "@/lib/db/users";

export async function GET() {
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

    // Fetch user stats
    const stats = await getUserStats(userId);

    if (!stats) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      eloRating: stats.eloRating,
      totalReviews: stats.totalReviews,
      photoCount: stats.photoCount,
      joinedAt: stats.joinedAt,
    });
  } catch (error) {
    console.error("User stats fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user stats." },
      { status: 500 }
    );
  }
}
