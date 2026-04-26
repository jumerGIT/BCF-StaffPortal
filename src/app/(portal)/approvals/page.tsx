import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { timeEntries, profiles } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { ApprovalCard } from '@/components/attendance/ApprovalCard'
import type { TimeEntryWithRelations } from '@/types'

export default async function ApprovalsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, user.id),
  })
  if (!profile || !['manager', 'admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  const pending = await db.query.timeEntries.findMany({
    where: eq(timeEntries.status, 'pending'),
    with: { user: true, job: true, van: true, enteredBy: true },
    orderBy: desc(timeEntries.clockIn),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-base-content">Approvals</h1>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          {pending.length} pending
        </span>
      </div>

      {pending.length === 0 ? (
        <div className="rounded-box border bg-base-100 p-8 text-center text-base-content/40">
          All caught up! No pending approvals.
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((entry) => (
            <ApprovalCard key={entry.id} entry={entry as TimeEntryWithRelations} />
          ))}
        </div>
      )}
    </div>
  )
}
