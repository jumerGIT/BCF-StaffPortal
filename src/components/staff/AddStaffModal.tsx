'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Copy, Check } from 'lucide-react'
import type { Role } from '@/types'

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'site_head', label: 'Site Head' },
  { value: 'staff', label: 'Staff' },
]

interface Props {
  open: boolean
  onClose: () => void
  currentRole: Role
}

export function AddStaffModal({ open, onClose, currentRole }: Props) {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', role: 'staff' as Role, phone: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const allowedRoles = currentRole === 'admin'
    ? ROLE_OPTIONS
    : ROLE_OPTIONS.filter((r) => ['site_head', 'staff'].includes(r.value))

  const set = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }))

  const handleClose = () => {
    setForm({ name: '', email: '', role: 'staff', phone: '' })
    setError(null)
    setTempPassword(null)
    setCopied(false)
    onClose()
  }

  const handleDone = () => {
    router.refresh()
    handleClose()
  }

  const copyPassword = async () => {
    if (!tempPassword) return
    await navigator.clipboard.writeText(tempPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Failed to create staff')
      setTempPassword(data.tempPassword)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add Staff Member">
      {tempPassword ? (
        <div className="space-y-4">
          <div role="alert" className="alert alert-success">
            <div>
              <p className="font-semibold">Staff member created!</p>
              <p className="text-sm opacity-80">Share the temporary password below. They will be prompted to change it on first login.</p>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-base-content/80">
              Temporary password
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-box border bg-base-200 px-4 py-2.5 font-mono text-base font-semibold tracking-widest text-base-content">
                {tempPassword}
              </code>
              <button
                type="button"
                onClick={copyPassword}
                className="btn btn-ghost btn-sm gap-1"
              >
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <Button onClick={handleDone} className="w-full">
            Done
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-base-content/80">Full Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Maria Cruz"
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
              placeholder="staff@bcf.com"
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
              <label className="mb-1 block text-sm font-medium text-base-content/80">
                Phone <span className="text-base-content/40">(optional)</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="+63 900 000 0000"
                className="input input-bordered w-full"
              />
            </div>
          </div>

          <div role="alert" className="alert py-2 text-sm">
            <span>A temporary password will be auto-generated. The staff member must change it on first login.</span>
          </div>

          {error && (
            <div role="alert" className="alert alert-error py-2 text-sm">{error}</div>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="submit" loading={submitting} className="flex-1">
              Create Staff
            </Button>
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
