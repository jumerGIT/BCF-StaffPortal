import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { jobs, profiles, vans } from '@/lib/db/schema'
import { and, gte, lte, isNull, eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { JobCard } from '@/components/jobs/JobCard'
import { TimelinePageClient } from '@/components/jobs/TimelinePageClient'
import { startOfWeek, endOfWeek } from 'date-fns'

export default async function TimelinePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, user.id),
  })
  if (!profile) redirect('/login')

  const canAdvance = ['site_head', 'manager', 'admin'].includes(profile.role)
  const canCreate = ['manager', 'admin'].includes(profile.role)

  const weekStart = startOfWeek(new Date())
  const weekEnd = endOfWeek(new Date())

  const [weekJobs, activeStaff, allVans] = await Promise.all([
    db.query.jobs.findMany({
      where: and(
        isNull(jobs.deletedAt),
        gte(jobs.date, weekStart.toISOString().split('T')[0]),
        lte(jobs.date, weekEnd.toISOString().split('T')[0])
      ),
      with: {
        assignments: { with: { user: true, van: true } },
        phases: true,
      },
      orderBy: jobs.date,
    }),
    canCreate
      ? db.query.profiles.findMany({ where: eq(profiles.isActive, true), orderBy: profiles.name })
      : Promise.resolve([]),
    canCreate
      ? db.query.vans.findMany({ orderBy: (v, { asc }) => asc(v.name) })
      : Promise.resolve([]),
  ])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-base-content">This week's installs</h1>
        {canCreate && <TimelinePageClient staff={activeStaff} vans={allVans} />}
      </div>

      {weekJobs.length === 0 ? (
        <div className="rounded-box border bg-base-100 p-8 text-center text-base-content/40">
          No jobs scheduled this week.
        </div>
      ) : (
        weekJobs.map((job) => (
          <JobCard key={job.id} job={job} canAdvancePhase={canAdvance} />
        ))
      )}
    </div>
  )
}
