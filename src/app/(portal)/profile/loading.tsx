export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header card */}
      <div className="rounded-box border bg-base-100 shadow-sm overflow-hidden">
        <div className="h-24 skeleton rounded-none" />
        <div className="px-6 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between -mt-12">
            <div className="skeleton h-24 w-24 rounded-full border-4 border-base-100" />
            <div className="skeleton h-9 w-24 rounded-lg" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="skeleton h-7 w-48 rounded-lg" />
            <div className="flex gap-2">
              <div className="skeleton h-5 w-16 rounded-full" />
              <div className="skeleton h-5 w-14 rounded-full" />
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-4 w-48 rounded" />
            ))}
          </div>
        </div>
      </div>

      {/* Stats + QR */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-box border bg-base-100 p-5 shadow-sm space-y-4">
          <div className="skeleton h-4 w-36 rounded" />
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1.5 text-center">
                <div className="skeleton h-8 w-12 rounded mx-auto" />
                <div className="skeleton h-3 w-16 rounded mx-auto" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-box border bg-base-100 p-5 shadow-sm space-y-3">
          <div className="skeleton h-4 w-20 rounded" />
          <div className="skeleton h-36 w-36 rounded-lg mx-auto" />
        </div>
      </div>
    </div>
  )
}
