import { z } from 'zod'

export const createJobSchema = z.object({
  title: z.string().min(1).max(255),
  type: z.enum(['bcf_birthday', 'corporate', 'other']),
  venue: z.string().min(1).max(255),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  shiftStart: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time'),
  shiftEnd: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time'),
  notes: z.string().optional(),
  assignments: z
    .array(
      z.object({
        userId: z.string().uuid(),
        role: z.enum(['site_head', 'driver', 'crew']),
        vanId: z.string().uuid().optional(),
      })
    )
    .default([]),
})

export type CreateJobInput = z.infer<typeof createJobSchema>
