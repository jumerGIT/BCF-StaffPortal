import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { jobs, profiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { updateJobSchema } from '@/lib/validations/jobs'

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

  const job = await db.query.jobs.findFirst({
    where: eq(jobs.id, id),
    with: {
      assignments: { with: { user: true, van: true } },
      phases: true,
      timeEntries: { with: { user: true } },
    },
  })
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(job)
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
  if (!profile || !['manager', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = updateJobSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const updateData: Record<string, unknown> = { updatedAt: new Date() }
  if (parsed.data.title) updateData.title = parsed.data.title
  if (parsed.data.type) updateData.type = parsed.data.type
  if (parsed.data.venue) updateData.venue = parsed.data.venue
  if (parsed.data.date) updateData.date = parsed.data.date
  if (parsed.data.shift_start) updateData.shiftStart = parsed.data.shift_start
  if (parsed.data.shift_end) updateData.shiftEnd = parsed.data.shift_end
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes
  if (parsed.data.status) updateData.status = parsed.data.status

  const [updated] = await db
    .update(jobs)
    .set(updateData)
    .where(eq(jobs.id, id))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await db.query.profiles.findFirst({ where: eq(profiles.id, user.id) })
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Soft delete
  await db.update(jobs).set({ deletedAt: new Date() }).where(eq(jobs.id, id))

  return NextResponse.json({ success: true })
}
