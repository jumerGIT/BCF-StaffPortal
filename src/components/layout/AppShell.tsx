'use client'
import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import type { Profile } from '@/types'

export function AppShell({
  profile,
  children,
}: {
  profile: Profile
  children: React.ReactNode
}) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="drawer lg:drawer-open h-screen">
      <input
        id="app-drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={drawerOpen}
        onChange={() => {}}
        readOnly
      />

      {/* Main content */}
      <div className="drawer-content flex flex-col overflow-hidden">
        <TopBar profile={profile} onMenuClick={() => setDrawerOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-base-200 p-4 lg:p-6">{children}</main>
      </div>

      {/* Sidebar drawer */}
      <div className="drawer-side z-40">
        <label
          htmlFor="app-drawer"
          className="drawer-overlay"
          onClick={() => setDrawerOpen(false)}
        />
        <Sidebar userRole={profile.role} onClose={() => setDrawerOpen(false)} />
      </div>
    </div>
  )
}
