import { Skeleton, SkeletonCard, SkeletonImage } from "@/components/Skeleton";

export default function FeedbackLoading() {
  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        </div>

        {/* Latest Photo Section */}
        <SkeletonCard>
          <Skeleton className="h-6 w-40 mb-4" />

          {/* Photo */}
          <SkeletonImage className="max-w-2xl mx-auto mb-6" />

          {/* Rating Summary */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <Skeleton className="h-12 w-32" />
            <div className="space-y-1">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-6 flex-1 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </SkeletonCard>

        {/* Reviews List */}
        <div className="card">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 bg-surface rounded-lg border border-border">
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-16 w-full mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="card bg-present/10 border-present">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
