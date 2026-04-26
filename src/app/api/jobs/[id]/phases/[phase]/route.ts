import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { jobPhases, profiles } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

export async function PUT(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; phase: string }> }
) {
  const { id, phase } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await db.query.profiles.findFirst({ where: eq(profiles.id, user.id) })
  if (!profile || !['site_head', 'manager', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [updated] = await db
    .update(jobPhases)
    .set({
      status: 'done',
      updatedBy: user.id,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(jobPhases.jobId, id),
        eq(jobPhases.phase, phase as 'prep' | 'transit' | 'setup' | 'live' | 'teardown')
      )
    )
    .returning()

  if (!updated) return NextResponse.json({ error: 'Phase not found' }, { status: 404 })

  // Supabase Realtime picks this up automatically
  return NextResponse.json(updated)
}
