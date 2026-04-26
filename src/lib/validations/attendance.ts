import { z } from 'zod'

export const clockInSchema = z.object({
  job_id: z.string().uuid().optional(),
  van_id: z.string().uuid().optional(),
})

export const clockOutSchema = z.object({
  entry_id: z.string().uuid(),
})

export const manualEntrySchema = z.object({
  user_id: z.string().uuid(),
  job_id: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  attendance_status: z.enum(['present', 'late', 'absent']).default('present'),
  clock_in: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  clock_out: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  note: z.string().max(255).optional(),
})

export const bulkEntrySchema = z.object({
  job_id: z.string().uuid(),
  job_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  entries: z
    .array(
      z.object({
        user_id: z.string().uuid(),
        attendance_status: z.enum(['present', 'late', 'absent']),
        clock_in: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        clock_out: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        note: z.string().max(255).optional(),
      })
    )
    .min(1)
    .max(50),
})

export const approvalSchema = z.object({
  reason: z.string().max(500).optional(),
})
