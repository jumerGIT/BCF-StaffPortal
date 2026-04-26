import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { AppShell } from '@/components/layout/AppShell'
import { QueryProvider } from '@/components/providers/QueryProvider'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getSession()

  if (!user) redirect('/login')
  if (!profile) redirect('/login')
  if (!profile.isActive) redirect('/login')
  if (profile.mustChangePassword) redirect('/change-password')

  return (
    <QueryProvider>
      <AppShell profile={profile}>{children}</AppShell>
    </QueryProvider>
  )
}
