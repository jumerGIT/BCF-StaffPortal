import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { StaffPageClient } from '@/components/staff/StaffPageClient'
import type { Role } from '@/types'

export const dynamic = 'force-dynamic'

export default async function StaffPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await db.query.profiles.findFirst({ where: eq(profiles.id, user.id) })
  if (!profile || !['manager', 'admin'].includes(profile.role)) redirect('/dashboard')

  const allStaff = await db.query.profiles.findMany({ orderBy: asc(profiles.name) })

  return (
    <div className="space-y-5">
      <StaffPageClient
        currentRole={profile.role as Role}
        currentUserId={profile.id}
        initialStaff={allStaff}
      />
    </div>
  )
}
