import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { timeEntries } from '@/lib/db/schema'
import { and, eq, isNull, sql } from 'drizzle-orm'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json(null)

  const entry = await db.query.timeEntries.findFirst({
    where: and(
      eq(timeEntries.userId, user.id),
      isNull(timeEntries.clockOut),
      sql`DATE(clock_in) = CURRENT_DATE`
    ),
  })

  return NextResponse.json(entry ?? null)
}
