/**
 * Reusable skeleton loading components
 * Used for loading states across the application
 */

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-surface-hover rounded ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard({ className = "", children }: SkeletonProps & { children?: React.ReactNode }) {
  if (children) {
    return (
      <div className={`card ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div className={`card ${className}`}>
      <div className="space-y-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="card">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonImage({ className = "" }: SkeletonProps) {
  return (
    <Skeleton className={`aspect-square w-full ${className}`} />
  );
}

export function SkeletonButton({ className = "" }: SkeletonProps) {
  return (
    <Skeleton className={`h-12 w-full rounded-lg ${className}`} />
  );
}

export function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 ? "w-3/4" : "w-full"}`}
        />
      ))}
    </div>
  );
}
