import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { timeEntries, profiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { manualEntrySchema } from '@/lib/validations/attendance'
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
  const parsed = manualEntrySchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { job_id, user_id, date, clock_in, clock_out, note, attendance_status } = parsed.data

  // Absent entries have no times
  const clockIn = attendance_status !== 'absent'
    ? new Date(`${date}T${clock_in}:00`)
    : new Date(`${date}T00:00:00`)
  const clockOut = attendance_status !== 'absent' && clock_out
    ? new Date(`${date}T${clock_out}:00`)
    : undefined

  if (clockOut && clockOut <= clockIn)
    return NextResponse.json({ error: 'Clock out must be after clock in' }, { status: 422 })

  const totalHours = clockOut
    ? ((clockOut.getTime() - clockIn.getTime()) / 3600000).toFixed(2)
    : undefined

  // Site head entries go pending for manager approval; manager/admin are auto-approved
  const isPrivileged = ['manager', 'admin'].includes(profile.role)

  const [entry] = await db
    .insert(timeEntries)
    .values({
      userId: user_id,
      jobId: job_id || undefined,
      clockIn,
      clockOut,
      totalHours,
      isOvertime: totalHours ? parseFloat(totalHours) > 8 : false,
      entrySource: isPrivileged ? 'admin_manual' : 'site_head',
      enteredBy: user.id,
      siteHeadNote: note,
      attendanceStatus: attendance_status ?? 'present',
      status: isPrivileged ? 'approved' : 'pending',
      approvedBy: isPrivileged ? user.id : undefined,
      approvedAt: isPrivileged ? new Date() : undefined,
    })
    .returning()

  await writeAuditLog({
    entityType: 'time_entry',
    entityId: entry.id,
    changedBy: user.id,
    changedByRole: profile.role,
    action: 'manual_created',
    newValue: { entry_id: entry.id, user_id, job_id },
    note: `Manual entry by ${profile.role}`,
  })

  return NextResponse.json(entry, { status: 201 })
}
