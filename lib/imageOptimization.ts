/**
 * Image Optimization Utilities
 *
 * Provides utilities for optimizing images before upload and display.
 */

/**
 * Image optimization configuration
 */
export const IMAGE_CONFIG = {
  // Maximum dimensions for uploaded photos
  MAX_WIDTH: 2048,
  MAX_HEIGHT: 2048,

  // Thumbnail dimensions
  THUMBNAIL_WIDTH: 400,
  THUMBNAIL_HEIGHT: 400,

  // Quality settings (0-100)
  UPLOAD_QUALITY: 85,
  THUMBNAIL_QUALITY: 80,

  // Allowed formats
  ALLOWED_FORMATS: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const,

  // Maximum file size (10MB)
  MAX_FILE_SIZE: 10 * 1024 * 1024,
} as const;

/**
 * Validate image file before upload
 */
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  // Check if file exists
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Check file type
  if (!IMAGE_CONFIG.ALLOWED_FORMATS.includes(file.type as any)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${IMAGE_CONFIG.ALLOWED_FORMATS.join(', ')}`,
    };
  }

  // Check file size
  if (file.size > IMAGE_CONFIG.MAX_FILE_SIZE) {
    const maxSizeMB = IMAGE_CONFIG.MAX_FILE_SIZE / (1024 * 1024);
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  // Check minimum size
  if (file.size < 1024) {
    return {
      valid: false,
      error: 'File is too small or corrupted',
    };
  }

  return { valid: true };
}

/**
 * Compress image before upload (client-side)
 * Returns a promise that resolves to a compressed File
 */
export async function compressImage(
  file: File,
  maxWidth: number = IMAGE_CONFIG.MAX_WIDTH,
  maxHeight: number = IMAGE_CONFIG.MAX_HEIGHT,
  quality: number = IMAGE_CONFIG.UPLOAD_QUALITY
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Draw image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // Create new file
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          file.type,
          quality / 100
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Get optimized image URL for Next.js Image component
 */
export function getOptimizedImageUrl(
  url: string,
  width?: number,
  quality?: number
): string {
  // For Vercel Blob Storage, images are already optimized
  // This function can be extended to add query parameters if needed
  return url;
}

/**
 * Generate srcset for responsive images
 */
export function generateSrcSet(url: string, widths: number[] = [400, 800, 1200, 1600]): string {
  return widths
    .map((width) => `${getOptimizedImageUrl(url, width)} ${width}w`)
    .join(', ');
}
