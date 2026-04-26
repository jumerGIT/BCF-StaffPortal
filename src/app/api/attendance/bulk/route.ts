import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { timeEntries, profiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { bulkEntrySchema } from '@/lib/validations/attendance'
import { writeAuditLog } from '@/lib/db/audit'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, user.id),
  })
  if (!profile || !['site_head', 'manager', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = bulkEntrySchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { job_id, entries, job_date } = parsed.data

  const values = entries.map((row) => {
    const clockIn =
      row.attendance_status !== 'absent' && row.clock_in
        ? new Date(`${job_date}T${row.clock_in}:00`)
        : undefined
    const clockOut =
      row.attendance_status !== 'absent' && row.clock_out
        ? new Date(`${job_date}T${row.clock_out}:00`)
        : undefined
    const totalHours =
      clockIn && clockOut
        ? ((clockOut.getTime() - clockIn.getTime()) / 3600000).toFixed(2)
        : undefined

    return {
      userId: row.user_id,
      jobId: job_id,
      clockIn: clockIn ?? new Date(),
      clockOut,
      totalHours,
      isOvertime: totalHours ? parseFloat(totalHours) > 8 : false,
      entrySource: 'site_head' as const,
      enteredBy: user.id,
      attendanceStatus: row.attendance_status,
      siteHeadNote: row.note,
      status: 'pending' as const,
    }
  })

  const inserted = await db.insert(timeEntries).values(values).returning()

  await writeAuditLog({
    entityType: 'time_entry',
    entityId: job_id,
    changedBy: user.id,
    changedByRole: profile.role,
    action: 'bulk_created',
    newValue: { count: inserted.length, job_id },
    note: `Bulk entry by site head for job ${job_id}`,
  })

  return NextResponse.json(
    { created: inserted.length, entries: inserted },
    { status: 201 }
  )
}
