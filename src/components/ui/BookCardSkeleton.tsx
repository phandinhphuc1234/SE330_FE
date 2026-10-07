import { Skeleton } from "./Skeleton";

export function BookCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-[#DED5C8] bg-white p-4 shadow-sm">
      {/* Book cover skeleton */}
      <Skeleton variant="rectangular" className="aspect-[3/4] w-full" />

      {/* Title skeleton - 2 lines */}
      <div className="mt-4 space-y-2">
        <Skeleton variant="text" className="h-4 w-3/4" />
        <Skeleton variant="text" className="h-4 w-1/2" />
      </div>

      {/* Author skeleton */}
      <div className="mt-3">
        <Skeleton variant="text" className="h-3 w-2/3" />
      </div>

      {/* Category badge skeleton */}
      <div className="mt-4">
        <Skeleton variant="rectangular" className="h-6 w-24 rounded-full" />
      </div>

      {/* Availability badge skeleton */}
      <div className="mt-3">
        <Skeleton variant="rectangular" className="h-7 w-32 rounded-full" />
      </div>
    </div>
  );
}
