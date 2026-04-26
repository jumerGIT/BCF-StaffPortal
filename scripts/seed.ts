import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { profiles, vans, jobs, jobPhases } from '../src/lib/db/schema'
import * as schema from '../src/lib/db/schema'

// Load env BEFORE reading process.env — works because schema imports above
// don't touch process.env at module load time (only drizzle table definitions)
config({ path: '.env.local' })

const PHASES = ['prep', 'transit', 'setup', 'live', 'teardown'] as const

async function seed() {
  // Create clients inside function so env vars are already loaded
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const pool = new Pool({
    host: 'aws-1-ap-northeast-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.alguptfbqkekascenzja',
    password: 'Pa$$w0rd!12345_BCF-Staff-Portal',
    ssl: { rejectUnauthorized: false },
  })
  const db = drizzle(pool, { schema })

  console.log('Seeding users...')
  const users = [
    { email: 'admin@bcf.com', name: 'BCF Admin', role: 'admin' as const },
    { email: 'manager@bcf.com', name: 'R. Mendoza', role: 'manager' as const },
    { email: 'sitehead@bcf.com', name: 'J. Santos', role: 'site_head' as const },
    { email: 'staff1@bcf.com', name: 'Maria Cruz', role: 'staff' as const },
    { email: 'staff2@bcf.com', name: 'Angelo Reyes', role: 'staff' as const },
    { email: 'staff3@bcf.com', name: 'Leo Garcia', role: 'staff' as const },
  ]

  const profileInserts = []
  for (const u of users) {
    const { data, error } = await adminSupabase.auth.admin.createUser({
      email: u.email,
      password: 'bcf2025!',
      email_confirm: true,
    })
    if (error) {
      console.warn(`  Skipped ${u.email}: ${error.message}`)
      continue
    }
    if (data.user) {
      profileInserts.push({ id: data.user.id, name: u.name, email: u.email, role: u.role })
      console.log(`  Created ${u.email}`)
    }
  }
  if (profileInserts.length > 0) {
    await db.insert(profiles).values(profileInserts).onConflictDoNothing()
  }

  console.log('Seeding vans...')
  await db
    .insert(vans)
    .values([
      { name: 'Van 1', plate: 'ABC 123', status: 'available' },
      { name: 'Van 2', plate: 'DEF 456', status: 'available' },
      { name: 'Van 3', plate: 'GHI 789', status: 'available' },
    ])
    .onConflictDoNothing()

  console.log('Seeding sample job...')
  const today = new Date().toISOString().split('T')[0]
  const [job1] = await db
    .insert(jobs)
    .values({
      title: 'BCF Birthday — Riverside Hall',
      type: 'bcf_birthday',
      venue: 'Riverside Hall',
      date: today,
      shiftStart: '08:00',
      shiftEnd: '18:00',
      status: 'in_progress',
    })
    .returning()

  await db.insert(jobPhases).values(
    PHASES.map((phase, i) => ({
      jobId: job1.id,
      phase,
      status: (i < 2 ? 'done' : i === 2 ? 'active' : 'pending') as 'done' | 'active' | 'pending',
    }))
  )

  await pool.end()
  console.log('\nSeed complete.')
}

seed().catch((e) => {
  console.error('Seed failed:', e.message)
  process.exit(1)
})
