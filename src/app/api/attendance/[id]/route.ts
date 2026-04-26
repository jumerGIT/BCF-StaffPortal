import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { timeEntries, profiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { writeAuditLog } from '@/lib/db/audit'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const entry = await db.query.timeEntries.findFirst({
    where: eq(timeEntries.id, id),
    with: { user: true, job: true, van: true },
  })
  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const profile = await db.query.profiles.findFirst({ where: eq(profiles.id, user.id) })
  const isPrivileged = profile && ['site_head', 'manager', 'admin'].includes(profile.role)
  if (entry.userId !== user.id && !isPrivileged) {
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
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await db.query.profiles.findFirst({ where: eq(profiles.id, user.id) })
  if (!profile) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const existing = await db.query.timeEntries.findFirst({
    where: eq(timeEntries.id, id),
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isPrivileged = ['site_head', 'manager', 'admin'].includes(profile.role)
  if (existing.userId !== user.id && !isPrivileged) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (existing.userId === user.id && existing.status !== 'pending' && !isPrivileged) {
    return NextResponse.json({ error: 'Cannot edit approved entry' }, { status: 422 })
  }

  const body = await req.json()
  const [updated] = await db
    .update(timeEntries)
    .set({ ...body, updatedAt: new Date() })
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
