import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { checklistItems, profiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
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

  const { itemId } = await params
  const { is_checked } = await req.json()

  const [updated] = await db
    .update(checklistItems)
    .set({
      isChecked: is_checked,
      checkedBy: is_checked ? user.id : null,
      checkedAt: is_checked ? new Date() : null,
    })
    .where(eq(checklistItems.id, itemId))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(updated)
}
