export function AppLayoutSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar skeleton - Desktop */}
      <aside className="hidden w-64 flex-col border-r bg-card lg:flex">
        {/* Header */}
        <div className="flex h-16 items-center border-b px-6">
          <div className="h-6 w-32 animate-pulse rounded bg-muted" />
        </div>

        {/* Nav items */}
        <nav className="flex-1 space-y-1 p-4">
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2">
                <div className="h-5 w-5 animate-pulse rounded bg-muted" />
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>

          {/* Admin section */}
          <div className="my-4 border-t" />
          <div className="h-4 w-32 animate-pulse rounded bg-muted px-3 py-2" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2">
                <div className="h-5 w-5 animate-pulse rounded bg-muted" />
                <div className="h-4 w-28 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </nav>

        {/* User section */}
        <div className="border-t p-4">
          <div className="mb-4 flex items-center gap-3 rounded-lg bg-muted px-3 py-2">
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted-foreground/20" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-muted-foreground/20" />
              <div className="h-3 w-16 animate-pulse rounded bg-muted-foreground/20" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="h-8 w-full animate-pulse rounded bg-muted-foreground/10" />
            <div className="h-8 w-full animate-pulse rounded bg-muted-foreground/10" />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex h-16 items-center border-b px-4 lg:hidden">
          <div className="h-5 w-5 animate-pulse rounded bg-muted" />
          <div className="ml-4 h-6 w-32 animate-pulse rounded bg-muted" />
        </header>

        {/* Page content skeleton */}
        <main className="flex-1 overflow-y-auto bg-muted/40 p-4 lg:p-6">
          <div className="container mx-auto space-y-6">
            {/* Page title */}
            <div className="space-y-2">
              <div className="h-8 w-48 animate-pulse rounded bg-muted" />
              <div className="h-5 w-96 animate-pulse rounded bg-muted" />
            </div>

            {/* Content blocks */}
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 animate-pulse rounded-lg bg-card" />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
