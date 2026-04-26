'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export function useAttendance() {
  const queryClient = useQueryClient()

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => fetch('/api/attendance').then((r) => r.json()),
  })

  // Dedicated query for the current user's own active entry — always filtered
  // by the logged-in user, regardless of role (managers see all in /api/attendance
  // which caused their activeEntry to be another user's entry).
  const { data: activeEntry = null } = useQuery({
    queryKey: ['attendance', 'active'],
    queryFn: () => fetch('/api/attendance/active').then((r) => r.json()),
    refetchInterval: 30_000,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['attendance'] })
    queryClient.invalidateQueries({ queryKey: ['attendance', 'active'] })
  }

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
    onSuccess: invalidate,
  })

  const clockOut = useMutation({
    mutationFn: () =>
      fetch('/api/attendance/clock-out', { method: 'POST' }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error)
        return r.json()
      }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['attendance', 'active'] })
      queryClient.setQueryData(['attendance', 'active'], null)
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', 'active'] })
    },
    onSuccess: invalidate,
  })

  return { entries, isLoading, clockIn, clockOut, activeEntry }
}
