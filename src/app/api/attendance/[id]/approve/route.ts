import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { timeEntries, profiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { writeAuditLog } from '@/lib/db/audit'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, user.id),
  })
  if (!profile || !['manager', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [entry] = await db
    .update(timeEntries)
    .set({ status: 'approved', approvedBy: user.id, approvedAt: new Date() })
    .where(eq(timeEntries.id, id))
    .returning()

  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await writeAuditLog({
    entityType: 'time_entry',
    entityId: id,
    changedBy: user.id,
    changedByRole: profile.role,
    action: 'approved',
    newValue: { status: 'approved' },
  })

  return NextResponse.json(entry)
}
