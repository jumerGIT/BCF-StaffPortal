import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { VansPageClient } from '@/components/vans/VansPageClient'

export default async function VansPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await db.query.profiles.findFirst({ where: eq(profiles.id, user.id) })
  if (!profile || !['manager', 'admin'].includes(profile.role)) redirect('/dashboard')

  const allVans = await db.query.vans.findMany({ orderBy: (v, { asc }) => asc(v.name) })

  return <VansPageClient vans={allVans} />
}
