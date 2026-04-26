import { db } from './index'
import { auditLogs } from './schema'
import type { InferInsertModel } from 'drizzle-orm'

type AuditEntry = Omit<InferInsertModel<typeof auditLogs>, 'id' | 'createdAt'>

export async function writeAuditLog(entry: AuditEntry) {
  await db.insert(auditLogs).values(entry)
}
