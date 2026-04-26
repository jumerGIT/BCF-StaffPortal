'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export function useAttendance() {
  const queryClient = useQueryClient()

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => fetch('/api/attendance').then((r) => r.json()),
  })

  const clockIn = useMutation({
    mutationFn: (body: { job_id?: string; van_id?: string }) =>
      fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error)
        return r.json()
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance'] }),
  })

  const clockOut = useMutation({
    mutationFn: () =>
      fetch('/api/attendance/clock-out', { method: 'POST' }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error)
        return r.json()
      }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['attendance'] })
      const previous = queryClient.getQueryData(['attendance'])
      queryClient.setQueryData(['attendance'], (old: any[] = []) =>
        old.map((e) =>
          !e.clockOut && new Date(e.clockIn).toDateString() === new Date().toDateString()
            ? { ...e, clockOut: new Date().toISOString() }
            : e
        )
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(['attendance'], ctx?.previous)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance'] }),
  })

  const activeEntry = entries.find(
    (e: { clockOut: string | null; clockIn: string }) =>
      !e.clockOut &&
      new Date(e.clockIn).toDateString() === new Date().toDateString()
  )

  return { entries, isLoading, clockIn, clockOut, activeEntry }
}
