import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { checklistItems, profiles } from '@/lib/db/schema'
import { and, eq, asc } from 'drizzle-orm'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: jobId } = await params

  const items = await db
    .select()
    .from(checklistItems)
    .where(eq(checklistItems.jobId, jobId))
    .orderBy(asc(checklistItems.sortOrder))

  return NextResponse.json(items)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id: jobId } = await params
  const { label, type } = await req.json()
  if (!label || !type) return NextResponse.json({ error: 'label and type required' }, { status: 422 })

  const [item] = await db
    .insert(checklistItems)
    .values({ jobId, type, label, sortOrder: 999 })
    .returning()

  return NextResponse.json(item, { status: 201 })
}
