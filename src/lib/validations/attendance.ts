import { z } from 'zod'

export const clockInSchema = z.object({
  job_id: z.string().uuid().optional(),
  van_id: z.string().uuid().optional(),
})

export const clockOutSchema = z.object({
  entry_id: z.string().uuid(),
})

export const manualEntrySchema = z
  .object({
    user_id: z.string().uuid(),
    job_id: z.string().uuid().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    attendance_status: z.enum(['present', 'late', 'absent']).default('present'),
    clock_in: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    clock_out: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    note: z.string().max(255).optional(),
  })
  .refine(
    (d) => {
      if (d.attendance_status !== 'absent' && d.clock_in && d.clock_out) {
        return d.clock_out > d.clock_in
      }
      return true
    },
    { message: 'Clock out must be after clock in', path: ['clock_out'] }
  )

export const bulkEntrySchema = z.object({
  job_id: z.string().uuid(),
  job_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  entries: z
    .array(
      z
        .object({
          user_id: z.string().uuid(),
          attendance_status: z.enum(['present', 'late', 'absent']),
          clock_in: z.string().regex(/^\d{2}:\d{2}$/).optional(),
          clock_out: z.string().regex(/^\d{2}:\d{2}$/).optional(),
          note: z.string().max(255).optional(),
        })
        .refine(
          (d) => {
            if (d.attendance_status !== 'absent' && d.clock_in && d.clock_out) {
              return d.clock_out > d.clock_in
            }
            return true
          },
          { message: 'Clock out must be after clock in', path: ['clock_out'] }
        )
    )
    .min(1)
    .max(50),
})

// Used by the approve route (no body needed)
export const approvalSchema = z.object({})

// Used by the reject route — reason is required
export const rejectionSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required').max(500),
})
