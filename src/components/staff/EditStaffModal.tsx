'use client'
import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import type { Profile, Role } from '@/types'

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'site_head', label: 'Site Head' },
  { value: 'staff', label: 'Staff' },
]

interface Props {
  open: boolean
  onClose: () => void
  staff: Profile
  currentRole: Role
  onSaved: (updated: Profile) => void
}

export function EditStaffModal({ open, onClose, staff, currentRole, onSaved }: Props) {
  const [form, setForm] = useState({
    name: staff.name,
    email: staff.email,
    role: staff.role as Role,
    phone: staff.phone ?? '',
    isActive: staff.isActive,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setForm({
      name: staff.name,
      email: staff.email,
      role: staff.role as Role,
      phone: staff.phone ?? '',
      isActive: staff.isActive,
    })
    setError(null)
  }, [staff])

  const set = (field: string, value: string | boolean) =>
    setForm((f) => ({ ...f, [field]: value }))

  const allowedRoles = currentRole === 'admin'
    ? ROLE_OPTIONS
    : ROLE_OPTIONS.filter((r) => ['site_head', 'staff'].includes(r.value))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/staff/${staff.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, phone: form.phone || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Failed to update')
      onSaved(data)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Staff Member">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-base-content/80">Full Name</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            className="input input-bordered w-full"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-base-content/80">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            className="input input-bordered w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-base-content/80">Role</label>
            <select
              value={form.role}
              onChange={(e) => set('role', e.target.value)}
              className="select select-bordered w-full"
            >
              {allowedRoles.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-base-content/80">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="+63 900 000 0000"
              className="input input-bordered w-full"
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-box border p-3">
          <div>
            <p className="text-sm font-medium text-base-content">Active</p>
            <p className="text-xs text-base-content/50">Inactive staff cannot log in</p>
          </div>
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={form.isActive}
            onChange={(e) => set('isActive', e.target.checked)}
          />
        </div>

        {error && (
          <div role="alert" className="alert alert-error py-2 text-sm">{error}</div>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="submit" loading={submitting} className="flex-1">Save Changes</Button>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  )
}
