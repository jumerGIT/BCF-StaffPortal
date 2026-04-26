'use client'
import { Badge } from '@/components/ui/Badge'
import { formatTime } from '@/lib/utils'
import type { Profile } from '@/types'

type RosterEntry = {
  user: Profile
  status: 'present' | 'late' | 'absent' | 'pending'
  clockIn?: string
  clockOut?: string
}

export function StaffRosterCard({ entries }: { entries: RosterEntry[] }) {
  const statusVariant = {
    present: 'success' as const,
    late: 'warning' as const,
    absent: 'danger' as const,
    pending: 'default' as const,
  }

  return (
    <div className="rounded-box border bg-base-100 shadow-sm">
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold text-base-content">Staff Roster</h3>
      </div>
      <ul className="divide-y">
        {entries.map(({ user, status, clockIn, clockOut }) => (
          <li key={user.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-base-content">{user.name}</p>
              {clockIn && (
                <p className="text-xs text-base-content/60">
                  {formatTime(clockIn)}
                  {clockOut ? ` – ${formatTime(clockOut)}` : ' (active)'}
                </p>
              )}
            </div>
            <Badge variant={statusVariant[status]}>{status}</Badge>
          </li>
        ))}
      </ul>
    </div>
  )
}
