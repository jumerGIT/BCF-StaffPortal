import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { Client } from 'pg'
import { config } from 'dotenv'

config({ path: '.env.local' })

async function migrate() {
  const client = new Client({
    host: 'aws-1-ap-northeast-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.alguptfbqkekascenzja',
    password: 'Pa$$w0rd!12345_BCF-Staff-Portal',
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()
  console.log('Connected to Supabase')

  // Create drizzle migrations tracking table
  await client.query(`
    CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
      id serial PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `)

  // Find all .sql files in the drizzle directory
  const drizzleDir = join(process.cwd(), 'drizzle')
  const sqlFiles = readdirSync(drizzleDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  for (const file of sqlFiles) {
    const hash = file.replace('.sql', '')

    // Skip if already applied
    const { rows } = await client.query(
      'SELECT id FROM "__drizzle_migrations" WHERE hash = $1',
      [hash]
    )
    if (rows.length > 0) {
      console.log(`  [skip] ${file} (already applied)`)
      continue
    }

    console.log(`  [apply] ${file}`)
    const sql = readFileSync(join(drizzleDir, file), 'utf8')

    // Split on drizzle's statement-breakpoint marker
    const statements = sql
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    for (const statement of statements) {
      await client.query(statement)
    }

    await client.query(
      'INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES ($1, $2)',
      [hash, Date.now()]
    )
    console.log(`  [done]  ${file}`)
  }

  await client.end()
  console.log('\nAll migrations applied.')
}

migrate().catch((e) => {
  console.error('Migration failed:', e.message)
  process.exit(1)
})
