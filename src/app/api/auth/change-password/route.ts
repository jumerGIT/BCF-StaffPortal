import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 })

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await db
    .update(profiles)
    .set({ mustChangePassword: false, updatedAt: new Date() })
    .where(eq(profiles.id, user.id))

  return NextResponse.json({ ok: true })
}
