import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { profiles, timeEntries } from '@/lib/db/schema'
import { eq, and, gte, lte } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { formatHours } from '@/lib/utils'
import { startOfMonth, endOfMonth, format } from 'date-fns'

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>
}) {
  const { year: yearParam, month: monthParam } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, user.id),
  })
  if (!profile || !['manager', 'admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  const year = parseInt(yearParam ?? String(new Date().getFullYear()))
  const month = parseInt(monthParam ?? String(new Date().getMonth() + 1)) - 1
  const baseDate = new Date(year, month, 1)
  const monthStart = startOfMonth(baseDate)
  const monthEnd = endOfMonth(baseDate)

  const entries = await db.query.timeEntries.findMany({
    where: and(
      gte(timeEntries.clockIn, monthStart),
      lte(timeEntries.clockIn, monthEnd)
    ),
    with: { user: true, job: true },
  })

  // Group by user
  const summary = entries.reduce(
    (acc, e) => {
      const uid = e.userId
      if (!acc[uid]) {
        acc[uid] = {
          name: e.user.name,
          totalHours: 0,
          overtimeHours: 0,
          present: 0,
          late: 0,
          absent: 0,
        }
      }
      const h = e.totalHours ? parseFloat(String(e.totalHours)) : 0
      acc[uid].totalHours += h
      if (e.isOvertime) acc[uid].overtimeHours += Math.max(0, h - 8)
      if (e.attendanceStatus === 'present') acc[uid].present++
      if (e.attendanceStatus === 'late') acc[uid].late++
      if (e.attendanceStatus === 'absent') acc[uid].absent++
      return acc
    },
    {} as Record<
      string,
      { name: string; totalHours: number; overtimeHours: number; present: number; late: number; absent: number }
    >
  )

  const rows = Object.values(summary).sort((a, b) => b.totalHours - a.totalHours)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-base-content">Reports</h1>
        <form method="GET" className="flex gap-2">
          <input
            type="number"
            name="year"
            defaultValue={year}
            min={2020}
            max={2030}
            className="input input-bordered input-sm w-24"
          />
          <select
            name="month"
            defaultValue={month + 1}
            className="select select-bordered select-sm"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {format(new Date(2000, i, 1), 'MMMM')}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-box bg-primary px-3 py-1.5 text-sm font-medium text-white"
          >
            View
          </button>
        </form>
      </div>

      <p className="text-sm text-base-content/60">
        {format(monthStart, 'MMMM yyyy')} · {entries.length} total entries
      </p>

      <div className="overflow-x-auto rounded-box border bg-base-100 shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-base-200 text-xs font-medium uppercase text-base-content/60">
            <tr>
              <th className="px-5 py-3 text-left">Staff</th>
              <th className="px-5 py-3 text-right">Total Hours</th>
              <th className="px-5 py-3 text-right">Overtime</th>
              <th className="px-5 py-3 text-right">Present</th>
              <th className="px-5 py-3 text-right">Late</th>
              <th className="px-5 py-3 text-right">Absent</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-base-content/40">
                  No data for this period.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.name} className="hover:bg-base-200">
                  <td className="px-5 py-3 font-medium text-base-content">{row.name}</td>
                  <td className="px-5 py-3 text-right">{formatHours(row.totalHours)}</td>
                  <td className="px-5 py-3 text-right text-amber-600">
                    {row.overtimeHours > 0 ? formatHours(row.overtimeHours) : '—'}
                  </td>
                  <td className="px-5 py-3 text-right text-green-600">{row.present}</td>
                  <td className="px-5 py-3 text-right text-yellow-600">{row.late}</td>
                  <td className="px-5 py-3 text-right text-red-600">{row.absent}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
