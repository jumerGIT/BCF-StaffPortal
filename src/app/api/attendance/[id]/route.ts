import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { timeEntries, profiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { writeAuditLog } from '@/lib/db/audit'
import { isPrivileged } from '@/lib/roles'
import { z } from 'zod'

// Staff can only update the note on their own pending entry.
const staffUpdateSchema = z.object({
  siteHeadNote: z.string().max(255).optional(),
})

// Privileged roles can also adjust times and attendance status.
const privilegedUpdateSchema = z.object({
  siteHeadNote: z.string().max(255).optional(),
  clockIn: z.string().datetime().optional(),
  clockOut: z.string().datetime().optional(),
  attendanceStatus: z.enum(['present', 'late', 'absent']).optional(),
  totalHours: z.string().optional(),
  isOvertime: z.boolean().optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const entry = await db.query.timeEntries.findFirst({
    where: eq(timeEntries.id, id),
    with: { user: true, job: true, van: true },
  })
  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const profile = await db.query.profiles.findFirst({ where: eq(profiles.id, user.id) })
  if (entry.userId !== user.id && !isPrivileged(profile?.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json(entry)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await db.query.profiles.findFirst({ where: eq(profiles.id, user.id) })
  if (!profile) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const existing = await db.query.timeEntries.findFirst({ where: eq(timeEntries.id, id) })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const privileged = isPrivileged(profile.role)

  if (existing.userId !== user.id && !privileged)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (existing.userId === user.id && existing.status !== 'pending' && !privileged)
    return NextResponse.json({ error: 'Cannot edit approved entry' }, { status: 422 })

  const body = await req.json()
  const schema = privileged ? privilegedUpdateSchema : staffUpdateSchema
  const parsed = schema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  // Validate time ordering if both times are present
  const d = parsed.data as z.infer<typeof privilegedUpdateSchema>
  const newClockIn = d.clockIn ? new Date(d.clockIn) : existing.clockIn
  const newClockOut = d.clockOut ? new Date(d.clockOut) : existing.clockOut
  if (newClockOut && newClockOut <= newClockIn)
    return NextResponse.json({ error: 'Clock out must be after clock in' }, { status: 422 })

  const [updated] = await db
    .update(timeEntries)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(timeEntries.id, id))
    .returning()

  await writeAuditLog({
    entityType: 'time_entry',
    entityId: id,
    changedBy: user.id,
    changedByRole: profile.role,
    action: 'updated',
    oldValue: existing as Record<string, unknown>,
    newValue: updated as Record<string, unknown>,
  })

  return NextResponse.json(updated)
}
