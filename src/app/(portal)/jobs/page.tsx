import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { timeEntries } from '@/lib/db/schema'
import { and, inArray, gte, isNull } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { JobLiveCard } from '@/components/jobs/JobLiveCard'
import type { JobWithRelations, TimeEntry } from '@/types'

export const dynamic = 'force-dynamic'

export default async function JobsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const todayStr = new Date().toISOString().split('T')[0]
  const todayStart = new Date(`${todayStr}T00:00:00`)

  const activeJobs = await db.query.jobs.findMany({
    where: (j, { or, eq, and, isNull }) =>
      and(isNull(j.deletedAt), or(eq(j.date, todayStr), eq(j.status, 'in_progress'))),
    with: {
      assignments: { with: { user: true, van: true } },
      phases: true,
    },
    orderBy: (j, { asc }) => [asc(j.date), asc(j.shiftStart)],
  })

  const jobIds = activeJobs.map((j) => j.id)

  const allEntries: TimeEntry[] =
    jobIds.length > 0
      ? await db
          .select()
          .from(timeEntries)
          .where(
            and(
              inArray(timeEntries.jobId, jobIds),
              gte(timeEntries.clockIn, todayStart),
              isNull(timeEntries.deletedAt)
            )
          )
      : []

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-base-content">Live Board</h1>
        <p className="text-sm text-base-content/60">
          {activeJobs.length} active job{activeJobs.length !== 1 ? 's' : ''} today
        </p>
      </div>

      {activeJobs.length === 0 ? (
        <div className="rounded-box border bg-base-100 p-12 text-center shadow-sm">
          <p className="text-sm text-base-content/40">No jobs scheduled for today</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {activeJobs.map((job) => (
            <JobLiveCard
              key={job.id}
              job={job as unknown as JobWithRelations}
              initialEntries={allEntries.filter((e) => e.jobId === job.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
