"use client";

import { useEffect } from "react";

interface StrikeNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  strikes: number;
  isTimedOut: boolean;
  timeoutUntil?: string;
}

export default function StrikeNotificationModal({
  isOpen,
  onClose,
  strikes,
  isTimedOut,
  timeoutUntil,
}: StrikeNotificationModalProps) {
  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface border-2 border-error rounded-lg shadow-2xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="text-4xl">{isTimedOut ? "⛔" : "⚠️"}</div>
          <h2 className="text-2xl font-bold text-error">
            {isTimedOut ? "Account Restricted" : "Community Guideline Warning"}
          </h2>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {isTimedOut ? (
            <>
              <p className="text-text">
                Your review was rejected for violating our community guidelines.
                You have received <strong className="text-error">{strikes} strikes</strong> and are now{" "}
                <strong className="text-error">temporarily restricted</strong> from submitting reviews.
              </p>

              <div className="bg-error/10 border border-error rounded p-4">
                <p className="font-semibold text-error mb-2">Restriction Details:</p>
                <ul className="text-sm text-text space-y-1 list-disc list-inside">
                  <li>You cannot submit reviews until: {timeoutUntil ? new Date(timeoutUntil).toLocaleDateString() : "N/A"}</li>
                  <li>Your strikes will reset after the timeout period</li>
                  <li>Duration: 7 days from last strike</li>
                </ul>
              </div>

              <p className="text-sm text-text-secondary">
                Please review our community guidelines. Continued violations may result in permanent restrictions.
              </p>
            </>
          ) : (
            <>
              <p className="text-text">
                Your review was rejected for violating our community guidelines.
                You have received a <strong className="text-error">strike</strong>.
              </p>

              {/* Strike Counter */}
              <div className="flex gap-2 justify-center my-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border-2 ${
                      i <= strikes
                        ? "bg-error/20 border-error text-error"
                        : "bg-surface-light border-border text-text-secondary"
                    }`}
                  >
                    {i <= strikes ? "✗" : i}
                  </div>
                ))}
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500 rounded p-4">
                <p className="font-semibold text-yellow-600 dark:text-yellow-400 mb-2">
                  Strike {strikes} of 3
                </p>
                <p className="text-sm text-text">
                  {strikes === 1 && "This is your first warning. Please ensure your future reviews are constructive and respectful."}
                  {strikes === 2 && "This is your second warning. One more violation will result in a 7-day timeout."}
                </p>
              </div>

              <p className="text-sm text-text-secondary">
                <strong>Remember:</strong> Reviews should be constructive, specific, and focused on the photography. Avoid offensive language, spam, or AI-generated content.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="btn btn-primary px-6 py-2"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
