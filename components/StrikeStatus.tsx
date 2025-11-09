"use client";

import { useEffect, useState } from "react";

interface StrikeData {
  strikes: number;
  isTimedOut: boolean;
  timeoutUntil?: string;
  lastStrikeDate?: string;
}

export default function StrikeStatus() {
  const [strikeData, setStrikeData] = useState<StrikeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStrikeStatus();
  }, []);

  const fetchStrikeStatus = async () => {
    try {
      const response = await fetch("/api/user/strikes");
      if (response.ok) {
        const data = await response.json();
        setStrikeData(data);
      }
    } catch (error) {
      console.error("Failed to fetch strike status:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !strikeData) {
    return null;
  }

  // If no strikes and not timed out, don't show anything
  if (strikeData.strikes === 0 && !strikeData.isTimedOut) {
    return null;
  }

  const getDaysRemaining = (timeoutUntil: string) => {
    const days = Math.ceil((new Date(timeoutUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  // User is timed out
  if (strikeData.isTimedOut && strikeData.timeoutUntil) {
    const daysRemaining = getDaysRemaining(strikeData.timeoutUntil);
    const timeoutDate = new Date(strikeData.timeoutUntil).toLocaleDateString();

    return (
      <div className="card bg-error/10 border-error">
        <div className="flex items-start gap-3">
          <div className="text-2xl">⛔</div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-error mb-2">Account Temporarily Restricted</h3>
            <p className="text-sm text-text-secondary mb-3">
              Due to repeated violations of our community guidelines, you are temporarily unable to submit reviews.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">Timeout expires:</span>
                <span className="text-error font-bold">{timeoutDate}</span>
                <span className="text-text-secondary">({daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Total strikes:</span>
                <span className="text-error font-bold">{strikeData.strikes}/3</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-background rounded text-xs text-text-secondary">
              <p className="font-medium mb-1">What happens next?</p>
              <p>After your timeout expires, your strikes will be reset to zero. Please review our community guidelines to ensure future submissions meet our standards.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User has strikes but not timed out yet
  return (
    <div className="card bg-yellow-500/10 border-yellow-500">
      <div className="flex items-start gap-3">
        <div className="text-2xl">⚠️</div>
        <div className="flex-1">
          <h3 className="text-lg font-bold mb-2">Community Guideline Warning</h3>
          <p className="text-sm text-text-secondary mb-3">
            Some of your reviews have been flagged for violating our community guidelines.
          </p>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex gap-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    i <= strikeData.strikes
                      ? "bg-error text-white"
                      : "bg-surface text-text-secondary"
                  }`}
                >
                  {i <= strikeData.strikes ? "✗" : i}
                </div>
              ))}
            </div>
            <span className="text-sm font-medium">
              {strikeData.strikes}/3 Strike{strikeData.strikes !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="p-3 bg-background rounded text-xs text-text-secondary">
            <p className="font-medium text-error mb-1">⚠️ Warning:</p>
            <p>If you receive {3 - strikeData.strikes} more strike{3 - strikeData.strikes !== 1 ? 's' : ''}, your account will be restricted from submitting reviews for 7 days.</p>
            {strikeData.lastStrikeDate && (
              <p className="mt-2 text-[10px]">
                Last strike: {new Date(strikeData.lastStrikeDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
