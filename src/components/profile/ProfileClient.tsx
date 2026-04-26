'use client'
import { useState } from 'react'
import { AvatarUpload } from './AvatarUpload'
import { StaffQRCode } from '@/components/staff/StaffQRCode'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Pencil, Check, X, Mail, Phone, CalendarDays, ShieldCheck } from 'lucide-react'
import { formatHours } from '@/lib/utils'
import type { Profile } from '@/types'

const roleVariant: Record<string, 'purple' | 'info' | 'warning' | 'default'> = {
  admin: 'purple', manager: 'info', site_head: 'warning', staff: 'default',
}

interface Props {
  profile: Profile
  monthHours: number
  monthEntries: number
  totalHours: number
}

export function ProfileClient({ profile, monthHours, monthEntries, totalHours }: Props) {
  const [data, setData] = useState(profile)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: profile.name, phone: profile.phone ?? '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, phone: form.phone || null }),
      })
      const updated = await res.json()
      if (!res.ok) throw new Error(updated.error ?? 'Failed')
      setData(updated)
      setEditing(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const cancelEdit = () => {
    setForm({ name: data.name, phone: data.phone ?? '' })
    setError(null)
    setEditing(false)
  }

  return (
    <div className="space-y-6">
      {/* Profile header card */}
      <div className="rounded-box border bg-base-100 shadow-sm">
        {/* Banner */}
        <div className="h-24 rounded-t-box bg-gradient-to-r from-primary/20 to-primary/5" />

        <div className="px-6 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between -mt-12">
            {/* Avatar */}
            <AvatarUpload
              userId={data.id}
              avatarUrl={data.avatarUrl ?? null}
              name={data.name}
              onUpdated={(url) => setData((d) => ({ ...d, avatarUrl: url }))}
            />

            {/* Edit / Save buttons */}
            <div className="flex gap-2">
              {editing ? (
                <>
                  <Button size="sm" loading={saving} onClick={handleSave}>
                    <Check className="mr-1 h-4 w-4" /> Save
                  </Button>
                  <Button size="sm" variant="secondary" onClick={cancelEdit}>
                    <X className="mr-1 h-4 w-4" /> Cancel
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
                  <Pencil className="mr-1 h-4 w-4" /> Edit Profile
                </Button>
              )}
            </div>
          </div>

          {/* Name & role */}
          <div className="mt-4">
            {editing ? (
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="input input-bordered input-sm w-full max-w-xs text-xl font-bold"
              />
            ) : (
              <h1 className="text-2xl font-bold text-base-content">{data.name}</h1>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant={roleVariant[data.role] ?? 'default'}>
                {data.role.replace('_', ' ')}
              </Badge>
              <Badge variant={data.isActive ? 'success' : 'danger'}>
                {data.isActive ? 'Active' : 'Inactive'}
              </Badge>
              {data.mustChangePassword && (
                <Badge variant="warning">Password change required</Badge>
              )}
            </div>
          </div>

          {error && (
            <div role="alert" className="alert alert-error mt-3 py-2 text-sm">{error}</div>
          )}

          {/* Details grid */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 shrink-0 text-base-content/40" />
              <span className="text-base-content/70">{data.email}</span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 shrink-0 text-base-content/40" />
              {editing ? (
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+63 900 000 0000"
                  className="input input-bordered input-sm w-full"
                />
              ) : (
                <span className="text-base-content/70">{data.phone ?? '—'}</span>
              )}
            </div>

            <div className="flex items-center gap-3 text-sm">
              <CalendarDays className="h-4 w-4 shrink-0 text-base-content/40" />
              <span className="text-base-content/70">
                Joined {new Date(data.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <ShieldCheck className="h-4 w-4 shrink-0 text-base-content/40" />
              <span className="text-base-content/70 capitalize">{data.role.replace('_', ' ')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats + QR */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Attendance stats */}
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

        {/* QR Code */}
        <div className="rounded-box border bg-base-100 p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-base-content">My QR Code</h2>
          <StaffQRCode userId={data.id} name={data.name} />
        </div>
      </div>
    </div>
  )
}
