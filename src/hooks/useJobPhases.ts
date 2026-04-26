'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Phase = {
  id: string
  job_id: string
  phase: 'prep' | 'transit' | 'setup' | 'live' | 'teardown'
  status: 'pending' | 'active' | 'done'
  completed_at: string | null
}

export function useJobPhases(jobId: string) {
  const [phases, setPhases] = useState<Phase[]>([])
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('job_phases')
      .select('*')
      .eq('job_id', jobId)
      .order('phase')
      .then(({ data }) => setPhases(data ?? []))

    const channel = supabase
      .channel(`phases:${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'job_phases',
          filter: `job_id=eq.${jobId}`,
        },
        (payload) => {
          setPhases((prev) =>
            prev.map((p) => (p.id === payload.new.id ? (payload.new as Phase) : p))
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [jobId])

  return phases
}
