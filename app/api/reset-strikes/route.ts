import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resetStrikes } from "@/lib/db/strikes";

export async function POST() {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        { error: "This endpoint is only available in development" },
        { status: 403 }
      );
    }

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await resetStrikes(session.user.id);

    return NextResponse.json({ message: "Strikes reset successfully" });
  } catch (error) {
    console.error("Error resetting strikes:", error);
    return NextResponse.json(
      { error: "Failed to reset strikes" },
      { status: 500 }
    );
  }
}
