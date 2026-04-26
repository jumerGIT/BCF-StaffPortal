import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { profiles, jobs } from '@/lib/db/schema'
import { eq, isNull } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { AddAttendanceForm } from '@/components/attendance/AddAttendanceForm'

export default async function AddAttendancePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, user.id),
  })
  if (!profile || !['site_head', 'manager', 'admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  const [allStaff, activeJobs] = await Promise.all([
    db.query.profiles.findMany({
      where: eq(profiles.isActive, true),
      orderBy: profiles.name,
    }),
    db.query.jobs.findMany({
      where: isNull(jobs.deletedAt),
      orderBy: jobs.date,
    }),
  ])

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-base-content">Add Attendance</h1>
        <p className="mt-1 text-sm text-base-content/60">
          Search for a staff member and log their attendance.
        </p>
      </div>

      <AddAttendanceForm staff={allStaff} jobs={activeJobs} />
    </div>
  )
}
