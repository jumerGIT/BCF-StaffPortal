import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  decimal,
  pgEnum,
  date,
  time,
  unique,
  index,
  jsonb,
  integer,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ── Enums ────────────────────────────────────────────────────────────────────
export const roleEnum = pgEnum('role', ['admin', 'manager', 'site_head', 'staff'])
export const jobTypeEnum = pgEnum('job_type', ['bcf_birthday', 'corporate', 'other'])
export const jobStatusEnum = pgEnum('job_status', ['scheduled', 'in_progress', 'completed', 'cancelled'])
export const phaseEnum = pgEnum('phase', ['prep', 'transit', 'setup', 'live', 'teardown'])
export const phaseStatusEnum = pgEnum('phase_status', ['pending', 'active', 'done'])
export const vanStatusEnum = pgEnum('van_status', ['available', 'in_use', 'maintenance'])
export const assignmentRoleEnum = pgEnum('assignment_role', ['site_head', 'driver', 'crew'])
export const entrySourceEnum = pgEnum('entry_source', ['self_clockin', 'site_head', 'admin_manual'])
export const attendanceStatusEnum = pgEnum('attendance_status', ['present', 'late', 'absent'])
export const approvalStatusEnum = pgEnum('approval_status', ['pending', 'approved', 'rejected'])
export const auditRoleEnum = pgEnum('audit_role', ['staff', 'site_head', 'manager', 'admin'])
export const checklistTypeEnum = pgEnum('checklist_type', ['pre_event', 'post_event'])

// ── Users ─────────────────────────────────────────────────────────────────────
// profiles.id must match auth.users.id — not auto-generated
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  role: roleEnum('role').notNull().default('staff'),
  phone: varchar('phone', { length: 50 }),
  isActive: boolean('is_active').notNull().default(true),
  mustChangePassword: boolean('must_change_password').notNull().default(false),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ── Vans ──────────────────────────────────────────────────────────────────────
export const vans = pgTable('vans', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  plate: varchar('plate', { length: 20 }),
  status: vanStatusEnum('status').notNull().default('available'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ── Jobs ──────────────────────────────────────────────────────────────────────
export const jobs = pgTable('jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  type: jobTypeEnum('type').notNull().default('bcf_birthday'),
  venue: varchar('venue', { length: 255 }).notNull(),
  date: date('date').notNull(),
  shiftStart: time('shift_start').notNull(),
  shiftEnd: time('shift_end').notNull(),
  status: jobStatusEnum('status').notNull().default('scheduled'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

// ── Job Assignments ───────────────────────────────────────────────────────────
export const jobAssignments = pgTable(
  'job_assignments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    jobId: uuid('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    vanId: uuid('van_id').references(() => vans.id, { onDelete: 'set null' }),
    role: assignmentRoleEnum('role').notNull().default('crew'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    uniqJobUser: unique().on(t.jobId, t.userId),
  })
)

// ── Job Phases ────────────────────────────────────────────────────────────────
export const jobPhases = pgTable(
  'job_phases',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    jobId: uuid('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    phase: phaseEnum('phase').notNull(),
    status: phaseStatusEnum('status').notNull().default('pending'),
    updatedBy: uuid('updated_by').references(() => profiles.id, {
      onDelete: 'set null',
    }),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    uniqJobPhase: unique().on(t.jobId, t.phase),
  })
)

// ── Time Entries ──────────────────────────────────────────────────────────────
export const timeEntries = pgTable(
  'time_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id),
    jobId: uuid('job_id').references(() => jobs.id),
    vanId: uuid('van_id').references(() => vans.id, { onDelete: 'set null' }),
    clockIn: timestamp('clock_in').notNull(),
    clockOut: timestamp('clock_out'),
    totalHours: decimal('total_hours', { precision: 5, scale: 2 }),
    isOvertime: boolean('is_overtime').notNull().default(false),
    entrySource: entrySourceEnum('entry_source').notNull().default('self_clockin'),
    enteredBy: uuid('entered_by')
      .notNull()
      .references(() => profiles.id),
    siteHeadNote: text('site_head_note'),
    attendanceStatus: attendanceStatusEnum('attendance_status')
      .notNull()
      .default('present'),
    status: approvalStatusEnum('status').notNull().default('pending'),
    approvedBy: uuid('approved_by').references(() => profiles.id),
    approvedAt: timestamp('approved_at'),
    rejectionReason: text('rejection_reason'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (t) => ({
    userIdx: index('time_entries_user_idx').on(t.userId),
    jobIdx: index('time_entries_job_idx').on(t.jobId),
  })
)

// ── Audit Logs ────────────────────────────────────────────────────────────────
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entityType: varchar('entity_type', { length: 100 }).notNull(),
    entityId: uuid('entity_id').notNull(),
    changedBy: uuid('changed_by')
      .notNull()
      .references(() => profiles.id),
    changedByRole: auditRoleEnum('changed_by_role').notNull(),
    action: varchar('action', { length: 100 }).notNull(),
    oldValue: jsonb('old_value'),
    newValue: jsonb('new_value'),
    note: text('note'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    entityIdx: index('audit_logs_entity_idx').on(t.entityType, t.entityId),
  })
)

// ── Relations ─────────────────────────────────────────────────────────────────
export const profilesRelations = relations(profiles, ({ many }) => ({
  timeEntries: many(timeEntries),
  jobAssignments: many(jobAssignments),
}))

export const jobsRelations = relations(jobs, ({ many }) => ({
  assignments: many(jobAssignments),
  phases: many(jobPhases),
  timeEntries: many(timeEntries),
  checklistItems: many(checklistItems),
}))

export const jobAssignmentsRelations = relations(jobAssignments, ({ one }) => ({
  job: one(jobs, { fields: [jobAssignments.jobId], references: [jobs.id] }),
  user: one(profiles, { fields: [jobAssignments.userId], references: [profiles.id] }),
  van: one(vans, { fields: [jobAssignments.vanId], references: [vans.id] }),
}))

export const jobPhasesRelations = relations(jobPhases, ({ one }) => ({
  job: one(jobs, { fields: [jobPhases.jobId], references: [jobs.id] }),
  updatedBy: one(profiles, { fields: [jobPhases.updatedBy], references: [profiles.id] }),
}))

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  user: one(profiles, { fields: [timeEntries.userId], references: [profiles.id] }),
  job: one(jobs, { fields: [timeEntries.jobId], references: [jobs.id] }),
  van: one(vans, { fields: [timeEntries.vanId], references: [vans.id] }),
  enteredBy: one(profiles, { fields: [timeEntries.enteredBy], references: [profiles.id] }),
}))

export const vansRelations = relations(vans, ({ many }) => ({
  assignments: many(jobAssignments),
  timeEntries: many(timeEntries),
}))

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  changedBy: one(profiles, { fields: [auditLogs.changedBy], references: [profiles.id] }),
}))

// ── Checklist Items ───────────────────────────────────────────────────────────
export const checklistItems = pgTable(
  'checklist_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    jobId: uuid('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    type: checklistTypeEnum('type').notNull(),
    label: varchar('label', { length: 500 }).notNull(),
    isChecked: boolean('is_checked').notNull().default(false),
    checkedBy: uuid('checked_by').references(() => profiles.id, { onDelete: 'set null' }),
    checkedAt: timestamp('checked_at'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    jobIdx: index('checklist_items_job_idx').on(t.jobId),
  })
)

export const checklistItemsRelations = relations(checklistItems, ({ one }) => ({
  job: one(jobs, { fields: [checklistItems.jobId], references: [jobs.id] }),
  checkedByUser: one(profiles, { fields: [checklistItems.checkedBy], references: [profiles.id] }),
}))
