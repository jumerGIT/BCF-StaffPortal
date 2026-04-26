'use client'
import { useJobPhases } from '@/hooks/useJobPhases'
import { cn } from '@/lib/utils'
import { Check, Circle, Loader2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

const PHASE_LABELS: Record<string, string> = {
  prep: 'Prep',
  transit: 'Transit',
  setup: 'Setup',
  live: 'Live',
  teardown: 'Teardown',
}

export function PhaseTracker({
  jobId,
  canAdvance,
}: {
  jobId: string
  canAdvance: boolean
}) {
  const phases = useJobPhases(jobId)
  const queryClient = useQueryClient()

  const advance = useMutation({
    mutationFn: (phase: string) =>
      fetch(`/api/jobs/${jobId}/phases/${phase}`, { method: 'PUT' }).then((r) =>
        r.json()
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobs', jobId] }),
  })

  return (
    <div className="flex items-center gap-2">
      {phases.map((p, idx) => (
        <div key={p.id} className="flex items-center gap-2">
          <button
            disabled={!canAdvance || p.status === 'done' || advance.isPending}
            onClick={() => p.status !== 'done' && advance.mutate(p.phase)}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-medium transition-colors',
              p.status === 'done'
                ? 'border-green-500 bg-green-500 text-white'
                : p.status === 'active'
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-base-300 bg-base-100 text-base-content/40',
              canAdvance && p.status !== 'done' && 'cursor-pointer hover:border-indigo-400'
            )}
            title={PHASE_LABELS[p.phase]}
          >
            {p.status === 'done' ? (
              <Check className="h-3.5 w-3.5" />
            ) : advance.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Circle className="h-3.5 w-3.5" />
            )}
          </button>
          {idx < phases.length - 1 && (
            <div
              className={cn(
                'h-0.5 w-6',
                phases[idx + 1]?.status !== 'pending' ? 'bg-green-400' : 'bg-base-300'
              )}
            />
          )}
        </div>
      ))}
      <div className="ml-2 flex gap-1">
        {phases.map((p) => (
          <span key={p.id} className="text-xs text-base-content/60">
            {p.status === 'done' ? '' : PHASE_LABELS[p.phase]}
          </span>
        )).filter((_, i) => phases[i]?.status !== 'done')}
      </div>
    </div>
  )
}
