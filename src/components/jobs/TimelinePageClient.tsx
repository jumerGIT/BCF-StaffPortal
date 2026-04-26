'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { CreateJobModal } from './CreateJobModal'
import { Plus } from 'lucide-react'
import type { Profile, Van } from '@/types'

export function TimelinePageClient({ staff, vans }: { staff: Profile[]; vans: Van[] }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        New Job
      </Button>
      <CreateJobModal open={open} onClose={() => setOpen(false)} staff={staff} vans={vans} />
    </>
  )
}
