'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, CalendarDays, Clock, CheckSquare,
  BarChart3, ScrollText, LogOut, UserCheck, Users, Radio, X, Truck, ScanLine, UserCircle,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const navItems = [
  { href: '/dashboard',      label: 'Dashboard',     icon: LayoutDashboard, roles: ['admin', 'manager', 'site_head', 'staff'] },
  { href: '/profile',        label: 'My Profile',    icon: UserCircle,      roles: ['admin', 'manager', 'site_head', 'staff'] },
  { href: '/jobs',           label: 'Live Board',     icon: Radio,           roles: ['admin', 'manager', 'site_head'] },
  { href: '/timeline',       label: 'Timeline',       icon: CalendarDays,    roles: ['admin', 'manager', 'site_head', 'staff'] },
  { href: '/attendance',     label: 'Attendance',     icon: Clock,           roles: ['admin', 'manager', 'site_head', 'staff'] },
  { href: '/attendance/bulk',label: 'Add Attendance', icon: UserCheck,       roles: ['admin', 'manager', 'site_head'] },
  { href: '/attendance/scan',label: 'Scan QR',        icon: ScanLine,        roles: ['admin', 'manager', 'site_head'] },
  { href: '/staff',          label: 'Staff',          icon: Users,           roles: ['admin', 'manager'] },
  { href: '/vans',           label: 'Vehicles',       icon: Truck,           roles: ['admin', 'manager'] },
  { href: '/approvals',      label: 'Approvals',      icon: CheckSquare,     roles: ['admin', 'manager'] },
  { href: '/reports',        label: 'Reports',        icon: BarChart3,       roles: ['admin', 'manager'] },
  { href: '/audit',          label: 'Audit Log',      icon: ScrollText,      roles: ['admin', 'manager'] },
]

export function Sidebar({ userRole, onClose }: { userRole: string; onClose?: () => void }) {
  const pathname = usePathname()
  const { signOut } = useAuth()

  const visibleItems = navItems.filter((item) => item.roles.includes(userRole))

  return (
    <aside className="flex h-full w-52 flex-col bg-neutral text-neutral-content">
      {/* Brand */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-content/10">
        <div>
          <p className="font-bold text-base leading-tight">BCF Portal</p>
          <p className="text-xs opacity-50">Staff Management</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle text-neutral-content lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <ul className="menu px-3 py-3 gap-0.5">
        {visibleItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded text-sm font-medium py-2.5',
                  active
                    ? 'bg-primary text-primary-content active'
                    : 'text-neutral-content/70 hover:bg-neutral-content/10 hover:text-neutral-content'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>

      {/* Sign out */}
      <div className="px-3 pb-4 pt-2">
        <div className="mb-2 border-t border-neutral-content/10" />
        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-sm font-medium text-neutral-content/70 hover:bg-neutral-content/10 hover:text-neutral-content"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
