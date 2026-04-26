import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { timeEntries } from '@/lib/db/schema'
import { and, eq, isNull } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const activeEntry = await db.query.timeEntries.findFirst({
    where: and(eq(timeEntries.userId, user.id), isNull(timeEntries.clockOut)),
  })
  if (!activeEntry)
    return NextResponse.json({ error: 'No active clock-in found' }, { status: 422 })

  const clockOut = new Date()
  const totalHours = (
    (clockOut.getTime() - activeEntry.clockIn.getTime()) /
    3600000
  ).toFixed(2)
  const isOvertime = parseFloat(totalHours) > 8

  const [updated] = await db
    .update(timeEntries)
    .set({
      clockOut,
      totalHours,
      isOvertime,
      updatedAt: new Date(),
    })
    .where(eq(timeEntries.id, activeEntry.id))
    .returning()

  return NextResponse.json(updated)
}
