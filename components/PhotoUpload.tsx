"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface PhotoUploadProps {
  disabled?: boolean;
  disabledReason?: string;
}

export default function PhotoUpload({
  disabled = false,
  disabledReason,
}: PhotoUploadProps) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a JPEG, PNG, or WebP image.");
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Maximum size is 10MB.");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) {
      setError("Please select a photo first.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("photo", fileInputRef.current.files[0]);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setSuccess(data.message || "Photo uploaded successfully!");
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Refresh the page to show updated stats
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">Upload Today&apos;s Photo</h2>

      {disabled && disabledReason && (
        <div className="mb-4 p-4 bg-absent border border-border rounded text-text-secondary text-sm">
          {disabledReason}
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-error/20 border border-error rounded text-error text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-correct/20 border border-correct rounded text-correct text-sm">
          {success}
        </div>
      )}

      {!preview ? (
        <div className="space-y-4">
          <div
            className={`border-2 border-dashed border-border rounded-lg p-8 text-center transition-colors ${
              disabled
                ? "bg-absent/10 cursor-not-allowed"
                : "hover:border-present cursor-pointer"
            }`}
            onClick={() => !disabled && fileInputRef.current?.click()}
          >
            <div className="text-4xl mb-2">📸</div>
            <p className="text-text-primary font-medium mb-1">
              {disabled ? "Upload Disabled" : "Click to select a photo"}
            </p>
            <p className="text-text-secondary text-sm">
              JPEG, PNG, or WebP (max 10MB)
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            disabled={disabled}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-lg overflow-hidden border border-border">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-auto max-h-96 object-contain bg-background"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? "Uploading..." : "Upload Photo"}
            </button>
            <button
              onClick={handleCancel}
              disabled={isUploading}
              className="px-6 py-3 bg-absent hover:bg-absent/80 text-white font-bold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isUploading && (
        <div className="mt-4">
          <div className="w-full bg-border rounded-full h-2 overflow-hidden">
            <div className="bg-present h-full animate-pulse" style={{ width: "100%" }}></div>
          </div>
          <p className="text-center text-text-secondary text-sm mt-2">
            Uploading your photo...
          </p>
        </div>
      )}
    </div>
  );
}
