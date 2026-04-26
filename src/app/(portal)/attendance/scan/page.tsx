import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { QRScannerLoader } from '@/components/attendance/QRScannerLoader'
import { ScanLine } from 'lucide-react'

export default async function ScanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await db.query.profiles.findFirst({ where: eq(profiles.id, user.id) })
  if (!profile || !['site_head', 'manager', 'admin'].includes(profile.role))
    redirect('/dashboard')

  return (
    <div className="mx-auto max-w-sm space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <ScanLine className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold text-base-content">Scan Attendance</h1>
        </div>
        <p className="mt-1 text-sm text-base-content/60">
          Scan a staff member's QR code to clock them in or out
        </p>
      </div>
      <QRScannerLoader />
    </div>
  )
}
