'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { KeyRound } from 'lucide-react'

export default function ChangePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    setError(null)
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(typeof data.error === 'string' ? data.error : 'Failed to update password')
      setLoading(false)
      return
    }
    router.push('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-base-content">Set your password</h1>
          <p className="mt-1 text-sm text-base-content/60">
            You must set a new password before continuing.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-box border bg-base-100 p-6 shadow-sm space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-base-content/80">
              New password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="input input-bordered w-full"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-base-content/80">
              Confirm password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat your new password"
              className="input input-bordered w-full"
            />
          </div>

          {error && (
            <div role="alert" className="alert alert-error py-2 text-sm">{error}</div>
          )}

          <Button type="submit" loading={loading} className="w-full">
            Set password &amp; continue
          </Button>
        </form>
      </div>
    </div>
  )
}
