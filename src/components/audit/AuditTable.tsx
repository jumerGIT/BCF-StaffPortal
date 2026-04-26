'use client'
import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/Badge'
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react'
function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}
import type { AuditLog, Profile } from '@/types'

type LogWithUser = AuditLog & { changedBy: Profile }

const ACTION_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default' | 'purple'> = {
  approved: 'success',
  rejected: 'danger',
  updated: 'warning',
  created: 'info',
  bulk_created: 'info',
  manual_created: 'purple',
  deleted: 'danger',
}

const ROLE_VARIANT: Record<string, 'purple' | 'info' | 'warning' | 'default'> = {
  admin: 'purple',
  manager: 'info',
  site_head: 'warning',
  staff: 'default',
}

type SortCol = 'createdAt' | 'name' | 'action' | 'entityType'
type SortDir = 'asc' | 'desc'

function SortIcon({ col, sortCol, sortDir }: { col: SortCol; sortCol: SortCol; sortDir: SortDir }) {
  if (sortCol !== col) return <ChevronsUpDown className="h-3.5 w-3.5 opacity-30" />
  return sortDir === 'asc'
    ? <ChevronUp className="h-3.5 w-3.5 text-primary" />
    : <ChevronDown className="h-3.5 w-3.5 text-primary" />
}

const PAGE_SIZES = [10, 25, 50] as const

export function AuditTable({ logs }: { logs: LogWithUser[] }) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<10 | 25 | 50>(25)
  const [sortCol, setSortCol] = useState<SortCol>('createdAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const toggleSort = (col: SortCol) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortCol(col)
      setSortDir('desc')
    }
    setPage(1)
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    const rows = !q
      ? logs
      : logs.filter(
          (l) =>
            l.changedBy.name.toLowerCase().includes(q) ||
            l.action.toLowerCase().includes(q) ||
            l.entityType.toLowerCase().includes(q) ||
            (l.note ?? '').toLowerCase().includes(q) ||
            l.changedByRole.toLowerCase().includes(q)
        )

    return [...rows].sort((a, b) => {
      let av: string, bv: string
      if (sortCol === 'createdAt') {
        av = a.createdAt.toISOString()
        bv = b.createdAt.toISOString()
      } else if (sortCol === 'name') {
        av = a.changedBy.name
        bv = b.changedBy.name
      } else if (sortCol === 'action') {
        av = a.action
        bv = b.action
      } else {
        av = a.entityType
        bv = b.entityType
      }
      const cmp = av.localeCompare(bv)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [logs, search, sortCol, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * pageSize
  const pageRows = filtered.slice(start, start + pageSize)

  const handleSearch = (v: string) => { setSearch(v); setPage(1) }
  const handlePageSize = (v: number) => { setPageSize(v as 10 | 25 | 50); setPage(1) }

  const pageWindow = () => {
    const pages: (number | '…')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (safePage > 3) pages.push('…')
      for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) pages.push(i)
      if (safePage < totalPages - 2) pages.push('…')
      pages.push(totalPages)
    }
    return pages
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name, action, entity…"
            className="input input-bordered input-sm w-full pl-9"
          />
        </div>
        <div className="flex shrink-0 items-center gap-2 text-sm text-base-content/60">
          <span className="whitespace-nowrap">Rows per page</span>
          <select
            value={pageSize}
            onChange={(e) => handlePageSize(Number(e.target.value))}
            className="select select-bordered select-sm"
          >
            {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-box border bg-base-100 shadow-sm">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>
                <button
                  onClick={() => toggleSort('createdAt')}
                  className="flex items-center gap-1 font-semibold uppercase tracking-wide text-xs hover:text-primary"
                >
                  Date / Time
                  <SortIcon col="createdAt" sortCol={sortCol} sortDir={sortDir} />
                </button>
              </th>
              <th>
                <button
                  onClick={() => toggleSort('name')}
                  className="flex items-center gap-1 font-semibold uppercase tracking-wide text-xs hover:text-primary"
                >
                  Who
                  <SortIcon col="name" sortCol={sortCol} sortDir={sortDir} />
                </button>
              </th>
              <th>
                <button
                  onClick={() => toggleSort('action')}
                  className="flex items-center gap-1 font-semibold uppercase tracking-wide text-xs hover:text-primary"
                >
                  Action
                  <SortIcon col="action" sortCol={sortCol} sortDir={sortDir} />
                </button>
              </th>
              <th>
                <button
                  onClick={() => toggleSort('entityType')}
                  className="flex items-center gap-1 font-semibold uppercase tracking-wide text-xs hover:text-primary"
                >
                  Entity
                  <SortIcon col="entityType" sortCol={sortCol} sortDir={sortDir} />
                </button>
              </th>
              <th className="font-semibold uppercase tracking-wide text-xs">Note</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-base-content/40">
                  {search ? `No results for "${search}"` : 'No audit entries yet.'}
                </td>
              </tr>
            ) : (
              pageRows.map((log) => (
                <tr key={log.id} className="hover">
                  <td className="whitespace-nowrap text-base-content/60 tabular-nums">
                    {formatDateTime(log.createdAt)}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {log.changedBy.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-base-content leading-tight">{log.changedBy.name}</p>
                        <div className="mt-0.5">
                          <Badge variant={ROLE_VARIANT[log.changedByRole] ?? 'default'}>
                            {log.changedByRole.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge variant={ACTION_VARIANT[log.action] ?? 'default'}>
                      {log.action.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                  <td>
                    <span className="rounded bg-base-200 px-1.5 py-0.5 font-mono text-xs text-base-content/60">
                      {log.entityType}
                    </span>
                  </td>
                  <td className="max-w-xs truncate text-base-content/60">
                    {log.note ?? <span className="text-base-content/30">—</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer: count + pagination */}
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-sm text-base-content/50">
          {filtered.length === 0
            ? 'No results'
            : `Showing ${start + 1}–${Math.min(start + pageSize, filtered.length)} of ${filtered.length} entries`}
        </p>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="btn btn-ghost btn-sm btn-square disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {pageWindow().map((p, i) =>
              p === '…' ? (
                <span key={`ellipsis-${i}`} className="px-1 text-base-content/40">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={`btn btn-sm btn-square ${safePage === p ? 'btn-primary' : 'btn-ghost'}`}
                >
                  {p}
                </button>
              )
            )}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="btn btn-ghost btn-sm btn-square disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
