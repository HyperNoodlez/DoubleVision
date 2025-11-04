"use client";

import { useEffect } from "react";

/**
 * Global Error Page
 * Catches errors in the app and displays a user-friendly message
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-lg w-full text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-3xl font-bold mb-2">Oops! Something went wrong</h1>
        <p className="text-text-secondary mb-6">
          We encountered an unexpected error. Don&apos;t worry, your data is safe.
          Try refreshing the page or click the button below to try again.
        </p>

        {process.env.NODE_ENV === "development" && (
          <div className="mb-6 p-4 bg-surface rounded-lg text-left">
            <p className="font-mono text-sm text-absent break-all">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="btn-primary">
            Try Again
          </button>
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="btn-secondary"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
