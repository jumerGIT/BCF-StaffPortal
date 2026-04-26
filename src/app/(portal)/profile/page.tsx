import { db } from '@/lib/db'
import { timeEntries } from '@/lib/db/schema'
import { eq, and, gte } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { ProfileClient } from '@/components/profile/ProfileClient'
import { startOfMonth } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const { user, profile } = await getSession()
  if (!user || !profile) redirect('/login')

  const monthStart = startOfMonth(new Date())

  const [monthData, allData] = await Promise.all([
    db.query.timeEntries.findMany({
      where: and(eq(timeEntries.userId, user.id), gte(timeEntries.clockIn, monthStart)),
    }),
    db.query.timeEntries.findMany({ where: eq(timeEntries.userId, user.id) }),
  ])

  const monthHours = monthData.reduce((sum, e) => sum + (e.totalHours ? parseFloat(String(e.totalHours)) : 0), 0)
  const totalHours = allData.reduce((sum, e) => sum + (e.totalHours ? parseFloat(String(e.totalHours)) : 0), 0)

  return (
    <div className="mx-auto max-w-2xl">
      <ProfileClient
        profile={profile}
        monthHours={monthHours}
        monthEntries={monthData.length}
        totalHours={totalHours}
      />
    </div>
  )
}
