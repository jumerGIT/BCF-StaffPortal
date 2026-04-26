import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { jobAssignments, profiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { assignStaffSchema } from '@/lib/validations/jobs'

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

  const assignments = await db.query.jobAssignments.findMany({
    where: eq(jobAssignments.jobId, id),
    with: { user: true, van: true },
  })

  return NextResponse.json(assignments)
}

export async function POST(
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
  const parsed = assignStaffSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const values = parsed.data.assignments.map((a) => ({
    jobId: id,
    userId: a.user_id,
    vanId: a.van_id,
    role: a.role,
  }))

  const inserted = await db
    .insert(jobAssignments)
    .values(values)
    .onConflictDoNothing()
    .returning()

  return NextResponse.json(inserted, { status: 201 })
}
