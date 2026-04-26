import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

// Session mode pooler (port 5432) — supports Drizzle's extended query protocol.
// Transaction mode (port 6543) breaks parameterized queries with Drizzle.
const pool = new Pool({
  host: 'aws-1-ap-northeast-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.alguptfbqkekascenzja',
  password: 'Pa$$w0rd!12345_BCF-Staff-Portal',
  ssl: { rejectUnauthorized: false },
  max: 1, // serverless: PgBouncer handles real pooling; one connection per lambda is enough
  idleTimeoutMillis: 10_000,
})

export const db = drizzle(pool, { schema })
export type DB = typeof db
