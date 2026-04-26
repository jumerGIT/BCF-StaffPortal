export default function PortalLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page title */}
      <div className="space-y-2">
        <div className="skeleton h-6 w-48 rounded-lg" />
        <div className="skeleton h-4 w-64 rounded-lg" />
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-box border bg-base-100 p-4 shadow-sm space-y-2">
            <div className="skeleton h-3 w-16 rounded" />
            <div className="skeleton h-8 w-12 rounded" />
          </div>
        ))}
      </div>

      {/* Main content card */}
      <div className="rounded-box border bg-base-100 shadow-sm overflow-hidden">
        <div className="border-b px-5 py-3">
          <div className="skeleton h-4 w-32 rounded" />
        </div>
        <div className="divide-y">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="skeleton h-9 w-9 rounded-full shrink-0" />
                <div className="space-y-1.5">
                  <div className="skeleton h-3.5 w-32 rounded" />
                  <div className="skeleton h-3 w-24 rounded" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="skeleton h-5 w-16 rounded-full" />
                <div className="skeleton h-5 w-14 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
