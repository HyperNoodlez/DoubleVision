/**
 * Error Logging and Monitoring Utilities
 *
 * Provides structured logging for errors, warnings, and important events.
 * In production, these logs can be sent to external services like Sentry, LogRocket, etc.
 */

export type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: Error;
  userId?: string;
  requestId?: string;
}

/**
 * Log an error with context
 */
export function logError(
  message: string,
  error?: Error | unknown,
  context?: Record<string, any>
): void {
  const logEntry: LogEntry = {
    level: "error",
    message,
    timestamp: new Date().toISOString(),
    context,
  };

  if (error instanceof Error) {
    logEntry.error = error;
    console.error(`[ERROR] ${message}`, {
      ...context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    });
  } else {
    console.error(`[ERROR] ${message}`, context, error);
  }

  // In production, send to external logging service
  if (process.env.NODE_ENV === "production") {
    // Example: sendToSentry(logEntry);
    // Example: sendToLogRocket(logEntry);
  }
}

/**
 * Log a warning
 */
export function logWarning(message: string, context?: Record<string, any>): void {
  const logEntry: LogEntry = {
    level: "warn",
    message,
    timestamp: new Date().toISOString(),
    context,
  };

  console.warn(`[WARN] ${message}`, context);

  if (process.env.NODE_ENV === "production") {
    // Send to logging service
  }
}

/**
 * Log an info message
 */
export function logInfo(message: string, context?: Record<string, any>): void {
  const logEntry: LogEntry = {
    level: "info",
    message,
    timestamp: new Date().toISOString(),
    context,
  };

  console.log(`[INFO] ${message}`, context);
}

/**
 * Log a debug message (only in development)
 */
export function logDebug(message: string, context?: Record<string, any>): void {
  if (process.env.NODE_ENV === "development") {
    const logEntry: LogEntry = {
      level: "debug",
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    console.debug(`[DEBUG] ${message}`, context);
  }
}

/**
 * Log API request/response
 */
export function logApiRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  userId?: string
): void {
  logInfo("API Request", {
    method,
    path,
    statusCode,
    duration: `${duration}ms`,
    userId,
  });
}

/**
 * Log database operation
 */
export function logDatabaseOperation(
  operation: string,
  collection: string,
  duration: number,
  success: boolean,
  error?: Error
): void {
  if (success) {
    logDebug("Database Operation", {
      operation,
      collection,
      duration: `${duration}ms`,
      success,
    });
  } else {
    logError(
      "Database Operation Failed",
      error,
      {
        operation,
        collection,
        duration: `${duration}ms`,
      }
    );
  }
}

/**
 * Log authentication event
 */
export function logAuthEvent(
  event: "login" | "logout" | "signup" | "failed_login",
  userId?: string,
  context?: Record<string, any>
): void {
  logInfo(`Auth: ${event}`, {
    event,
    userId,
    ...context,
  });
}

/**
 * Log moderation event
 */
export function logModerationEvent(
  reviewId: string,
  status: "approved" | "rejected",
  confidence: number,
  reason?: string
): void {
  logInfo("Review Moderation", {
    reviewId,
    status,
    confidence: `${confidence}%`,
    reason,
  });
}

/**
 * Log security event
 */
export function logSecurityEvent(
  event: string,
  severity: "low" | "medium" | "high" | "critical",
  context?: Record<string, any>
): void {
  const securityContext = {
    severity,
    ...context,
  };

  if (severity === "critical" || severity === "high") {
    logError(`Security: ${event}`, undefined, securityContext);
  } else {
    logWarning(`Security: ${event}`, securityContext);
  }
}

/**
 * Create a timer to measure operation duration
 */
export function createTimer() {
  const start = Date.now();

  return {
    end: () => Date.now() - start,
  };
}
