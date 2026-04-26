import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { timeEntries, profiles } from '@/lib/db/schema'
import { eq, and, gte, lte, sql } from 'drizzle-orm'
import { startOfWeek, endOfWeek, parseISO } from 'date-fns'

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
  const weekParam = searchParams.get('week')
  const baseDate = weekParam ? parseISO(weekParam) : new Date()
  const weekStart = startOfWeek(baseDate)
  const weekEnd = endOfWeek(baseDate)

  const entries = await db.query.timeEntries.findMany({
    where: and(
      gte(timeEntries.clockIn, weekStart),
      lte(timeEntries.clockIn, weekEnd)
    ),
    with: { user: true, job: true },
  })

  const summary = entries.reduce(
    (acc, e) => {
      const uid = e.userId
      if (!acc[uid]) {
        acc[uid] = { user: e.user, totalHours: 0, entries: [] }
      }
      acc[uid].totalHours += e.totalHours ? parseFloat(String(e.totalHours)) : 0
      acc[uid].entries.push(e)
      return acc
    },
    {} as Record<string, { user: (typeof entries)[0]['user']; totalHours: number; entries: typeof entries }>
  )

  return NextResponse.json({
    week_start: weekStart.toISOString(),
    week_end: weekEnd.toISOString(),
    staff_summary: Object.values(summary),
    total_entries: entries.length,
  })
}
