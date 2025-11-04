/**
 * Rate Limiting Utilities
 *
 * Simple in-memory rate limiting for API routes.
 * For production, consider using Redis or a dedicated service.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (will reset on server restart)
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (e.g., userId, IP address)
 * @param limit - Maximum number of requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns Object with allowed status and remaining requests
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000 // 1 minute default
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // If no entry or window has expired, create new entry
  if (!entry || now > entry.resetTime) {
    const resetTime = now + windowMs;
    rateLimitStore.set(identifier, { count: 1, resetTime });
    return {
      allowed: true,
      remaining: limit - 1,
      resetTime,
    };
  }

  // Check if limit exceeded
  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(identifier, entry);

  return {
    allowed: true,
    remaining: limit - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Clean up expired entries (call periodically)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Review submission: 10 per minute per user
  REVIEW_SUBMISSION: {
    limit: 10,
    windowMs: 60000,
  },
  // Photo upload: 2 per day per user (handled by daily upload logic)
  PHOTO_UPLOAD: {
    limit: 2,
    windowMs: 24 * 60 * 60 * 1000,
  },
  // API calls: 100 per minute per user
  API_GENERAL: {
    limit: 100,
    windowMs: 60000,
  },
  // Authentication: 5 attempts per 15 minutes per IP
  AUTH: {
    limit: 5,
    windowMs: 15 * 60 * 1000,
  },
} as const;
