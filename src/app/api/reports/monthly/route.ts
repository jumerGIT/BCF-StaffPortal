import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { timeEntries, profiles } from '@/lib/db/schema'
import { eq, and, gte, lte } from 'drizzle-orm'
import { startOfMonth, endOfMonth } from 'date-fns'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await db.query.profiles.findFirst({ where: eq(profiles.id, user.id) })
  if (!profile || !['manager', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()))
  const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1)) - 1
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

  const summary = entries.reduce(
    (acc, e) => {
      const uid = e.userId
      if (!acc[uid]) acc[uid] = { user: e.user, totalHours: 0, overtimeHours: 0, entries: [] }
      const h = e.totalHours ? parseFloat(String(e.totalHours)) : 0
      acc[uid].totalHours += h
      if (e.isOvertime) acc[uid].overtimeHours += Math.max(0, h - 8)
      acc[uid].entries.push(e)
      return acc
    },
    {} as Record<string, { user: (typeof entries)[0]['user']; totalHours: number; overtimeHours: number; entries: typeof entries }>
  )

  return NextResponse.json({
    month: `${year}-${String(month + 1).padStart(2, '0')}`,
    staff_summary: Object.values(summary),
    total_entries: entries.length,
  })
}
