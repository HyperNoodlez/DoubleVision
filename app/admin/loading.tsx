import { Skeleton, SkeletonStats } from "@/components/Skeleton";

export default function AdminLoading() {
  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-10 w-40 rounded-lg" />
          </div>
        </div>

        {/* Linear Integration Status */}
        <div className="card">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="flex items-center gap-3">
            <Skeleton className="w-3 h-3 rounded-full" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>

        {/* Moderation Statistics */}
        <SkeletonStats />

        {/* Rejection Breakdown */}
        <div className="card">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 bg-surface rounded-lg border border-border">
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>

        {/* AI Performance */}
        <div className="card">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="flex items-center gap-6">
            <div>
              <Skeleton className="h-10 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex-1">
              <Skeleton className="h-3 w-full rounded-full" />
            </div>
          </div>
        </div>

        {/* Recent Rejections */}
        <div className="card">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 bg-surface rounded-lg border border-border">
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-12 w-full mb-2" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="card bg-present/10 border-present">
          <Skeleton className="h-5 w-48 mb-2" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    </div>
  );
}
