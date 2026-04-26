'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-base-content">BCF Staff Portal</h1>
          <p className="mt-1 text-sm text-base-content/60">Sign in to your account</p>
        </div>

        <form
          onSubmit={handleLogin}
          className="rounded-box border bg-base-100 p-6 shadow-sm space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-base-content/80">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input input-bordered w-full"
              placeholder="you@bcf.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-base-content/80">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input input-bordered w-full"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div role="alert" className="alert alert-error py-2 text-sm">
              {error}
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full">
            Sign in
          </Button>
        </form>
      </div>
    </div>
  )
}
