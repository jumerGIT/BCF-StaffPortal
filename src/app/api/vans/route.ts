import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { vans, profiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const createVanSchema = z.object({
  name: z.string().min(1).max(100),
  plate: z.string().max(20).optional(),
  status: z.enum(['available', 'in_use', 'maintenance']).optional(),
})

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const allVans = await db.query.vans.findMany()
  return NextResponse.json(allVans)
}

export async function POST(req: NextRequest) {
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
  const parsed = createVanSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const [van] = await db.insert(vans).values(parsed.data).returning()
  return NextResponse.json(van, { status: 201 })
}
