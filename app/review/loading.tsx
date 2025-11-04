import { Skeleton, SkeletonCard, SkeletonImage, SkeletonButton } from "@/components/Skeleton";

export default function ReviewLoading() {
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

        {/* Progress */}
        <div className="card bg-present/10 border-present">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-3 w-full rounded-full" />
        </div>

        {/* Photo Review Card */}
        <SkeletonCard>
          <div className="space-y-6">
            {/* Photo */}
            <SkeletonImage className="max-w-2xl mx-auto" />

            {/* Form */}
            <div className="space-y-4">
              <div>
                <Skeleton className="h-5 w-24 mb-2" />
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-12 rounded-lg" />
                  ))}
                </div>
              </div>

              <div>
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-32 w-full rounded-lg" />
                <Skeleton className="h-4 w-48 mt-2" />
              </div>

              <SkeletonButton />
            </div>
          </div>
        </SkeletonCard>

        {/* Info */}
        <div className="card bg-present/10 border-present">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
