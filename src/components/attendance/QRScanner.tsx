'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import QrScanner from 'qr-scanner'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { CheckCircle2, XCircle, Camera, RotateCcw, LogOut } from 'lucide-react'
import { formatTime } from '@/lib/utils'

type ScanResult = {
  action: 'clock_in' | 'clock_out'
  staff: { name: string; role: string; email: string }
  entry: { clockIn: string; clockOut?: string }
}

type ScanState = 'scanning' | 'loading' | 'success' | 'error'

export function QRScanner() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<QrScanner | null>(null)

  const [state, setState] = useState<ScanState>('scanning')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const stopScanner = useCallback(() => {
    scannerRef.current?.stop()
    scannerRef.current?.destroy()
    scannerRef.current = null
  }, [])

  const handleScan = useCallback(async (userId: string) => {
    stopScanner()
    setState('loading')
    try {
      const res = await fetch('/api/attendance/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setResult(data)
      setState('success')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Scan failed')
      setState('error')
    }
  }, [stopScanner])

  const startScanner = useCallback(async () => {
    if (!videoRef.current) return
    stopScanner()

    try {
      const scanner = new QrScanner(
        videoRef.current,
        (result) => handleScan(result.data),
        {
          preferredCamera: 'environment',
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      )
      scannerRef.current = scanner
      await scanner.start()
    } catch {
      setErrorMsg('Camera access denied. Please allow camera permission.')
      setState('error')
    }
  }, [handleScan, stopScanner])

  useEffect(() => {
    startScanner()
    return () => stopScanner()
  }, [startScanner, stopScanner])

  const reset = async () => {
    setResult(null)
    setErrorMsg(null)
    setState('scanning')
    setTimeout(() => startScanner(), 50)
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Camera — always mounted so the video ref is available */}
      <div className={state === 'scanning' ? 'w-full max-w-sm' : 'hidden'}>
        <div className="relative overflow-hidden rounded-box border bg-black shadow-sm">
          <video ref={videoRef} className="w-full block" />
        </div>
        <p className="mt-3 text-center text-sm text-base-content/50">
          <Camera className="mr-1 inline h-4 w-4" />
          Point camera at a staff QR code
        </p>
      </div>

      {/* Loading */}
      {state === 'loading' && (
        <div className="flex flex-col items-center gap-3 py-10">
          <span className="loading loading-spinner loading-lg text-primary" />
          <p className="text-sm text-base-content/60">Recording attendance…</p>
        </div>
      )}

      {/* Success */}
      {state === 'success' && result && (
        <div className="w-full max-w-sm space-y-4">
          <div className={`rounded-box border p-5 text-center shadow-sm ${
            result.action === 'clock_in' ? 'bg-success/10 border-success/30' : 'bg-base-100 border-base-300'
          }`}>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
              {result.staff.name.charAt(0).toUpperCase()}
            </div>
            <p className="text-lg font-semibold text-base-content">{result.staff.name}</p>
            <Badge
              variant={result.staff.role === 'admin' ? 'purple' : result.staff.role === 'manager' ? 'info' : result.staff.role === 'site_head' ? 'warning' : 'default'}
              className="mt-1"
            >
              {result.staff.role.replace('_', ' ')}
            </Badge>

            <div className="mt-4 flex items-center justify-center gap-2">
              {result.action === 'clock_in' ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <span className="font-semibold text-success">Clocked In</span>
                </>
              ) : (
                <>
                  <LogOut className="h-5 w-5 text-base-content/60" />
                  <span className="font-semibold text-base-content/70">Clocked Out</span>
                </>
              )}
            </div>
            <p className="mt-1 text-sm text-base-content/50">
              {result.action === 'clock_in'
                ? `at ${formatTime(result.entry.clockIn)}`
                : `at ${formatTime(result.entry.clockOut!)}`}
            </p>
          </div>

          <Button onClick={reset} className="w-full">
            <RotateCcw className="mr-2 h-4 w-4" />
            Scan Next
          </Button>
        </div>
      )}

      {/* Error */}
      {state === 'error' && (
        <div className="w-full max-w-sm space-y-4">
          <div className="rounded-box border border-error/30 bg-error/10 p-5 text-center">
            <XCircle className="mx-auto mb-2 h-10 w-10 text-error" />
            <p className="font-semibold text-base-content">Scan Failed</p>
            <p className="mt-1 text-sm text-base-content/60">{errorMsg}</p>
          </div>
          <Button onClick={reset} className="w-full">
            <RotateCcw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      )}
    </div>
  )
}
