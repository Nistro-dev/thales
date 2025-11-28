export function ReservationDetailSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Back button skeleton */}
      <div className="h-10 w-48 animate-pulse rounded-md bg-muted" />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-64 animate-pulse rounded bg-muted" />
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-7 w-24 animate-pulse rounded-full bg-muted" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Info Card */}
          <div className="rounded-lg border bg-card">
            <div className="border-b p-6">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 animate-pulse rounded bg-muted" />
                <div className="h-5 w-20 animate-pulse rounded bg-muted" />
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <div className="h-6 w-48 animate-pulse rounded bg-muted" />
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-px w-full bg-border" />
              <div className="space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-px w-full bg-border" />
              <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
            </div>
          </div>

          {/* Dates & Duration Card */}
          <div className="rounded-lg border bg-card">
            <div className="border-b p-6">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 animate-pulse rounded bg-muted" />
                <div className="h-5 w-28 animate-pulse rounded bg-muted" />
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                </div>
                <div className="space-y-1">
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                </div>
              </div>
              <div className="h-px w-full bg-border" />
              <div className="flex justify-between">
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                <div className="h-4 w-16 animate-pulse rounded bg-muted" />
              </div>
            </div>
          </div>

          {/* Cost Card */}
          <div className="rounded-lg border bg-card">
            <div className="border-b p-6">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 animate-pulse rounded bg-muted" />
                <div className="h-5 w-16 animate-pulse rounded bg-muted" />
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-baseline justify-between">
                <div className="h-4 w-12 animate-pulse rounded bg-muted" />
                <div className="flex items-baseline gap-1">
                  <div className="h-8 w-12 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - QR Code & Actions */}
        <div className="space-y-6">
          {/* QR Code Card */}
          <div className="rounded-lg border bg-card">
            <div className="border-b p-6">
              <div className="h-5 w-20 animate-pulse rounded bg-muted" />
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-center bg-white p-4 rounded-lg">
                <div className="w-[200px] h-[200px] animate-pulse rounded bg-muted" />
              </div>
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
              <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
            </div>
          </div>

          {/* Timeline Card */}
          <div className="rounded-lg border bg-card">
            <div className="border-b p-6">
              <div className="h-5 w-24 animate-pulse rounded bg-muted" />
            </div>
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-1">
                  <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-36 animate-pulse rounded bg-muted" />
                  {i < 3 && <div className="h-px w-full bg-border mt-2" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
