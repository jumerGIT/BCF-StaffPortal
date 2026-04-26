export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="space-y-1.5">
        <div className="skeleton h-6 w-52 rounded-lg" />
        <div className="skeleton h-4 w-40 rounded-lg" />
      </div>

      {/* Stats */}
      <div className="rounded-box border bg-base-100 shadow overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-3 divide-x">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-5 space-y-2">
              <div className="skeleton h-3 w-24 rounded" />
              <div className="skeleton h-8 w-16 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Clock in + QR grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-box border bg-base-100 p-6 shadow-sm space-y-4">
          <div className="skeleton h-4 w-16 rounded" />
          <div className="skeleton h-12 w-full rounded-lg" />
        </div>
        <div className="rounded-box border bg-base-100 p-6 shadow-sm space-y-4">
          <div className="skeleton h-4 w-20 rounded" />
          <div className="skeleton h-36 w-36 mx-auto rounded-lg" />
        </div>
      </div>

      {/* Recent entries */}
      <div className="rounded-box border bg-base-100 shadow-sm overflow-hidden">
        <div className="border-b px-5 py-3">
          <div className="skeleton h-4 w-28 rounded" />
        </div>
        <div className="divide-y">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3">
              <div className="space-y-1.5">
                <div className="skeleton h-3.5 w-28 rounded" />
                <div className="skeleton h-3 w-20 rounded" />
              </div>
              <div className="flex items-center gap-2">
                <div className="skeleton h-4 w-12 rounded" />
                <div className="skeleton h-5 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
