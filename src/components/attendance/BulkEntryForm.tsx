'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { Profile, Job } from '@/types'

type EntryRow = {
  user_id: string
  attendance_status: 'present' | 'late' | 'absent'
  clock_in: string
  clock_out: string
  note: string
}

export function BulkEntryForm({ job, staff }: { job: Job; staff: Profile[] }) {
  const [rows, setRows] = useState<EntryRow[]>(
    staff.map((s) => ({
      user_id: s.id,
      attendance_status: 'present',
      clock_in: job.shiftStart.slice(0, 5),
      clock_out: job.shiftEnd.slice(0, 5),
      note: '',
    }))
  )
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateRow = (idx: number, patch: Partial<EntryRow>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/attendance/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: job.id,
          job_date: job.date,
          entries: rows,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setSuccess(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div role="alert" className="alert alert-success justify-center">
        Attendance submitted successfully.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="overflow-x-auto rounded-box border">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Staff</th>
              <th>Status</th>
              <th>Clock In</th>
              <th>Clock Out</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const member = staff.find((s) => s.id === row.user_id)!
              return (
                <tr key={row.user_id}>
                  <td className="font-medium">{member.name}</td>
                  <td className="">
                    <select
                      value={row.attendance_status}
                      onChange={(e) =>
                        updateRow(idx, {
                          attendance_status: e.target.value as EntryRow['attendance_status'],
                        })
                      }
                      className="select select-bordered select-sm"
                    >
                      <option value="present">Present</option>
                      <option value="late">Late</option>
                      <option value="absent">Absent</option>
                    </select>
                  </td>
                  <td className="">
                    <input
                      type="time"
                      value={row.clock_in}
                      disabled={row.attendance_status === 'absent'}
                      onChange={(e) => updateRow(idx, { clock_in: e.target.value })}
                      className="input input-bordered input-sm disabled:opacity-50"
                    />
                  </td>
                  <td className="">
                    <input
                      type="time"
                      value={row.clock_out}
                      disabled={row.attendance_status === 'absent'}
                      onChange={(e) => updateRow(idx, { clock_out: e.target.value })}
                      className="input input-bordered input-sm disabled:opacity-50"
                    />
                  </td>
                  <td className="">
                    <input
                      type="text"
                      value={row.note}
                      placeholder="Optional"
                      onChange={(e) => updateRow(idx, { note: e.target.value })}
                      className="input input-bordered input-sm w-full"
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {error && <div role="alert" className="alert alert-error py-2 text-sm">{error}</div>}

      <div className="flex justify-end">
        <Button type="submit" loading={submitting}>
          Submit Attendance
        </Button>
      </div>
    </form>
  )
}
