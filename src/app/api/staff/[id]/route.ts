import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'manager', 'site_head', 'staff']).optional(),
  phone: z.string().max(50).nullable().optional(),
  isActive: z.boolean().optional(),
})

async function getActor(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const profile = await db.query.profiles.findFirst({ where: eq(profiles.id, user.id) })
  return profile ?? null
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getActor(req)
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['manager', 'admin'].includes(actor.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const target = await db.query.profiles.findFirst({ where: eq(profiles.id, id) })
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Managers cannot edit admins or other managers
  if (actor.role === 'manager' && ['admin', 'manager'].includes(target.role))
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { email, ...rest } = parsed.data

  // Managers cannot assign admin/manager roles
  if (actor.role === 'manager' && rest.role && ['admin', 'manager'].includes(rest.role))
    return NextResponse.json({ error: 'Cannot assign this role' }, { status: 403 })

  // Update email in Supabase auth if changed
  if (email && email !== target.email) {
    const { error } = await adminSupabase.auth.admin.updateUserById(id, { email })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const [updated] = await db
    .update(profiles)
    .set({ ...(email ? { email } : {}), ...rest, updatedAt: new Date() })
    .where(eq(profiles.id, id))
    .returning()

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getActor(req)
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (actor.role !== 'admin')
    return NextResponse.json({ error: 'Only admins can delete staff' }, { status: 403 })

  const { id } = await params
  if (actor.id === id)
    return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 })

  const target = await db.query.profiles.findFirst({ where: eq(profiles.id, id) })
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.delete(profiles).where(eq(profiles.id, id))
  await adminSupabase.auth.admin.deleteUser(id)

  return NextResponse.json({ ok: true })
}
