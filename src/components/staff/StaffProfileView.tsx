'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StaffQRCode } from './StaffQRCode'
import { EditStaffModal } from './EditStaffModal'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Pencil, KeyRound, Copy, Check, Mail, Phone, CalendarDays, ShieldCheck } from 'lucide-react'
import { formatHours } from '@/lib/utils'
import type { Profile, Role } from '@/types'

const roleVariant: Record<string, 'purple' | 'info' | 'warning' | 'default'> = {
  admin: 'purple', manager: 'info', site_head: 'warning', staff: 'default',
}

interface Props {
  staff: Profile
  actorRole: Role
  actorId: string
  monthHours: number
  monthEntries: number
  totalHours: number
}

export function StaffProfileView({ staff: initial, actorRole, actorId, monthHours, monthEntries, totalHours }: Props) {
  const router = useRouter()
  const [staff, setStaff] = useState(initial)
  const [editOpen, setEditOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const canEdit = actorRole === 'admin'
    ? staff.id !== actorId
    : actorRole === 'manager' && !['admin', 'manager'].includes(staff.role)

  const handleReset = async () => {
    setResetLoading(true)
    try {
      const res = await fetch(`/api/staff/${staff.id}/reset-password`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTempPassword(data.tempPassword)
      setResetOpen(true)
    } finally {
      setResetLoading(false)
    }
  }

  const copy = async () => {
    if (!tempPassword) return
    await navigator.clipboard.writeText(tempPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push('/staff')}
        className="flex items-center gap-1.5 text-sm text-base-content/50 hover:text-base-content/80"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Staff
      </button>

      {/* Profile header card */}
      <div className="rounded-box border bg-base-100 shadow-sm">
        <div className="h-24 rounded-t-box bg-gradient-to-r from-primary/20 to-primary/5" />

        <div className="px-6 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between -mt-12">
            {/* Avatar */}
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-base-100 bg-primary/10 shadow-md ring-2 ring-base-300">
              {staff.avatarUrl ? (
                <img src={staff.avatarUrl} alt={staff.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-primary">
                  {staff.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            {/* Actions */}
            {canEdit && (
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setEditOpen(true)}>
                  <Pencil className="mr-1 h-4 w-4" /> Edit
                </Button>
                <Button size="sm" variant="secondary" loading={resetLoading} onClick={handleReset}>
                  <KeyRound className="mr-1 h-4 w-4" /> Reset PW
                </Button>
              </div>
            )}
          </div>

          {/* Name & badges */}
          <div className="mt-4">
            <h1 className="text-2xl font-bold text-base-content">{staff.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant={roleVariant[staff.role] ?? 'default'}>{staff.role.replace('_', ' ')}</Badge>
              <Badge variant={staff.isActive ? 'success' : 'danger'}>{staff.isActive ? 'Active' : 'Inactive'}</Badge>
              <Badge variant={staff.mustChangePassword ? 'warning' : 'success'}>
                {staff.mustChangePassword ? 'Temp password' : 'Password ok'}
              </Badge>
            </div>
          </div>

          {/* Details */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 shrink-0 text-base-content/40" />
              <span className="text-base-content/70">{staff.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 shrink-0 text-base-content/40" />
              <span className="text-base-content/70">{staff.phone ?? '—'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CalendarDays className="h-4 w-4 shrink-0 text-base-content/40" />
              <span className="text-base-content/70">
                Joined {new Date(staff.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <ShieldCheck className="h-4 w-4 shrink-0 text-base-content/40" />
              <span className="text-base-content/70 capitalize">{staff.role.replace('_', ' ')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats + QR */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-box border bg-base-100 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-base-content">Attendance Summary</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{formatHours(monthHours)}</p>
              <p className="text-xs text-base-content/50 mt-0.5">This month</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-base-content">{monthEntries}</p>
              <p className="text-xs text-base-content/50 mt-0.5">Entries</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-base-content">{formatHours(totalHours)}</p>
              <p className="text-xs text-base-content/50 mt-0.5">All time</p>
            </div>
          </div>
        </div>

        <div className="rounded-box border bg-base-100 p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-base-content">QR Code</h2>
          <StaffQRCode userId={staff.id} name={staff.name} />
        </div>
      </div>

      {/* Edit modal */}
      {editOpen && (
        <EditStaffModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          staff={staff}
          currentRole={actorRole}
          onSaved={(updated) => setStaff(updated)}
        />
      )}

      {/* Reset password result */}
      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Password Reset">
        <div className="space-y-4">
          <div role="alert" className="alert alert-success">
            <div>
              <p className="font-semibold">Password reset for {staff.name}</p>
              <p className="text-sm opacity-80">Share this temporary password. They'll be prompted to change it on next login.</p>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-base-content/80">Temporary password</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-box border bg-base-200 px-4 py-2.5 font-mono text-base font-semibold tracking-widest">
                {tempPassword}
              </code>
              <button onClick={copy} className="btn btn-ghost btn-sm gap-1">
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
          <Button className="w-full" onClick={() => setResetOpen(false)}>Done</Button>
        </div>
      </Modal>
    </div>
  )
}
