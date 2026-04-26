import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'
import { z } from 'zod'
import { isManager } from '@/lib/roles'

const createStaffSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  role: z.enum(['admin', 'manager', 'site_head', 'staff']),
  phone: z.string().max(50).optional(),
})

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let pw = 'BCF-'
  for (let i = 0; i < 8; i++) pw += chars[Math.floor(Math.random() * chars.length)]
  return pw
}

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await db.query.profiles.findFirst({ where: eq(profiles.id, user.id) })
  if (!profile || !isManager(profile.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const all = await db.query.profiles.findMany({ orderBy: asc(profiles.name) })
  return NextResponse.json(all)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await db.query.profiles.findFirst({ where: eq(profiles.id, user.id) })
  if (!profile || !isManager(profile.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = createStaffSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { name, email, role, phone } = parsed.data

  if (profile.role === 'manager' && ['admin', 'manager'].includes(role))
    return NextResponse.json({ error: 'Managers can only add site heads and staff' }, { status: 403 })

  // Check email uniqueness before touching Supabase Auth to avoid orphaned auth users
  const existing = await db.query.profiles.findFirst({ where: eq(profiles.email, email) })
  if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 409 })

  const tempPassword = generateTempPassword()

  const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  })

  if (authError)
    return NextResponse.json({ error: authError.message }, { status: authError.status ?? 400 })

  try {
    const [newProfile] = await db
      .insert(profiles)
      .values({ id: authData.user.id, name, email, role, phone: phone || null, mustChangePassword: true })
      .returning()
    return NextResponse.json({ ...newProfile, tempPassword }, { status: 201 })
  } catch (e: any) {
    // DB insert failed — remove the orphaned auth user
    await adminSupabase.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: 'Failed to create staff profile. Please try again.' }, { status: 500 })
  }
}
