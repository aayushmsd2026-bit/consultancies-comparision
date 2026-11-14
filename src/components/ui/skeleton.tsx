import { cn } from "@/lib/cn";

/** A soft placeholder shown while content loads. Give it a size with classes. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("block animate-pulse-soft rounded-control bg-paper-sunk", className)}
    />
  );
}

/** The loading shape of a review card. */
export function ReviewCardSkeleton() {
  return (
    <div className="rounded-card bg-paper-raised p-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      </div>
      <div className="mt-6 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}
