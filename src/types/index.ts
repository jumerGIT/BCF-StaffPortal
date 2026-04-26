import type { InferSelectModel } from 'drizzle-orm'
import type {
  profiles,
  jobs,
  jobAssignments,
  jobPhases,
  timeEntries,
  vans,
  auditLogs,
} from '@/lib/db/schema'

export type Profile = InferSelectModel<typeof profiles>
export type Job = InferSelectModel<typeof jobs>
export type JobAssignment = InferSelectModel<typeof jobAssignments>
export type JobPhase = InferSelectModel<typeof jobPhases>
export type TimeEntry = InferSelectModel<typeof timeEntries>
export type Van = InferSelectModel<typeof vans>
export type AuditLog = InferSelectModel<typeof auditLogs>

export type Role = 'admin' | 'manager' | 'site_head' | 'staff'

export type JobWithRelations = Job & {
  assignments: (JobAssignment & { user: Profile; van: Van | null })[]
  phases: JobPhase[]
}

export type TimeEntryWithRelations = TimeEntry & {
  user: Profile
  job: Job | null
  van: Van | null
  enteredBy: Profile
}
