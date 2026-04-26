'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { TimeEntry } from '@/types'

export function useJobAttendance(jobId: string, initial: TimeEntry[]) {
  const [entries, setEntries] = useState<TimeEntry[]>(initial)
  const supabase = createClient()

  useEffect(() => {
    setEntries(initial)
  }, [jobId])

  useEffect(() => {
    const channel = supabase
      .channel(`attendance:${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'time_entries',
          filter: `job_id=eq.${jobId}`,
        },
        (payload) => {
          setEntries((prev) => [...prev, payload.new as TimeEntry])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'time_entries',
          filter: `job_id=eq.${jobId}`,
        },
        (payload) => {
          setEntries((prev) =>
            prev.map((e) => (e.id === payload.new.id ? (payload.new as TimeEntry) : e))
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [jobId])

  return entries
}
