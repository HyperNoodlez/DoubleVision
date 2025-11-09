/**
 * Input Validation and Sanitization Utilities
 */

/**
 * Sanitize user input to prevent XSS and injection attacks
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') return '';

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets to prevent HTML injection
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

/**
 * Validate and sanitize review comment
 */
export function validateReviewComment(comment: string): {
  valid: boolean;
  sanitized: string;
  wordCount: number;
  error?: string;
} {
  if (!comment || typeof comment !== 'string') {
    return {
      valid: false,
      sanitized: '',
      wordCount: 0,
      error: 'Comment is required',
    };
  }

  const sanitized = sanitizeString(comment);
  const wordCount = sanitized.split(/\s+/).filter(word => word.length > 0).length;

  // Check minimum word count
  if (wordCount < 50) {
    return {
      valid: false,
      sanitized,
      wordCount,
      error: `Comment must be at least 50 words. Current: ${wordCount} words.`,
    };
  }

  // Check maximum word count (prevent abuse)
  if (wordCount > 500) {
    return {
      valid: false,
      sanitized,
      wordCount,
      error: `Comment must not exceed 500 words. Current: ${wordCount} words.`,
    };
  }

  // Check for excessive repetition (spam detection)
  const words = sanitized.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  const repetitionRatio = uniqueWords.size / words.length;

  if (repetitionRatio < 0.3) {
    return {
      valid: false,
      sanitized,
      wordCount,
      error: 'Comment appears to be spam or excessively repetitive.',
    };
  }

  return {
    valid: true,
    sanitized,
    wordCount,
  };
}

/**
 * Validate review score
 */
export function validateReviewScore(score: any): {
  valid: boolean;
  value: number;
  error?: string;
} {
  if (score === null || score === undefined) {
    return {
      valid: false,
      value: 0,
      error: 'Score is required',
    };
  }

  const numScore = Number(score);

  if (isNaN(numScore) || !Number.isInteger(numScore)) {
    return {
      valid: false,
      value: 0,
      error: 'Score must be an integer',
    };
  }

  if (numScore < 1 || numScore > 100) {
    return {
      valid: false,
      value: numScore,
      error: 'Score must be between 1 and 100',
    };
  }

  return {
    valid: true,
    value: numScore,
  };
}

/**
 * Validate MongoDB ObjectId format
 */
export function validateObjectId(id: string): {
  valid: boolean;
  error?: string;
} {
  if (!id || typeof id !== 'string') {
    return {
      valid: false,
      error: 'ID is required and must be a string',
    };
  }

  // MongoDB ObjectId is 24 hex characters
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;

  if (!objectIdRegex.test(id)) {
    return {
      valid: false,
      error: 'Invalid ID format',
    };
  }

  return {
    valid: true,
  };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): {
  valid: boolean;
  error?: string;
} {
  if (!email || typeof email !== 'string') {
    return {
      valid: false,
      error: 'Email is required',
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return {
      valid: false,
      error: 'Invalid email format',
    };
  }

  return {
    valid: true,
  };
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  if (!file) {
    return {
      valid: false,
      error: 'File is required',
    };
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Only JPEG, PNG, and WebP images are allowed',
    };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size must not exceed 10MB',
    };
  }

  // Check minimum size (prevent tiny/broken images)
  const minSize = 1024; // 1KB
  if (file.size < minSize) {
    return {
      valid: false,
      error: 'File size is too small',
    };
  }

  return {
    valid: true,
  };
}

/**
 * Sanitize URL to prevent open redirect vulnerabilities
 */
export function sanitizeRedirectUrl(url: string, allowedDomains: string[] = []): string {
  if (!url) return '/';

  try {
    const parsedUrl = new URL(url, 'http://localhost');

    // Only allow relative URLs or URLs from allowed domains
    if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
      if (allowedDomains.length === 0) {
        // If no allowed domains specified, only allow relative URLs
        return '/';
      }

      const isAllowed = allowedDomains.some(domain =>
        parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
      );

      if (!isAllowed) {
        return '/';
      }
    }

    return parsedUrl.pathname + parsedUrl.search;
  } catch {
    return '/';
  }
}
