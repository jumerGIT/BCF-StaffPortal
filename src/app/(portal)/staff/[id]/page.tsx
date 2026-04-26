import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { profiles, timeEntries } from '@/lib/db/schema'
import { eq, and, gte } from 'drizzle-orm'
import { redirect, notFound } from 'next/navigation'
import { StaffProfileView } from '@/components/staff/StaffProfileView'
import { startOfMonth } from 'date-fns'
import type { Role } from '@/types'

export const dynamic = 'force-dynamic'

export default async function StaffProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [actor, target] = await Promise.all([
    db.query.profiles.findFirst({ where: eq(profiles.id, user.id) }),
    db.query.profiles.findFirst({ where: eq(profiles.id, id) }),
  ])

  if (!actor) redirect('/login')
  if (!target) notFound()

  // Staff can only view their own profile via /profile
  if (!['manager', 'admin'].includes(actor.role) && actor.id !== id)
    redirect('/profile')

  const monthStart = startOfMonth(new Date())
  const [monthData, allData] = await Promise.all([
    db.query.timeEntries.findMany({
      where: and(eq(timeEntries.userId, id), gte(timeEntries.clockIn, monthStart)),
    }),
    db.query.timeEntries.findMany({ where: eq(timeEntries.userId, id) }),
  ])

  const monthHours = monthData.reduce((s, e) => s + (e.totalHours ? parseFloat(String(e.totalHours)) : 0), 0)
  const totalHours = allData.reduce((s, e) => s + (e.totalHours ? parseFloat(String(e.totalHours)) : 0), 0)

  return (
    <div className="mx-auto max-w-2xl">
      <StaffProfileView
        staff={target}
        actorRole={actor.role as Role}
        actorId={actor.id}
        monthHours={monthHours}
        monthEntries={monthData.length}
        totalHours={totalHours}
      />
    </div>
  )
}
