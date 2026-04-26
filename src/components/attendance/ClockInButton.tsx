'use client'
import { useState, useEffect } from 'react'
import { useAttendance } from '@/hooks/useAttendance'
import { Button } from '@/components/ui/Button'
import { formatTime } from '@/lib/utils'
import { Clock, CheckCircle2, XCircle, Timer } from 'lucide-react'

type Toast = { message: string; type: 'success' | 'error' }

function useElapsed(clockInTime: string | undefined) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!clockInTime) { setElapsed(0); return }
    const tick = () => setElapsed(Math.floor((Date.now() - new Date(clockInTime).getTime()) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [clockInTime])

  return elapsed
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

export function ClockInButton({ jobId }: { jobId?: string }) {
  const { activeEntry, clockIn, clockOut } = useAttendance()
  const [toast, setToast] = useState<Toast | null>(null)
  const elapsed = useElapsed(activeEntry?.clockIn)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  const handleClock = async () => {
    try {
      if (activeEntry) {
        await clockOut.mutateAsync()
        setToast({ message: 'Clocked out successfully.', type: 'success' })
      } else {
        await clockIn.mutateAsync({ job_id: jobId })
        setToast({ message: `Clocked in at ${formatTime(new Date())}.`, type: 'success' })
      }
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : 'Something went wrong', type: 'error' })
    }
  }

  return (
    <>
      <div className="flex flex-col items-center gap-4">
        {activeEntry ? (
          <>
            {/* Running timer */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-base-content/40">
                <Timer className="h-3.5 w-3.5" />
                Time on shift
              </div>
              <span className="font-mono text-4xl font-bold tabular-nums text-primary">
                {formatElapsed(elapsed)}
              </span>
              <div className="flex items-center gap-1.5 text-sm text-base-content/50">
                <Clock className="h-3.5 w-3.5" />
                Clocked in at {formatTime(activeEntry.clockIn)}
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 text-sm text-base-content/50">
            <Clock className="h-4 w-4" />
            Not clocked in
          </div>
        )}

        <Button
          onClick={handleClock}
          loading={clockIn.isPending || clockOut.isPending}
          variant={activeEntry ? 'danger' : 'primary'}
          size="lg"
          className="w-48"
        >
          {activeEntry ? 'Clock Out' : 'Clock In'}
        </Button>
      </div>

      {toast && (
        <div className="toast toast-end toast-bottom z-50">
          <div className={`alert ${toast.type === 'success' ? 'alert-success' : 'alert-error'} shadow-lg`}>
            {toast.type === 'success'
              ? <CheckCircle2 className="h-5 w-5 shrink-0" />
              : <XCircle className="h-5 w-5 shrink-0" />}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </>
  )
}
