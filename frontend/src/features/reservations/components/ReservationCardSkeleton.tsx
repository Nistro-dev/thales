export function ReservationCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Info */}
        <div className="flex-1 space-y-3">
          {/* Header with title and badge */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              {/* Product name */}
              <div className="h-6 w-48 animate-pulse rounded bg-muted" />
              {/* Reference */}
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            </div>
            {/* Status badge */}
            <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
          </div>

          {/* User info (admin only) */}
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-pulse rounded-full bg-muted" />
            <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              <div className="h-4 w-28 animate-pulse rounded bg-muted" />
            </div>
            <div className="space-y-1">
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              <div className="h-4 w-28 animate-pulse rounded bg-muted" />
            </div>
          </div>

          {/* Duration & Cost */}
          <div className="flex gap-6">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-row lg:flex-col gap-2 lg:min-w-[140px]">
          <div className="flex-1 lg:flex-none h-10 w-full animate-pulse rounded-md bg-muted" />
          <div className="flex-1 lg:flex-none h-10 w-full animate-pulse rounded-md bg-muted" />
        </div>
      </div>
    </div>
  )
}
