'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { AddVanModal } from './AddVanModal'
import { Plus, Pencil, Truck } from 'lucide-react'
import type { Van } from '@/types'

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger'> = {
  available: 'success',
  in_use: 'warning',
  maintenance: 'danger',
}

const STATUS_LABELS: Record<string, string> = {
  available: 'Available',
  in_use: 'In Use',
  maintenance: 'Maintenance',
}

const NEXT_STATUS: Record<string, 'available' | 'in_use' | 'maintenance'> = {
  available: 'maintenance',
  in_use: 'available',
  maintenance: 'available',
}

const STATUS_DOT: Record<string, string> = {
  available: 'bg-success',
  in_use: 'bg-warning',
  maintenance: 'bg-error',
}

export function VansPageClient({ vans }: { vans: Van[] }) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Van | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  const openAdd = () => { setEditing(null); setModalOpen(true) }
  const openEdit = (v: Van) => { setEditing(v); setModalOpen(true) }

  const cycleStatus = async (van: Van) => {
    setToggling(van.id)
    await fetch(`/api/vans/${van.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: NEXT_STATUS[van.status] }),
    })
    setToggling(null)
    router.refresh()
  }

  const counts = {
    available: vans.filter((v) => v.status === 'available').length,
    in_use: vans.filter((v) => v.status === 'in_use').length,
    maintenance: vans.filter((v) => v.status === 'maintenance').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-base-content">Vehicles</h1>
          <p className="text-sm text-base-content/60">{vans.length} total</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Van
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Available', count: counts.available, dot: 'bg-success' },
          { label: 'In Use', count: counts.in_use, dot: 'bg-warning' },
          { label: 'Maintenance', count: counts.maintenance, dot: 'bg-error' },
        ].map((s) => (
          <div key={s.label} className="rounded-box border bg-base-100 p-4 shadow-sm text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className={`h-2 w-2 rounded-full ${s.dot}`} />
              <p className="text-xs text-base-content/60">{s.label}</p>
            </div>
            <p className="text-2xl font-bold text-base-content">{s.count}</p>
          </div>
        ))}
      </div>

      {/* Van cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {vans.map((van) => (
          <div
            key={van.id}
            className="rounded-box border bg-base-100 p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Truck className="h-5 w-5 text-primary" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-semibold text-base-content leading-tight">{van.name}</p>
                <p className="text-xs text-base-content/40 mt-0.5">{van.plate ?? 'No plate'}</p>
              </div>

              <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_DOT[van.status]}`} />
            </div>

            <div className="mt-3 flex items-center justify-between border-t pt-3">
              <button
                onClick={() => cycleStatus(van)}
                disabled={toggling === van.id}
                title="Click to cycle status"
                className="disabled:opacity-60"
              >
                <Badge variant={STATUS_VARIANT[van.status]}>
                  {STATUS_LABELS[van.status]}
                </Badge>
              </button>

              <button
                onClick={() => openEdit(van)}
                className="flex items-center gap-1 text-xs text-base-content/40 hover:text-base-content/70"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>
            </div>
          </div>
        ))}

        {vans.length === 0 && (
          <div className="col-span-full rounded-box border bg-base-100 p-10 text-center shadow-sm">
            <Truck className="mx-auto mb-3 h-8 w-8 text-base-content/20" />
            <p className="text-sm text-base-content/40">No vans added yet</p>
          </div>
        )}
      </div>

      <AddVanModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
      />
    </div>
  )
}
