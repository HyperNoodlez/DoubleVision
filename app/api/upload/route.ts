import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { put } from "@vercel/blob";
import { canUserUploadToday } from "@/lib/db/users";
import { createPhoto } from "@/lib/db/photos";
import { incrementPhotoCount } from "@/lib/db/users";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

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
    const filename = `${userId}-${timestamp}-${randomSuffix}.${fileExtension}`;

    let imageUrl: string;

    // Check if Vercel Blob is configured
    const useBlobStorage = !!process.env.BLOB_READ_WRITE_TOKEN;
    const isProduction = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';

    if (!useBlobStorage && isProduction) {
      // In production, Blob Storage is required (Vercel filesystem is read-only)
      console.error("❌ BLOB_READ_WRITE_TOKEN not configured in production");
      return NextResponse.json(
        {
          error: "Server configuration error: Image storage not configured. Please contact support.",
        },
        { status: 500 }
      );
    }

    if (useBlobStorage) {
      // Production: Upload to Vercel Blob Storage
      try {
        const blob = await put(`photos/${filename}`, file, {
          access: 'public',
          addRandomSuffix: false,
        });
        imageUrl = blob.url;
        console.log(`✅ Uploaded to Vercel Blob: ${blob.url}`);
      } catch (blobError) {
        console.error("❌ Vercel Blob upload failed:", blobError);
        return NextResponse.json(
          {
            error: "Failed to upload image to storage. Please try again.",
          },
          { status: 500 }
        );
      }
    } else {
      // Development: Save to local public folder
      console.log("⚠️ BLOB_READ_WRITE_TOKEN not found. Using local storage for development.");

      try {
        // Create public/uploads directory if it doesn't exist
        const uploadsDir = join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadsDir, { recursive: true });

        // Save file to public/uploads
        const filepath = join(uploadsDir, filename);
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        // Use local URL
        imageUrl = `/uploads/${filename}`;
        console.log(`📁 File saved locally: ${imageUrl}`);
      } catch (fsError) {
        console.error("❌ Local filesystem save failed:", fsError);
        return NextResponse.json(
          {
            error: "Failed to save image locally. Check server logs.",
          },
          { status: 500 }
        );
      }
    }

    // Save photo metadata to database
    let photo;
    try {
      photo = await createPhoto({
        userId,
        imageUrl,
      });
      console.log(`✅ Photo metadata saved to database: ${photo._id}`);
    } catch (dbError) {
      console.error("❌ Database error while creating photo:", dbError);
      return NextResponse.json(
        {
          error: "Failed to save photo metadata. Please try again.",
        },
        { status: 500 }
      );
    }

    // Increment user's photo count
    try {
      await incrementPhotoCount(userId);
      console.log(`✅ User photo count incremented for: ${userId}`);
    } catch (countError) {
      console.error("❌ Failed to increment photo count:", countError);
      // Don't fail the request if count increment fails
    }

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
