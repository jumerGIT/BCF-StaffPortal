/**
 * Applies a SQL file to Supabase, handling dollar-quoted strings ($$) correctly.
 */
import { readFileSync } from 'fs'
import { Client } from 'pg'
import { config } from 'dotenv'

config({ path: '.env.local' })

function splitSql(sql: string): string[] {
  const statements: string[] = []
  let current = ''
  let i = 0
  let inDollarQuote = false
  let dollarTag = ''

  // Strip line comments
  sql = sql.replace(/--[^\n]*/g, '')

  while (i < sql.length) {
    // Check for dollar-quote start/end
    if (!inDollarQuote && sql[i] === '$') {
      const tagMatch = sql.slice(i).match(/^\$([A-Za-z_]*)\$/)
      if (tagMatch) {
        inDollarQuote = true
        dollarTag = tagMatch[0]
        current += dollarTag
        i += dollarTag.length
        continue
      }
    }
    if (inDollarQuote && sql.slice(i, i + dollarTag.length) === dollarTag) {
      current += dollarTag
      i += dollarTag.length
      inDollarQuote = false
      dollarTag = ''
      continue
    }
    if (!inDollarQuote && sql[i] === ';') {
      const stmt = current.trim()
      if (stmt) statements.push(stmt)
      current = ''
      i++
      continue
    }
    current += sql[i]
    i++
  }
  const last = current.trim()
  if (last) statements.push(last)
  return statements
}

async function applyFile(filePath: string) {
  const client = new Client({
    host: 'aws-1-ap-northeast-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.alguptfbqkekascenzja',
    password: 'Pa$$w0rd!12345_BCF-Staff-Portal',
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()
  console.log(`Connected — applying ${filePath}`)

  const sql = readFileSync(filePath, 'utf8')
  const statements = splitSql(sql)

  let ok = 0
  let skip = 0
  for (const stmt of statements) {
    if (!stmt.trim()) continue
    try {
      await client.query(stmt)
      ok++
    } catch (e: any) {
      // Ignore "already exists" errors (idempotent)
      if (
        ['42710', '42P16', '42P07', '42723'].includes(e.code) ||
        e.message.includes('already exists')
      ) {
        skip++
      } else {
        console.error(`  [error] ${stmt.slice(0, 80).replace(/\n/g, ' ')}`)
        console.error(`         ${e.message}`)
      }
    }
  }

  await client.end()
  console.log(`Done: ${ok} applied, ${skip} already existed`)
}

const file = process.argv[2]
if (!file) {
  console.error('Usage: tsx scripts/apply-sql.ts <file.sql>')
  process.exit(1)
}

applyFile(file).catch((e) => {
  console.error(e.message)
  process.exit(1)
})
