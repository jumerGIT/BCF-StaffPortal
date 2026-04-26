'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { AddStaffModal } from './AddStaffModal'
import { EditStaffModal } from './EditStaffModal'
import { Modal } from '@/components/ui/Modal'
import { UserPlus, Pencil, Trash2, KeyRound, Copy, Check } from 'lucide-react'
import type { Profile, Role } from '@/types'

const roleVariant: Record<Role, 'purple' | 'info' | 'warning' | 'default'> = {
  admin: 'purple',
  manager: 'info',
  site_head: 'warning',
  staff: 'default',
}

interface Props {
  currentRole: Role
  currentUserId: string
  initialStaff: Profile[]
}

export function StaffPageClient({ currentRole, currentUserId, initialStaff }: Props) {
  const router = useRouter()
  const [staff, setStaff] = useState<Profile[]>(initialStaff)
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<Profile | null>(null)
  const [deleting, setDeleting] = useState<Profile | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [resetting, setResetting] = useState<Profile | null>(null)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetPassword, setResetPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleSaved = (updated: Profile) => {
    setStaff((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
  }

  const handleAdded = () => router.refresh()

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    setDeleteError(null)
    try {
      const res = await fetch(`/api/staff/${deleting.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Failed to delete')
      setStaff((prev) => prev.filter((s) => s.id !== deleting.id))
      setDeleting(null)
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setDeleteLoading(false)
    }
  }

  const canEdit = (member: Profile) => {
    if (currentRole === 'admin') return member.id !== currentUserId
    if (currentRole === 'manager') return !['admin', 'manager'].includes(member.role)
    return false
  }

  const canDelete = (member: Profile) =>
    currentRole === 'admin' && member.id !== currentUserId

  const handleReset = async (member: Profile) => {
    setResetting(member)
    setResetPassword(null)
    setCopied(false)
    setResetLoading(true)
    try {
      const res = await fetch(`/api/staff/${member.id}/reset-password`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Failed')
      setResetPassword(data.tempPassword)
    } catch (e) {
      setResetting(null)
    } finally {
      setResetLoading(false)
    }
  }

  const copyPassword = async () => {
    if (!resetPassword) return
    await navigator.clipboard.writeText(resetPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-base-content">Staff</h1>
          <p className="text-sm text-base-content/60">
            {staff.filter((s) => s.isActive).length} active · {staff.length} total
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Staff
        </Button>
      </div>

      {/* Role summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(['admin', 'manager', 'site_head', 'staff'] as Role[]).map((r) => (
          <div key={r} className="rounded-box border bg-base-100 p-4 shadow-sm">
            <p className="text-xs text-base-content/60 capitalize">{r.replace('_', ' ')}</p>
            <p className="mt-1 text-2xl font-bold text-base-content">
              {staff.filter((s) => s.role === r).length}
            </p>
          </div>
        ))}
      </div>

      {/* Staff table */}
      <div className="overflow-x-auto rounded-box border bg-base-100 shadow-sm">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Status</th>
              <th>Password</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => (
              <tr
                key={member.id}
                className="hover cursor-pointer"
                onClick={() => router.push(`/staff/${member.id}`)}
              >
                <td>
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-base-content">{member.name}</span>
                  </div>
                </td>
                <td className="text-base-content/60">{member.email}</td>
                <td className="text-base-content/60">{member.phone ?? '—'}</td>
                <td>
                  <Badge variant={roleVariant[member.role as Role]}>
                    {member.role.replace('_', ' ')}
                  </Badge>
                </td>
                <td>
                  <Badge variant={member.isActive ? 'success' : 'danger'}>
                    {member.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td>
                  {member.mustChangePassword ? (
                    <Badge variant="warning">Temporary</Badge>
                  ) : (
                    <Badge variant="success">Ok</Badge>
                  )}
                </td>
                <td>
                  <div className="flex items-center justify-end gap-1">
                    {canEdit(member) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditing(member) }}
                        className="btn btn-ghost btn-xs gap-1"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                    )}
                    {canEdit(member) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleReset(member) }}
                        className="btn btn-ghost btn-xs gap-1"
                        title="Reset password"
                        disabled={resetLoading && resetting?.id === member.id}
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                        Reset PW
                      </button>
                    )}
                    {canDelete(member) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleting(member); setDeleteError(null) }}
                        className="btn btn-ghost btn-xs text-error hover:bg-error/10 gap-1"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add modal */}
      <AddStaffModal
        open={addOpen}
        onClose={() => { setAddOpen(false); handleAdded() }}
        currentRole={currentRole}
      />

      {/* Edit modal */}
      {editing && (
        <EditStaffModal
          open={!!editing}
          onClose={() => setEditing(null)}
          staff={editing}
          currentRole={currentRole}
          onSaved={handleSaved}
        />
      )}

      {/* Reset password result modal */}
      <Modal
        open={!!resetting && !!resetPassword}
        onClose={() => { setResetting(null); setResetPassword(null) }}
        title="Password Reset"
      >
        <div className="space-y-4">
          <div role="alert" className="alert alert-success">
            <div>
              <p className="font-semibold">Password reset for {resetting?.name}</p>
              <p className="text-sm opacity-80">Share the temporary password below. They will be prompted to change it on next login.</p>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-base-content/80">Temporary password</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-box border bg-base-200 px-4 py-2.5 font-mono text-base font-semibold tracking-widest text-base-content">
                {resetPassword}
              </code>
              <button onClick={copyPassword} className="btn btn-ghost btn-sm gap-1">
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <Button className="w-full" onClick={() => { setResetting(null); setResetPassword(null) }}>
            Done
          </Button>
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete Staff Member"
      >
        <div className="space-y-4">
          <p className="text-sm text-base-content/70">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-base-content">{deleting?.name}</span>?
            This will permanently remove their account and all associated data.
          </p>

          {deleteError && (
            <div role="alert" className="alert alert-error py-2 text-sm">{deleteError}</div>
          )}

          <div className="flex gap-3 pt-1">
            <Button
              variant="danger"
              loading={deleteLoading}
              onClick={handleDelete}
              className="flex-1"
            >
              Yes, delete
            </Button>
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
