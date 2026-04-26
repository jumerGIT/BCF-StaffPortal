import { db } from '@/lib/db'
import { profiles, checklistItems, jobs } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'
import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/session'
import { Badge } from '@/components/ui/Badge'
import { ChecklistSection } from '@/components/jobs/ChecklistSection'
import { JobLiveCard } from '@/components/jobs/JobLiveCard'
import { ArrowLeft, MapPin, Clock } from 'lucide-react'
import Link from 'next/link'
import type { JobWithRelations, TimeEntry } from '@/types'
import type { ChecklistItem } from '@/hooks/useJobChecklist'

export const dynamic = 'force-dynamic'

const JOB_STATUS_VARIANT: Record<string, 'default' | 'info' | 'success' | 'danger' | 'warning'> = {
  scheduled: 'info', in_progress: 'warning', completed: 'success', cancelled: 'danger',
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, profile } = await getSession()
  if (!user || !profile) redirect('/login')

  const { id: jobId } = await params

  const todayStr = new Date().toISOString().split('T')[0]
  const todayStart = new Date(`${todayStr}T00:00:00`)

  const [job, todayEntries, rawChecklist] = await Promise.all([
    db.query.jobs.findFirst({
      where: eq(jobs.id, jobId),
      with: { assignments: { with: { user: true, van: true } }, phases: true },
    }),
    db.query.timeEntries.findMany({
      where: (te, { and, eq, gte, isNull }) =>
        and(eq(te.jobId, jobId), gte(te.clockIn, todayStart), isNull(te.deletedAt)),
    }),
    db.select().from(checklistItems).where(eq(checklistItems.jobId, jobId)).orderBy(asc(checklistItems.sortOrder)),
  ])

  if (!job) notFound()

  const canCheck = ['site_head', 'manager', 'admin'].includes(profile.role)

  const checklist: ChecklistItem[] = rawChecklist.map((item) => ({
    id: item.id,
    job_id: item.jobId,
    type: item.type,
    label: item.label,
    is_checked: item.isChecked,
    checked_by: item.checkedBy,
    checked_at: item.checkedAt ? item.checkedAt.toISOString() : null,
    sort_order: item.sortOrder,
  }))

  return (
    <div className="space-y-5">
      <div>
        <Link href="/jobs" className="mb-3 flex items-center gap-1.5 text-sm text-base-content/60 hover:text-base-content/80">
          <ArrowLeft className="h-4 w-4" />
          Live Board
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-base-content">{job.title}</h1>
              <Badge variant={JOB_STATUS_VARIANT[job.status] ?? 'default'}>{job.status.replace('_', ' ')}</Badge>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-base-content/60">
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.venue}</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{job.date} · {job.shiftStart.slice(0, 5)} – {job.shiftEnd.slice(0, 5)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <p className="mb-3 text-sm font-medium text-base-content/60 uppercase tracking-wide">Live Attendance</p>
          <JobLiveCard job={job as unknown as JobWithRelations} initialEntries={todayEntries as unknown as TimeEntry[]} />
        </div>
        <div>
          <p className="mb-3 text-sm font-medium text-base-content/60 uppercase tracking-wide">Event Checklists</p>
          <ChecklistSection jobId={jobId} initialItems={checklist} canCheck={canCheck} />
        </div>
      </div>

      {job.notes && (
        <div className="rounded-box border bg-base-100 p-4 shadow-sm">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-base-content/40">Notes</p>
          <p className="text-sm text-base-content/80">{job.notes}</p>
        </div>
      )}
    </div>
  )
}
