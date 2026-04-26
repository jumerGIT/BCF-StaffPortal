import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { profiles, timeEntries, jobs } from '@/lib/db/schema'
import { eq, desc, and, gte, isNull, count } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { ClockInButton } from '@/components/attendance/ClockInButton'
import { StaffQRCode } from '@/components/staff/StaffQRCode'
import { formatDate, formatHours } from '@/lib/utils'
import { startOfWeek } from 'date-fns'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, user.id),
  })
  if (!profile) redirect('/login')

  const isPrivileged = ['manager', 'admin'].includes(profile.role)

  // Recent time entries for this user
  const recentEntries = await db.query.timeEntries.findMany({
    where: eq(timeEntries.userId, user.id),
    with: { job: true },
    orderBy: desc(timeEntries.clockIn),
    limit: 5,
  })

  // Weekly hours
  const weekStart = startOfWeek(new Date())
  const weekEntries = await db.query.timeEntries.findMany({
    where: and(
      eq(timeEntries.userId, user.id),
      gte(timeEntries.clockIn, weekStart)
    ),
  })
  const weekHours = weekEntries.reduce(
    (sum, e) => sum + (e.totalHours ? parseFloat(String(e.totalHours)) : 0),
    0
  )

  // Pending approvals count (manager+)
  let pendingCount = 0
  if (isPrivileged) {
    const [result] = await db
      .select({ count: count() })
      .from(timeEntries)
      .where(eq(timeEntries.status, 'pending'))
    pendingCount = Number(result.count)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-base-content">
          Welcome back, {profile.name.split(' ')[0]}
        </h1>
        <p className="text-sm text-base-content/60">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Stats */}
      <div className="stats stats-vertical sm:stats-horizontal w-full shadow">
        <div className="stat">
          <div className="stat-title">Hours this week</div>
          <div className="stat-value text-2xl">{formatHours(weekHours)}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Entries this week</div>
          <div className="stat-value text-2xl">{weekEntries.length}</div>
        </div>
        {isPrivileged && (
          <div className="stat">
            <div className="stat-title">Pending approvals</div>
            <div className="stat-value text-2xl text-primary">{pendingCount}</div>
          </div>
        )}
      </div>

      {/* Clock in/out + QR code */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-box border bg-base-100 p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-base-content">Today</h2>
          <ClockInButton />
        </div>
        <div className="rounded-box border bg-base-100 p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-base-content">My QR Code</h2>
          <StaffQRCode userId={profile.id} name={profile.name} />
        </div>
      </div>

      {/* Recent entries */}
      {recentEntries.length > 0 && (
        <div className="rounded-box border bg-base-100 shadow-sm">
          <div className="border-b px-5 py-3">
            <h2 className="text-sm font-semibold text-base-content">Recent Entries</h2>
          </div>
          <ul className="divide-y">
            {recentEntries.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between px-5 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-base-content">
                    {formatDate(entry.clockIn)}
                  </p>
                  {entry.job && (
                    <p className="text-xs text-base-content/60">{entry.job.title}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-base-content/70">
                    {entry.totalHours ? formatHours(entry.totalHours) : 'Active'}
                  </span>
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
        </div>
      )}
    </div>
  )
}
