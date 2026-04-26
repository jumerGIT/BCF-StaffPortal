'use client'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Search, UserCheck, X, CheckCircle } from 'lucide-react'
import type { Profile, Job } from '@/types'

type AttendanceStatus = 'present' | 'late' | 'absent'

interface EntryForm {
  job_id: string
  date: string
  attendance_status: AttendanceStatus
  clock_in: string
  clock_out: string
  note: string
}

const defaultForm = (jobId: string, shiftStart: string, shiftEnd: string, date: string): EntryForm => ({
  job_id: jobId,
  date,
  attendance_status: 'present',
  clock_in: shiftStart,
  clock_out: shiftEnd,
  note: '',
})

export function AddAttendanceForm({ staff, jobs }: { staff: Profile[]; jobs: Job[] }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Profile | null>(null)
  const [submitted, setSubmitted] = useState<Profile[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const today = new Date().toISOString().split('T')[0]
  const defaultJob = jobs[0]

  const [form, setForm] = useState<EntryForm>(
    defaultForm(
      defaultJob?.id ?? '',
      defaultJob?.shiftStart?.slice(0, 5) ?? '08:00',
      defaultJob?.shiftEnd?.slice(0, 5) ?? '18:00',
      today
    )
  )

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return []
    return staff
      .filter(
        (s) =>
          !submitted.find((x) => x.id === s.id) &&
          (s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
      )
      .slice(0, 6)
  }, [query, staff, submitted])

  const selectStaff = (person: Profile) => {
    setSelected(person)
    setQuery('')
    setError(null)
  }

  const handleJobChange = (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId)
    setForm((f) => ({
      ...f,
      job_id: jobId,
      clock_in: job?.shiftStart?.slice(0, 5) ?? f.clock_in,
      clock_out: job?.shiftEnd?.slice(0, 5) ?? f.clock_out,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/attendance/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: selected.id, ...form }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(typeof data.error === 'string' ? data.error : 'Submission failed')
      }
      setSubmitted((prev) => [...prev, selected])
      setSelected(null)
      setQuery('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Submitted list */}
      {submitted.length > 0 && (
        <div role="alert" className="alert alert-success py-3">
          <div className="w-full">
            <p className="mb-2 text-xs font-medium">Added today</p>
            <div className="flex flex-wrap gap-2">
              {submitted.map((s) => (
                <span
                  key={s.id}
                  className="badge badge-sm gap-1"
                >
                  <CheckCircle className="h-3 w-3" />
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      {!selected && (
        <div className="relative">
          <div className="flex items-center gap-2 rounded-box border border-base-300 bg-base-100 px-3 py-2.5 focus-within:border-primary focus-within:ring-1 focus-within:ring-indigo-500">
            <Search className="h-4 w-4 shrink-0 text-base-content/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search staff by name or email..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-base-content/40"
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-base-content/40 hover:text-base-content/70">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {filtered.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-box border bg-base-100 shadow-lg">
              {filtered.map((person) => (
                <li key={person.id}>
                  <button
                    type="button"
                    onClick={() => selectStaff(person)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {person.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-base-content">{person.name}</p>
                      <p className="text-xs text-base-content/60">{person.email}</p>
                    </div>
                    <Badge variant="default" className="ml-auto text-xs">
                      {person.role.replace('_', ' ')}
                    </Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {query.trim().length > 1 && filtered.length === 0 && (
            <p className="mt-2 text-sm text-base-content/40">No staff found for "{query}"</p>
          )}
        </div>
      )}

      {/* Entry form */}
      {selected && (
        <form onSubmit={handleSubmit} className="rounded-box border bg-base-100 p-5 shadow-sm space-y-4">
          {/* Selected staff header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {selected.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-base-content">{selected.name}</p>
                <p className="text-xs text-base-content/60">{selected.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="rounded-box p-1.5 text-base-content/40 hover:bg-base-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Job */}
            <div>
              <label className="mb-1 block text-xs font-medium text-base-content/80">Job</label>
              <select
                value={form.job_id}
                onChange={(e) => handleJobChange(e.target.value)}
                className="select select-bordered w-full"
              >
                <option value="">— No job —</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({j.date})
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="mb-1 block text-xs font-medium text-base-content/80">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="input input-bordered w-full"
              />
            </div>

            {/* Status */}
            <div>
              <label className="mb-1 block text-xs font-medium text-base-content/80">Status</label>
              <div className="flex gap-2">
                {(['present', 'late', 'absent'] as AttendanceStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, attendance_status: s }))}
                    className={`btn btn-sm flex-1 capitalize ${
                      form.attendance_status === s
                        ? s === 'present'
                          ? 'btn-success'
                          : s === 'late'
                          ? 'btn-warning'
                          : 'btn-error'
                        : 'btn-outline btn-ghost'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Times */}
            {form.attendance_status !== 'absent' && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-medium text-base-content/80">Clock In</label>
                  <input
                    type="time"
                    value={form.clock_in}
                    onChange={(e) => setForm((f) => ({ ...f, clock_in: e.target.value }))}
                    className="input input-bordered w-full"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-base-content/80">Clock Out</label>
                  <input
                    type="time"
                    value={form.clock_out}
                    onChange={(e) => setForm((f) => ({ ...f, clock_out: e.target.value }))}
                    className="input input-bordered w-full"
                  />
                </div>
              </>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="mb-1 block text-xs font-medium text-base-content/80">
              Note <span className="text-base-content/40">(optional)</span>
            </label>
            <input
              type="text"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="e.g. arrived by van 2, left early"
              className="input input-bordered w-full"
            />
          </div>

          {error && (
            <div role="alert" className="alert alert-error py-2 text-sm">{error}</div>
          )}

          <div className="flex gap-3">
            <Button type="submit" loading={submitting} className="flex-1">
              <UserCheck className="mr-2 h-4 w-4" />
              Add Attendance
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setSelected(null)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
