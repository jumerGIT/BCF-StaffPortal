import { Badge } from '@/components/ui/Badge'
import { PhaseTracker } from './PhaseTracker'
import { formatDate } from '@/lib/utils'
import { MapPin, Clock } from 'lucide-react'
import type { JobWithRelations } from '@/types'

const statusVariant: Record<string, 'default' | 'info' | 'success' | 'danger' | 'warning'> = {
  scheduled: 'info',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'danger',
}

export function JobCard({ job, canAdvancePhase = false }: { job: JobWithRelations; canAdvancePhase?: boolean }) {
  return (
    <div className="rounded-box border bg-base-100 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-base-content">{job.title}</h2>
            <Badge variant={statusVariant[job.status] ?? 'default'}>
              {job.status.replace('_', ' ')}
            </Badge>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-base-content/60">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {job.venue}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDate(job.date)} · {job.shiftStart.slice(0, 5)} – {job.shiftEnd.slice(0, 5)}
            </span>
          </div>
        </div>
        <div className="text-right text-sm text-base-content/60">
          {job.assignments.length} staff
        </div>
      </div>

      <div className="mt-4">
        <PhaseTracker jobId={job.id} canAdvance={canAdvancePhase} />
      </div>

      {job.assignments.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {job.assignments.map((a) => (
            <span
              key={a.id}
              className="inline-flex items-center rounded-full bg-base-200 px-2.5 py-0.5 text-xs text-base-content/80"
            >
              {a.user.name}
              {a.role === 'site_head' && (
                <span className="ml-1 text-primary">★</span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
