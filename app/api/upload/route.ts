import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { put } from "@vercel/blob";
import { canUserUploadToday } from "@/lib/db/users";
import { hasCompletedMinimumReviews } from "@/lib/db/reviewAssignments";
import { createPhoto } from "@/lib/db/photos";
import { incrementPhotoCount } from "@/lib/db/users";

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed image types
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export async function POST(request: NextRequest) {
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

    // Check if user can upload today (1 photo per day limit)
    const canUpload = await canUserUploadToday(userId);
    if (!canUpload) {
      return NextResponse.json(
        {
          error: "You've already uploaded a photo today. Come back tomorrow!",
        },
        { status: 403 }
      );
    }

    // Check if user has completed 5 reviews
    const hasCompletedReviews = await hasCompletedMinimumReviews(userId);
    if (!hasCompletedReviews) {
      return NextResponse.json(
        {
          error:
            "You must complete 5 photo reviews before uploading your own photo.",
        },
        { status: 403 }
      );
    }

    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get("photo") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No photo provided." },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Please upload a JPEG, PNG, or WebP image.",
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    const fileExtension = file.name.split('.').pop();
    const filename = `photos/${userId}-${timestamp}-${randomSuffix}.${fileExtension}`;

    // Upload to Vercel Blob Storage
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    // Use the Vercel Blob URL
    const imageUrl = blob.url;

    // Save photo metadata to database
    const photo = await createPhoto({
      userId,
      imageUrl,
    });

    // Increment user's photo count
    await incrementPhotoCount(userId);

    return NextResponse.json(
      {
        success: true,
        photo: {
          id: photo._id,
          imageUrl: photo.imageUrl,
          uploadDate: photo.uploadDate,
        },
        message: "Photo uploaded successfully! 📸",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error: "Failed to upload photo. Please try again.",
      },
      { status: 500 }
    );
  }
}
