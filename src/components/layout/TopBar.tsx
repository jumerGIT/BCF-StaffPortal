'use client'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Menu } from 'lucide-react'
import type { Profile } from '@/types'

const roleVariant: Record<string, 'default' | 'info' | 'warning' | 'purple' | 'success'> = {
  admin:     'purple',
  manager:   'info',
  site_head: 'warning',
  staff:     'default',
}

export function TopBar({ profile, onMenuClick }: { profile: Profile; onMenuClick: () => void }) {
  return (
    <div className="navbar bg-base-100 border-b border-base-300 min-h-14 px-4">
      {/* Left: hamburger (mobile only) */}
      <div className="navbar-start">
        <button
          onClick={onMenuClick}
          className="btn btn-ghost btn-sm btn-square lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-bold text-sm ml-2 lg:hidden">BCF Portal</span>
      </div>

      {/* Right: role badge + name (links to profile) */}
      <div className="navbar-end gap-2">
        <Badge variant={roleVariant[profile.role] ?? 'default'}>
          {profile.role.replace('_', ' ')}
        </Badge>
        <Link
          href="/profile"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="h-8 w-8 rounded-full object-cover ring-2 ring-base-300"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary ring-2 ring-base-300">
              {profile.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
          )}
          <span className="hidden sm:block text-sm font-medium">{profile.name}</span>
        </Link>
      </div>
    </div>
  )
}
