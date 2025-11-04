import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  getModerationStatistics,
  getRecentRejectedReviews,
} from "@/lib/db/reviews";
import { isLinearEnabled } from "@/lib/linear";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // TODO: Add admin role check here
  // For now, any authenticated user can access (should be restricted in production)

  const [stats, recentRejections] = await Promise.all([
    getModerationStatistics(),
    getRecentRejectedReviews(5),
  ]);

  const linearEnabled = isLinearEnabled();

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-text-secondary">
                Moderation statistics and system health
              </p>
            </div>
            <Link href="/dashboard" className="btn-secondary">
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Linear Integration Status */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Linear Integration</h2>
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                linearEnabled ? "bg-correct" : "bg-absent"
              }`}
            />
            <span className={linearEnabled ? "text-correct" : "text-absent"}>
              {linearEnabled
                ? "Enabled - Issues will be created automatically"
                : "Disabled - Set LINEAR_API_KEY and LINEAR_TEAM_ID to enable"}
            </span>
          </div>
          {linearEnabled && (
            <p className="text-sm text-text-secondary mt-2">
              High-confidence rejections (≥70%) automatically create Linear
              issues for review.
            </p>
          )}
        </div>

        {/* Moderation Statistics */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Moderation Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-3xl font-bold text-text-primary">
                {stats.totalReviews}
              </div>
              <div className="text-sm text-text-secondary">Total Reviews</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-correct">
                {stats.approved}
              </div>
              <div className="text-sm text-text-secondary">Approved</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-absent">
                {stats.rejected}
              </div>
              <div className="text-sm text-text-secondary">Rejected</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-present">
                {stats.rejectionRate.toFixed(1)}%
              </div>
              <div className="text-sm text-text-secondary">Rejection Rate</div>
            </div>
          </div>
        </div>

        {/* Rejection Reasons */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Rejection Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-surface rounded-lg border border-border">
              <div className="text-2xl font-bold text-absent">
                {stats.byReason.offensive}
              </div>
              <div className="text-sm text-text-secondary">
                Offensive Content
              </div>
            </div>
            <div className="p-4 bg-surface rounded-lg border border-border">
              <div className="text-2xl font-bold text-absent">
                {stats.byReason.irrelevant}
              </div>
              <div className="text-sm text-text-secondary">
                Irrelevant Reviews
              </div>
            </div>
            <div className="p-4 bg-surface rounded-lg border border-border">
              <div className="text-2xl font-bold text-absent">
                {stats.byReason.aiGenerated}
              </div>
              <div className="text-sm text-text-secondary">
                AI-Generated Content
              </div>
            </div>
          </div>
        </div>

        {/* AI Confidence */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">AI Performance</h2>
          <div className="flex items-center gap-6">
            <div>
              <div className="text-3xl font-bold text-present">
                {stats.avgConfidence.toFixed(1)}%
              </div>
              <div className="text-sm text-text-secondary">
                Average Confidence
              </div>
            </div>
            <div className="flex-1">
              <div className="w-full bg-surface rounded-full h-3 overflow-hidden">
                <div
                  className="bg-present h-full rounded-full transition-all"
                  style={{ width: `${stats.avgConfidence}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Rejections */}
        {recentRejections.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Recent Rejections</h2>
            <div className="space-y-4">
              {recentRejections.map((review) => (
                <div
                  key={review._id}
                  className="p-4 bg-surface rounded-lg border border-border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-text-secondary">
                      {new Date(review.createdAt).toLocaleString()}
                    </span>
                    <span className="text-sm font-medium text-absent">
                      {review.aiAnalysis?.confidence}% confidence
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary mb-2">
                    {review.aiAnalysis?.reasoning}
                  </p>
                  <div className="flex gap-2">
                    {review.aiAnalysis?.isOffensive && (
                      <span className="px-2 py-1 bg-absent/20 text-absent text-xs rounded-full">
                        Offensive
                      </span>
                    )}
                    {review.aiAnalysis?.isRelevant === false && (
                      <span className="px-2 py-1 bg-absent/20 text-absent text-xs rounded-full">
                        Irrelevant
                      </span>
                    )}
                    {review.aiAnalysis?.isAiGenerated && (
                      <span className="px-2 py-1 bg-present/20 text-present text-xs rounded-full">
                        AI-Generated
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Information */}
        <div className="card bg-present/10 border-present">
          <h3 className="font-bold mb-2">ℹ️ About This Dashboard</h3>
          <p className="text-sm text-text-secondary">
            This admin dashboard provides real-time insights into the AI
            moderation system. High-confidence rejections (≥70%) automatically
            create Linear issues for manual review when Linear integration is
            enabled.
          </p>
        </div>
      </div>
    </div>
  );
}
