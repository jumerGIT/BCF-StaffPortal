import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { timeEntries, profiles } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { ClockInButton } from '@/components/attendance/ClockInButton'
import { Badge } from '@/components/ui/Badge'
import { formatDate, formatTime, formatHours } from '@/lib/utils'

export default async function AttendancePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, user.id),
  })
  if (!profile) redirect('/login')

  const entries = await db.query.timeEntries.findMany({
    where: eq(timeEntries.userId, user.id),
    with: { job: true },
    orderBy: desc(timeEntries.clockIn),
    limit: 30,
  })

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-base-content">My Attendance</h1>

      <div className="rounded-box border bg-base-100 p-6 shadow-sm">
        <ClockInButton />
      </div>

      <div className="rounded-box border bg-base-100 shadow-sm">
        <div className="border-b px-5 py-3">
          <h2 className="text-sm font-semibold text-base-content">History</h2>
        </div>
        {entries.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-base-content/40">No entries yet.</p>
        ) : (
          <ul className="divide-y">
            {entries.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-base-content">
                    {formatDate(entry.clockIn)}
                  </p>
                  <p className="text-xs text-base-content/60">
                    {formatTime(entry.clockIn)}
                    {entry.clockOut ? ` – ${formatTime(entry.clockOut)}` : ' (active)'}
                  </p>
                  {entry.job && (
                    <p className="text-xs text-base-content/40">{entry.job.title}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {entry.totalHours && (
                    <span className="text-sm text-base-content/70">
                      {formatHours(entry.totalHours)}
                      {entry.isOvertime && (
                        <Badge variant="warning" className="ml-1">OT</Badge>
                      )}
                    </span>
                  )}
                  <Badge
                    variant={
                      entry.status === 'approved'
                        ? 'success'
                        : entry.status === 'rejected'
                        ? 'danger'
                        : 'warning'
                    }
                  >
                    {entry.status}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
