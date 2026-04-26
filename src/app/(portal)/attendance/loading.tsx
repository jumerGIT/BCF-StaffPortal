export default function AttendanceLoading() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-6 w-36 rounded-lg" />

      <div className="rounded-box border bg-base-100 p-6 shadow-sm">
        <div className="skeleton h-12 w-full rounded-lg" />
      </div>

      <div className="rounded-box border bg-base-100 shadow-sm overflow-hidden">
        <div className="border-b px-5 py-3">
          <div className="skeleton h-4 w-16 rounded" />
        </div>
        <div className="divide-y">
          {Array.from({ length: 8 }).map((_, i) => (
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
