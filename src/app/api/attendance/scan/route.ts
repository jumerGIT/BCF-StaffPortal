import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { profiles, timeEntries } from '@/lib/db/schema'
import { eq, and, isNull, sql } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await db.query.profiles.findFirst({ where: eq(profiles.id, user.id) })
  if (!actor || !['site_head', 'manager', 'admin'].includes(actor.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const target = await db.query.profiles.findFirst({ where: eq(profiles.id, userId) })
  if (!target) return NextResponse.json({ error: 'Staff not found' }, { status: 404 })

  // Check for open entry today
  const active = await db.query.timeEntries.findFirst({
    where: and(
      eq(timeEntries.userId, userId),
      isNull(timeEntries.clockOut),
      sql`DATE(clock_in) = CURRENT_DATE`
    ),
  })

  if (active) {
    // Clock out
    const now = new Date()
    const hours = (now.getTime() - new Date(active.clockIn).getTime()) / 3_600_000
    const [entry] = await db
      .update(timeEntries)
      .set({
        clockOut: now,
        totalHours: hours.toFixed(2) as unknown as string,
        updatedAt: now,
      })
      .where(eq(timeEntries.id, active.id))
      .returning()
    return NextResponse.json({ action: 'clock_out', entry, staff: target })
  }

  // Clock in
  const [entry] = await db
    .insert(timeEntries)
    .values({
      userId,
      clockIn: new Date(),
      entrySource: 'site_head',
      enteredBy: user.id,
      attendanceStatus: 'present',
      status: 'pending',
    })
    .returning()

  return NextResponse.json({ action: 'clock_in', entry, staff: target })
}
