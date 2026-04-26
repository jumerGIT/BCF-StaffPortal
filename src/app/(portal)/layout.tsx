import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { AppShell } from '@/components/layout/AppShell'
import { QueryProvider } from '@/components/providers/QueryProvider'

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, user.id),
  })

  if (!profile) redirect('/login')
  if (profile.mustChangePassword) redirect('/change-password')

  return (
    <QueryProvider>
      <AppShell profile={profile}>{children}</AppShell>
    </QueryProvider>
  )
}
