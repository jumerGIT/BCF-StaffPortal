'use client'
import { useState } from 'react'
import { useJobChecklist, type ChecklistItem } from '@/hooks/useJobChecklist'
import { cn } from '@/lib/utils'
import { CheckCircle2, Circle, Plus, ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  jobId: string
  initialItems: ChecklistItem[]
  canCheck: boolean
}

function ProgressBar({ checked, total }: { checked: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((checked / total) * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-base-300">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            pct === 100 ? 'bg-green-500' : 'bg-primary/50'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="shrink-0 text-xs text-base-content/60">
        {checked}/{total}
      </span>
    </div>
  )
}

function ItemRow({
  item,
  jobId,
  canCheck,
  onToggle,
}: {
  item: ChecklistItem
  jobId: string
  canCheck: boolean
  onToggle: (id: string, checked: boolean) => void
}) {
  const [busy, setBusy] = useState(false)

  const toggle = async () => {
    if (!canCheck || busy) return
    setBusy(true)
    try {
      await fetch(`/api/jobs/${jobId}/checklist/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_checked: !item.is_checked }),
      })
      onToggle(item.id, !item.is_checked)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!canCheck || busy}
      className={cn(
        'flex w-full items-start gap-3 rounded-box px-3 py-2.5 text-left transition-colors',
        canCheck ? 'hover:bg-base-200 active:bg-base-200' : 'cursor-default',
        busy && 'opacity-60'
      )}
    >
      {item.is_checked ? (
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
      ) : (
        <Circle className="mt-0.5 h-5 w-5 shrink-0 text-base-content/20" />
      )}
      <span
        className={cn(
          'text-sm',
          item.is_checked ? 'text-base-content/40 line-through' : 'text-base-content/80'
        )}
      >
        {item.label}
      </span>
    </button>
  )
}

function Section({
  title,
  items,
  jobId,
  canCheck,
  onToggle,
  addItem,
}: {
  title: string
  items: ChecklistItem[]
  jobId: string
  canCheck: boolean
  onToggle: (id: string, checked: boolean) => void
  addItem: (label: string, type: 'pre_event' | 'post_event') => Promise<void>
}) {
  const [open, setOpen] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const type = items[0]?.type ?? (title === 'Pre-Event' ? 'pre_event' : 'post_event')
  const checkedCount = items.filter((i) => i.is_checked).length

  const handleAdd = async () => {
    if (!newLabel.trim()) return
    setSaving(true)
    await addItem(newLabel.trim(), type)
    setNewLabel('')
    setAdding(false)
    setSaving(false)
  }

  return (
    <div className="rounded-box border bg-base-100 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-base-content">{title}</span>
            {checkedCount === items.length && items.length > 0 && (
              <span className="badge badge-success badge-sm">Complete</span>
            )}
          </div>
          <div className="mt-1">
            <ProgressBar checked={checkedCount} total={items.length} />
          </div>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-base-content/40" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-base-content/40" />
        )}
      </button>

      {open && (
        <div className="border-t">
          {items.length === 0 && (
            <p className="px-4 py-3 text-sm text-base-content/40">No items yet</p>
          )}
          {items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              jobId={jobId}
              canCheck={canCheck}
              onToggle={onToggle}
            />
          ))}

          {canCheck && (
            <div className="border-t px-3 py-2">
              {adding ? (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAdd()
                      if (e.key === 'Escape') { setAdding(false); setNewLabel('') }
                    }}
                    placeholder="Add item…"
                    className="input input-bordered input-sm flex-1"
                  />
                  <button
                    onClick={handleAdd}
                    disabled={saving || !newLabel.trim()}
                    className="btn btn-primary btn-sm"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => { setAdding(false); setNewLabel('') }}
                    className="btn btn-ghost btn-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAdding(true)}
                  className="flex items-center gap-1.5 text-xs text-primary hover:text-primary"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add item
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function ChecklistSection({ jobId, initialItems, canCheck }: Props) {
  const { items, setItems } = useJobChecklist(jobId, initialItems)

  const preItems = items.filter((i) => i.type === 'pre_event').sort((a, b) => a.sort_order - b.sort_order)
  const postItems = items.filter((i) => i.type === 'post_event').sort((a, b) => a.sort_order - b.sort_order)

  const onToggle = (id: string, checked: boolean) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_checked: checked } : item))
    )
  }

  const addItem = async (label: string, type: 'pre_event' | 'post_event') => {
    const res = await fetch(`/api/jobs/${jobId}/checklist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, type }),
    })
    if (res.ok) {
      const newItem = await res.json()
      setItems((prev) => [...prev, newItem])
    }
  }

  return (
    <div className="space-y-3">
      <Section
        title="Pre-Event"
        items={preItems}
        jobId={jobId}
        canCheck={canCheck}
        onToggle={onToggle}
        addItem={addItem}
      />
      <Section
        title="Post-Event"
        items={postItems}
        jobId={jobId}
        canCheck={canCheck}
        onToggle={onToggle}
        addItem={addItem}
      />
    </div>
  )
}
