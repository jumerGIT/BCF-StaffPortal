import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { timeEntries, profiles, jobs } from '@/lib/db/schema'
import { eq, and, isNull, sql, desc } from 'drizzle-orm'
import { clockInSchema } from '@/lib/validations/attendance'
import { isPrivileged } from '@/lib/roles'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await db.query.profiles.findFirst({ where: eq(profiles.id, user.id) })
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const entries = await db.query.timeEntries.findMany({
    where: isPrivileged(profile.role) ? undefined : eq(timeEntries.userId, user.id),
    with: { user: true, job: true, van: true },
    orderBy: desc(timeEntries.clockIn),
    limit: 100,
  })

  return NextResponse.json(entries)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await db.query.profiles.findFirst({ where: eq(profiles.id, user.id) })
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!profile.isActive) return NextResponse.json({ error: 'Account is inactive' }, { status: 403 })

  const body = await req.json()
  const parsed = clockInSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  // Verify job exists if provided
  if (parsed.data.job_id) {
    const job = await db.query.jobs.findFirst({ where: eq(jobs.id, parsed.data.job_id) })
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  const existing = await db.query.timeEntries.findFirst({
    where: and(
      eq(timeEntries.userId, user.id),
      isNull(timeEntries.clockOut),
      sql`DATE(clock_in) = CURRENT_DATE`
    ),
  })
  if (existing) return NextResponse.json({ error: 'Already clocked in' }, { status: 422 })

  const [entry] = await db
    .insert(timeEntries)
    .values({
      userId: user.id,
      jobId: parsed.data.job_id,
      vanId: parsed.data.van_id,
      clockIn: new Date(),
      entrySource: 'self_clockin',
      enteredBy: user.id,
      attendanceStatus: 'present',
      status: 'pending',
    })
    .returning()

  return NextResponse.json(entry, { status: 201 })
}
