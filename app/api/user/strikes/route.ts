import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserStrikes } from "@/lib/db/strikes";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const strikes = await getUserStrikes(session.user.id);

    return NextResponse.json(strikes);
  } catch (error) {
    console.error("Error fetching strikes:", error);
    return NextResponse.json(
      { error: "Failed to fetch strike information" },
      { status: 500 }
    );
  }
}
