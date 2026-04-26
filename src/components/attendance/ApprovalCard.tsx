'use client'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDate, formatTime, formatHours } from '@/lib/utils'
import type { TimeEntryWithRelations } from '@/types'

export function ApprovalCard({ entry }: { entry: TimeEntryWithRelations }) {
  const queryClient = useQueryClient()
  const [rejectReason, setRejectReason] = useState('')
  const [showReject, setShowReject] = useState(false)

  const approve = useMutation({
    mutationFn: () =>
      fetch(`/api/attendance/${entry.id}/approve`, { method: 'POST' }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance'] }),
  })

  const reject = useMutation({
    mutationFn: () =>
      fetch(`/api/attendance/${entry.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      }).then((r) => r.json()),
    onSuccess: () => {
      setShowReject(false)
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
    },
  })

  return (
    <div className="rounded-box border bg-base-100 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-base-content">{entry.user.name}</p>
          <p className="text-sm text-base-content/60">
            {formatDate(entry.clockIn)} · {formatTime(entry.clockIn)} – {formatTime(entry.clockOut)}
          </p>
          {entry.job && (
            <p className="mt-1 text-xs text-base-content/40">{entry.job.title}</p>
          )}
          {entry.totalHours && (
            <p className="mt-1 text-sm font-medium text-base-content/80">
              {formatHours(entry.totalHours)}
              {entry.isOvertime && (
                <Badge variant="warning" className="ml-2">OT</Badge>
              )}
            </p>
          )}
          {entry.siteHeadNote && (
            <p className="mt-1 text-xs italic text-base-content/60">Note: {entry.siteHeadNote}</p>
          )}
        </div>

        <Badge
          variant={
            entry.status === 'approved'
              ? 'success'
              : entry.status === 'rejected'
              ? 'danger'
              : 'warning'
          }
        >
          {entry.status}
        </Badge>
      </div>

      {entry.status === 'pending' && (
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            variant="primary"
            loading={approve.isPending}
            onClick={() => approve.mutate()}
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => setShowReject((v) => !v)}
          >
            Reject
          </Button>
        </div>
      )}

      {showReject && (
        <div className="mt-3 space-y-2">
          <input
            type="text"
            placeholder="Rejection reason (required)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="input input-bordered input-sm w-full"
          />
          <Button
            size="sm"
            variant="danger"
            loading={reject.isPending}
            disabled={!rejectReason.trim()}
            onClick={() => reject.mutate()}
          >
            Confirm Rejection
          </Button>
        </div>
      )}
    </div>
  )
}
