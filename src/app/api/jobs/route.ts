import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { jobs, jobPhases, jobAssignments, checklistItems, profiles } from '@/lib/db/schema'
import { eq, desc, isNull } from 'drizzle-orm'
import { createJobSchema } from '@/lib/validations/job'
import { writeAuditLog } from '@/lib/db/audit'

const PHASES = ['prep', 'transit', 'setup', 'live', 'teardown'] as const

const DEFAULT_CHECKLIST: { type: 'pre_event' | 'post_event'; label: string }[] = [
  { type: 'pre_event', label: 'Van loaded with all equipment' },
  { type: 'pre_event', label: 'Uniforms / costumes packed' },
  { type: 'pre_event', label: 'Sound system tested and working' },
  { type: 'pre_event', label: 'Decorations packed and accounted for' },
  { type: 'pre_event', label: 'Run of show / guest list confirmed' },
  { type: 'post_event', label: 'All equipment unloaded and stored' },
  { type: 'post_event', label: 'Venue cleaned and cleared' },
  { type: 'post_event', label: 'Lost items checked' },
  { type: 'post_event', label: 'All staff accounted for' },
  { type: 'post_event', label: 'Van secured and returned' },
]

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const allJobs = await db.query.jobs.findMany({
    where: isNull(jobs.deletedAt),
    with: {
      assignments: { with: { user: true, van: true } },
      phases: true,
    },
    orderBy: desc(jobs.date),
  })

  return NextResponse.json(allJobs)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, user.id),
  })
  if (!profile || !['manager', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = createJobSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { title, type, venue, date, shiftStart, shiftEnd, notes, assignments } = parsed.data

  const [job] = await db
    .insert(jobs)
    .values({
      title,
      type,
      venue,
      date,
      shiftStart: shiftStart + ':00',
      shiftEnd: shiftEnd + ':00',
      notes,
    })
    .returning()

  await Promise.all([
    db.insert(jobPhases).values(
      PHASES.map((phase) => ({ jobId: job.id, phase, status: 'pending' as const }))
    ),
    db.insert(checklistItems).values(
      DEFAULT_CHECKLIST.map((item, i) => ({
        jobId: job.id,
        type: item.type,
        label: item.label,
        sortOrder: i,
      }))
    ),
    assignments.length > 0
      ? db.insert(jobAssignments).values(
          assignments.map((a) => ({
            jobId: job.id,
            userId: a.userId,
            role: a.role,
            ...(a.vanId ? { vanId: a.vanId } : {}),
          }))
        )
      : Promise.resolve(),
  ])

  await writeAuditLog({
    entityType: 'job',
    entityId: job.id,
    changedBy: user.id,
    changedByRole: profile.role,
    action: 'created',
    newValue: { title, venue, date, assignments: assignments.length },
  })

  return NextResponse.json(job, { status: 201 })
}
