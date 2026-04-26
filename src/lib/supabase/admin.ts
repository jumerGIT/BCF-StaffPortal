import { createClient } from '@supabase/supabase-js'

// ONLY use in server-side Route Handlers. Never expose to client.
export const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
