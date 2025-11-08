"use client";

import { useState } from "react";
import { Button } from "./Button";

interface GenerateTestReviewsProps {
  photoId: string;
}

export default function GenerateTestReviews({ photoId }: GenerateTestReviewsProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/simulate-reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ photoId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate reviews");
      }

      setMessage(
        `✅ ${data.message}\n\n` +
          data.reviews
            .map(
              (r: any, i: number) =>
                `${i + 1}. ${r.reviewer} (${r.expertise}) - ${r.score}⭐ (${r.wordCount} words)`
            )
            .join("\n") +
          "\n\nRefresh the page to see the reviews!"
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate reviews");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card border-2 border-dashed border-border bg-absent/5">
      <div className="text-center space-y-4">
        <div className="text-4xl">🧪</div>
        <h3 className="text-lg font-bold">Development Mode</h3>
        <p className="text-sm text-text-secondary">
          Generate simulated reviews to test the feedback viewing experience.
          This feature is only available in development mode.
        </p>

        <Button onClick={handleGenerate} loading={loading} disabled={loading || !!message}>
          {loading ? "Generating Reviews..." : "Generate 5 Test Reviews"}
        </Button>

        {message && (
          <div className="mt-4 p-4 bg-correct/10 border border-correct rounded-lg">
            <pre className="text-sm text-left whitespace-pre-wrap font-mono">
              {message}
            </pre>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-absent/10 border border-absent rounded-lg">
            <p className="text-sm text-absent">{error}</p>
          </div>
        )}

        <p className="text-xs text-text-secondary">
          💡 Tip: These are high-quality photography reviews written from different
          perspectives (technical, artistic, constructive, encouraging, balanced).
        </p>
      </div>
    </div>
  );
}
