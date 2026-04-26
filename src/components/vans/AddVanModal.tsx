'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import type { Van } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  editing?: Van | null
}

export function AddVanModal({ open, onClose, editing }: Props) {
  const router = useRouter()
  const [form, setForm] = useState({ name: editing?.name ?? '', plate: editing?.plate ?? '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (field: 'name' | 'plate', value: string) =>
    setForm((f) => ({ ...f, [field]: value }))

  const handleClose = () => {
    setForm({ name: '', plate: '' })
    setError(null)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(editing ? `/api/vans/${editing.id}` : '/api/vans', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Failed')
      handleClose()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title={editing ? 'Edit Van' : 'Add Van'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-base-content/80">Van Name</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Van 1"
            className="input input-bordered w-full"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-base-content/80">
            Plate Number <span className="text-base-content/40">(optional)</span>
          </label>
          <input
            type="text"
            value={form.plate}
            onChange={(e) => set('plate', e.target.value)}
            placeholder="e.g. ABC 1234"
            className="input input-bordered w-full"
          />
        </div>
        {error && <div role="alert" className="alert alert-error py-2 text-sm">{error}</div>}
        <div className="flex gap-3 pt-1">
          <Button type="submit" loading={submitting} className="flex-1">
            {editing ? 'Save Changes' : 'Add Van'}
          </Button>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  )
}
