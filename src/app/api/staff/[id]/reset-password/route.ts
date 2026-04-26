import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let pw = 'BCF-'
  for (let i = 0; i < 8; i++) pw += chars[Math.floor(Math.random() * chars.length)]
  return pw
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await db.query.profiles.findFirst({ where: eq(profiles.id, user.id) })
  if (!actor || !['manager', 'admin'].includes(actor.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const target = await db.query.profiles.findFirst({ where: eq(profiles.id, id) })
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (actor.role === 'manager' && ['admin', 'manager'].includes(target.role))
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })

  const tempPassword = generateTempPassword()

  const { error } = await adminSupabase.auth.admin.updateUserById(id, { password: tempPassword })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await db.update(profiles)
    .set({ mustChangePassword: true, updatedAt: new Date() })
    .where(eq(profiles.id, id))

  return NextResponse.json({ tempPassword })
}
