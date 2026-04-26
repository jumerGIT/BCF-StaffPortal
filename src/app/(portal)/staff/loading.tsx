export default function StaffLoading() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="skeleton h-6 w-16 rounded-lg" />
          <div className="skeleton h-4 w-32 rounded" />
        </div>
        <div className="skeleton h-9 w-28 rounded-lg" />
      </div>

      {/* Role summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-box border bg-base-100 p-4 shadow-sm space-y-2">
            <div className="skeleton h-3 w-16 rounded" />
            <div className="skeleton h-8 w-8 rounded" />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-box border bg-base-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                {['Name', 'Email', 'Phone', 'Role', 'Status', 'Password', ''].map((h) => (
                  <th key={h}><div className="skeleton h-3 w-16 rounded" /></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 7 }).map((_, i) => (
                <tr key={i}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="skeleton h-8 w-8 rounded-full shrink-0" />
                      <div className="skeleton h-3.5 w-24 rounded" />
                    </div>
                  </td>
                  <td><div className="skeleton h-3.5 w-36 rounded" /></td>
                  <td><div className="skeleton h-3.5 w-24 rounded" /></td>
                  <td><div className="skeleton h-5 w-16 rounded-full" /></td>
                  <td><div className="skeleton h-5 w-14 rounded-full" /></td>
                  <td><div className="skeleton h-5 w-14 rounded-full" /></td>
                  <td><div className="skeleton h-6 w-20 rounded" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
