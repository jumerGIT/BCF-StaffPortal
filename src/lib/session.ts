import { cache } from 'react'
import { createClient } from './supabase/server'
import { db } from './db'
import { profiles } from './db/schema'
import { eq } from 'drizzle-orm'

// Deduplicates auth + profile lookup across layout and page within the same request.
export const getSession = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, profile: null }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, user.id),
  })

  return { user, profile: profile ?? null }
})
