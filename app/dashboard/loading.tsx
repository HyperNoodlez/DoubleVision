import { Skeleton, SkeletonStats, SkeletonImage, SkeletonButton } from "@/components/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
        </div>

        {/* Stats */}
        <SkeletonStats />

        {/* Upload Section */}
        <div className="card">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-4">
            <SkeletonImage className="max-w-md mx-auto" />
            <Skeleton className="h-4 w-3/4 mx-auto" />
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonButton />
          <SkeletonButton />
          <SkeletonButton />
        </div>

        {/* Info */}
        <div className="card bg-present/10 border-present">
          <Skeleton className="h-5 w-40 mb-2" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    </div>
  );
}
