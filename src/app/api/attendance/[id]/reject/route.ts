import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { timeEntries, profiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { writeAuditLog } from '@/lib/db/audit'
import { approvalSchema } from '@/lib/validations/attendance'

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

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, user.id),
  })
  if (!profile || !['manager', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = approvalSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const [entry] = await db
    .update(timeEntries)
    .set({
      status: 'rejected',
      rejectionReason: parsed.data.reason,
      updatedAt: new Date(),
    })
    .where(eq(timeEntries.id, id))
    .returning()

  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await writeAuditLog({
    entityType: 'time_entry',
    entityId: id,
    changedBy: user.id,
    changedByRole: profile.role,
    action: 'rejected',
    newValue: { status: 'rejected', reason: parsed.data.reason },
  })

  return NextResponse.json(entry)
}
