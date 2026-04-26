'use client'
import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { useJobAttendance } from '@/hooks/useJobAttendance'
import { Badge } from '@/components/ui/Badge'
import { PhaseTracker } from './PhaseTracker'
import { MapPin, Clock, Radio, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { JobWithRelations, TimeEntry } from '@/types'

type StaffStatus = 'on_site' | 'completed' | 'expected' | 'absent'

const STATUS_CONFIG: Record<StaffStatus, { label: string; dot: string; text: string }> = {
  on_site:   { label: 'On Site',   dot: 'bg-green-500', text: 'text-green-700' },
  completed: { label: 'Completed', dot: 'bg-blue-500',  text: 'text-blue-700'  },
  expected:  { label: 'Expected',  dot: 'bg-gray-300',  text: 'text-base-content/60'  },
  absent:    { label: 'Absent',    dot: 'bg-red-500',   text: 'text-red-700'   },
}

const JOB_STATUS_VARIANT: Record<string, 'default' | 'info' | 'success' | 'danger' | 'warning'> = {
  scheduled:   'info',
  in_progress: 'warning',
  completed:   'success',
  cancelled:   'danger',
}

function resolveStatus(
  userId: string,
  entries: TimeEntry[],
  shiftStart: string
): { status: StaffStatus; entry: TimeEntry | undefined } {
  const entry = entries.find((e) => e.userId === userId)

  if (!entry) {
    const [h, m] = shiftStart.split(':').map(Number)
    const shiftDate = new Date()
    shiftDate.setHours(h, m, 0, 0)
    return { status: new Date() > shiftDate ? 'absent' : 'expected', entry: undefined }
  }

  if (entry.attendanceStatus === 'absent') return { status: 'absent', entry }
  if (entry.clockOut) return { status: 'completed', entry }
  return { status: 'on_site', entry }
}

function ElapsedTime({ since }: { since: string | Date }) {
  const [, tick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  const mins = Math.floor((Date.now() - new Date(since).getTime()) / 60_000)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return <>{h > 0 ? `${h}h ${m}m` : `${m}m`}</>
}

export function JobLiveCard({
  job,
  initialEntries,
}: {
  job: JobWithRelations
  initialEntries: TimeEntry[]
}) {
  const entries = useJobAttendance(job.id, initialEntries)

  const staffRows = useMemo(
    () =>
      job.assignments.map((a) => ({
        assignment: a,
        ...resolveStatus(a.userId, entries, job.shiftStart),
      })),
    [job.assignments, entries, job.shiftStart]
  )

  const counts = useMemo(
    () =>
      (Object.keys(STATUS_CONFIG) as StaffStatus[]).reduce(
        (acc, s) => ({ ...acc, [s]: staffRows.filter((r) => r.status === s).length }),
        {} as Record<StaffStatus, number>
      ),
    [staffRows]
  )

  return (
    <div className="overflow-hidden rounded-box border bg-base-100 shadow-sm">
      {/* Header */}
      <div className="border-b bg-base-200 px-5 pb-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-semibold text-base-content">{job.title}</h2>
              <Badge variant={JOB_STATUS_VARIANT[job.status] ?? 'default'}>
                {job.status.replace('_', ' ')}
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-base-content/60">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {job.venue}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                {job.shiftStart.slice(0, 5)} – {job.shiftEnd.slice(0, 5)}
              </span>
            </div>
          </div>
          <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-green-600">
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            LIVE
          </span>
        </div>
      </div>

      {/* Phase tracker */}
      <div className="border-b px-5 py-3">
        <PhaseTracker jobId={job.id} canAdvance={false} />
      </div>

      {/* Status summary */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 border-b bg-base-200 px-5 py-2.5 text-xs">
        {(Object.keys(STATUS_CONFIG) as StaffStatus[]).map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className={cn('h-2 w-2 rounded-full', STATUS_CONFIG[s].dot)} />
            <span className={cn('font-medium', STATUS_CONFIG[s].text)}>
              {counts[s]} {STATUS_CONFIG[s].label}
            </span>
          </span>
        ))}
      </div>

      {/* Checklist link */}
      <div className="border-b px-5 py-2">
        <Link
          href={`/jobs/${job.id}`}
          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-indigo-800"
        >
          <ClipboardList className="h-3.5 w-3.5" />
          View checklists &amp; details
        </Link>
      </div>

      {/* Staff rows */}
      <div className="divide-y">
        {staffRows.length === 0 ? (
          <p className="px-5 py-4 text-sm text-base-content/40">No staff assigned</p>
        ) : (
          staffRows.map(({ assignment, status, entry }) => {
            const cfg = STATUS_CONFIG[status]
            const initials = assignment.user.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()

            return (
              <div key={assignment.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {initials}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-base-content">
                    {assignment.user.name}
                    {assignment.role === 'site_head' && (
                      <span className="ml-1 text-xs text-primary">★</span>
                    )}
                  </p>
                  <p className="text-xs capitalize text-base-content/40">
                    {assignment.role.replace('_', ' ')}
                  </p>
                </div>

                <div className={cn('flex items-center gap-1.5 text-xs font-medium', cfg.text)}>
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      cfg.dot,
                      status === 'on_site' && 'animate-pulse'
                    )}
                  />
                  {cfg.label}
                  {status === 'on_site' && entry?.clockIn && (
                    <span className="font-normal text-base-content/40">
                      · <ElapsedTime since={entry.clockIn} />
                    </span>
                  )}
                  {status === 'completed' && entry?.clockIn && entry?.clockOut && (
                    <span className="font-normal text-base-content/40">
                      ·{' '}
                      {(
                        (new Date(entry.clockOut).getTime() -
                          new Date(entry.clockIn).getTime()) /
                        3_600_000
                      ).toFixed(1)}
                      h
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
