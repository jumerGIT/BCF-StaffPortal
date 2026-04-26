import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import { asc } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { StaffPageClient } from '@/components/staff/StaffPageClient'
import type { Role } from '@/types'

export const dynamic = 'force-dynamic'

export default async function StaffPage() {
  const { user, profile } = await getSession()
  if (!user || !profile) redirect('/login')
  if (!['manager', 'admin'].includes(profile.role)) redirect('/dashboard')

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
