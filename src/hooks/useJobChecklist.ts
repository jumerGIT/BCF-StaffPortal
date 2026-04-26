'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type ChecklistItem = {
  id: string
  job_id: string
  type: 'pre_event' | 'post_event'
  label: string
  is_checked: boolean
  checked_by: string | null
  checked_at: string | null
  sort_order: number
}

export function useJobChecklist(jobId: string, initial: ChecklistItem[]) {
  const [items, setItems] = useState<ChecklistItem[]>(initial)
  const supabase = createClient()

  useEffect(() => {
    setItems(initial)
  }, [jobId])

  useEffect(() => {
    const channel = supabase
      .channel(`checklist:${jobId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'checklist_items', filter: `job_id=eq.${jobId}` },
        (payload) => {
          setItems((prev) =>
            prev.map((item) => (item.id === payload.new.id ? (payload.new as ChecklistItem) : item))
          )
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'checklist_items', filter: `job_id=eq.${jobId}` },
        (payload) => {
          setItems((prev) => [...prev, payload.new as ChecklistItem])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [jobId])

  return { items, setItems }
}
