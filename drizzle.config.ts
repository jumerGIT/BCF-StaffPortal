import { config } from 'dotenv'
import type { Config } from 'drizzle-kit'

config({ path: '.env.local' })

export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // Use pooler (port 6543) — direct port 5432 may be blocked by ISP/network
    url: process.env.DATABASE_URL!,
  },
} satisfies Config
