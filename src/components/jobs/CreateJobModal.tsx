'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { X, UserPlus } from 'lucide-react'
import type { Profile, Van } from '@/types'

const JOB_TYPES = [
  { value: 'bcf_birthday', label: 'BCF Birthday' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'other', label: 'Other' },
] as const

const ASSIGNMENT_ROLES = [
  { value: 'site_head', label: 'Site Head' },
  { value: 'driver', label: 'Driver' },
  { value: 'crew', label: 'Crew' },
] as const

type AssignmentRole = 'site_head' | 'driver' | 'crew'

interface AssignmentEntry {
  userId: string
  name: string
  role: AssignmentRole
  vanId: string
}

interface Props {
  open: boolean
  onClose: () => void
  staff: Profile[]
  vans: Van[]
}

const EMPTY_FORM = {
  title: '',
  type: 'bcf_birthday' as const,
  venue: '',
  date: '',
  shiftStart: '',
  shiftEnd: '',
  notes: '',
}

export function CreateJobModal({ open, onClose, staff, vans }: Props) {
  const router = useRouter()
  const [form, setForm] = useState(EMPTY_FORM)
  const [assignments, setAssignments] = useState<AssignmentEntry[]>([])
  const [search, setSearch] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (field: keyof typeof EMPTY_FORM, value: string) =>
    setForm((f) => ({ ...f, [field]: value }))

  const assignedIds = useMemo(() => new Set(assignments.map((a) => a.userId)), [assignments])

  const filteredStaff = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return []
    return staff
      .filter(
        (s) =>
          !assignedIds.has(s.id) &&
          (s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
      )
      .slice(0, 6)
  }, [search, staff, assignedIds])

  const addStaff = (s: Profile) => {
    setAssignments((prev) => [...prev, { userId: s.id, name: s.name, role: 'crew', vanId: '' }])
    setSearch('')
  }

  const removeStaff = (userId: string) =>
    setAssignments((prev) => prev.filter((a) => a.userId !== userId))

  const setField = (userId: string, field: 'role' | 'vanId', value: string) =>
    setAssignments((prev) => prev.map((a) => (a.userId === userId ? { ...a, [field]: value } : a)))

  const handleClose = () => {
    setForm(EMPTY_FORM)
    setAssignments([])
    setSearch('')
    setError(null)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          assignments: assignments.map(({ userId, role, vanId }) => ({
            userId,
            role,
            ...(vanId ? { vanId } : {}),
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Failed to create job')
      handleClose()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const availableVans = vans.filter((v) => v.status !== 'maintenance')

  return (
    <Modal open={open} onClose={handleClose} title="Create Job / Install">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Job details */}
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-base-content/80">Job Title</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Santos Birthday Bash"
              className="input input-bordered w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-base-content/80">Type</label>
              <select
                value={form.type}
                onChange={(e) => set('type', e.target.value)}
                className="select select-bordered w-full"
              >
                {JOB_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-base-content/80">Date</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => set('date', e.target.value)}
                className="input input-bordered w-full"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-base-content/80">Venue</label>
            <input
              type="text"
              required
              value={form.venue}
              onChange={(e) => set('venue', e.target.value)}
              placeholder="e.g. Makati Grand Ballroom"
              className="input input-bordered w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-base-content/80">Shift Start</label>
              <input
                type="time"
                required
                value={form.shiftStart}
                onChange={(e) => set('shiftStart', e.target.value)}
                className="input input-bordered w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-base-content/80">Shift End</label>
              <input
                type="time"
                required
                value={form.shiftEnd}
                onChange={(e) => set('shiftEnd', e.target.value)}
                className="input input-bordered w-full"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-base-content/80">
              Notes <span className="text-base-content/40">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Any special instructions…"
              className="textarea textarea-bordered w-full"
            />
          </div>
        </div>

        <div className="border-t" />

        {/* Staff assignments */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-base-content/80">
            Assign Staff <span className="font-normal text-base-content/40">(optional)</span>
          </p>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              autoComplete="off"
              className="input input-bordered w-full"
            />
            {filteredStaff.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-box border bg-base-100 shadow-lg">
                {filteredStaff.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => addStaff(s)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-base-200"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {s.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-base-content">{s.name}</p>
                      <p className="text-xs text-base-content/40 capitalize">{s.role.replace('_', ' ')}</p>
                    </div>
                    <UserPlus className="ml-auto h-4 w-4 text-base-content/40" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Assigned list */}
          {assignments.length > 0 && (
            <div className="space-y-2">
              {assignments.map((a) => (
                <div
                  key={a.userId}
                  className="rounded-box border border-base-200 bg-base-200 p-2.5"
                >
                  {/* Name row */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {a.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <span className="flex-1 text-sm font-medium text-base-content">{a.name}</span>
                    <button
                      type="button"
                      onClick={() => removeStaff(a.userId)}
                      className="text-base-content/40 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {/* Role + Van row */}
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={a.role}
                      onChange={(e) => setField(a.userId, 'role', e.target.value)}
                      className="select select-bordered select-sm w-full"
                    >
                      {ASSIGNMENT_ROLES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                    <select
                      value={a.vanId}
                      onChange={(e) => setField(a.userId, 'vanId', e.target.value)}
                      className="select select-bordered select-sm w-full"
                    >
                      <option value="">— No van —</option>
                      {availableVans.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}{v.plate ? ` (${v.plate})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div role="alert" className="alert alert-error py-2 text-sm">{error}</div>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="submit" loading={submitting} className="flex-1">
            Create Job
          </Button>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  )
}
