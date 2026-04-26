import { z } from 'zod'

export const createJobSchema = z.object({
  title: z.string().min(1).max(255),
  type: z.enum(['bcf_birthday', 'corporate', 'other']),
  venue: z.string().min(1).max(255),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  shift_start: z.string().regex(/^\d{2}:\d{2}$/),
  shift_end: z.string().regex(/^\d{2}:\d{2}$/),
  notes: z.string().max(1000).optional(),
})

export const updateJobSchema = createJobSchema.partial().extend({
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
})

export const assignStaffSchema = z.object({
  assignments: z.array(
    z.object({
      user_id: z.string().uuid(),
      van_id: z.string().uuid().optional(),
      role: z.enum(['site_head', 'driver', 'crew']),
    })
  ).min(1),
})
