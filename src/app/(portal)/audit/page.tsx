import { db } from '@/lib/db'
import { auditLogs } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { AuditTable } from '@/components/audit/AuditTable'

export const dynamic = 'force-dynamic'

export default async function AuditPage() {
  const { user, profile } = await getSession()
  if (!user || !profile) redirect('/login')
  if (!['manager', 'admin'].includes(profile.role)) redirect('/dashboard')

  const logs = await db.query.auditLogs.findMany({
    with: { changedBy: true },
    orderBy: desc(auditLogs.createdAt),
    limit: 500,
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-base-content">Audit Log</h1>
        <p className="text-sm text-base-content/60">Track all changes made across the portal</p>
      </div>
      <AuditTable logs={logs} />
    </div>
  )
}
