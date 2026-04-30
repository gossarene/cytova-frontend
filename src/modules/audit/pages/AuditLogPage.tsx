import { Fragment, useMemo, useState } from 'react'
import {
  ScrollText, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
} from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { PageHeader } from '@/components/shared/PageHeader'
import { SearchInput } from '@/components/shared/SearchInput'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { useAuditLogs } from '../api'
import { AuditDiff } from '../components/AuditDiff'
import { formatDateTime } from '@/lib/utils/date'
import { cn } from '@/lib/utils'

const ACTION_STYLES: Record<string, string> = {
  CREATE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  UPDATE: 'border-blue-200 bg-blue-50 text-blue-700',
  DELETE: 'border-red-200 bg-red-50 text-red-600',
  DEACTIVATE: 'border-red-200 bg-red-50 text-red-600',
  LOGIN: 'border-slate-200 bg-slate-50 text-slate-700',
  LOGIN_FAILED: 'border-amber-200 bg-amber-50 text-amber-700',
  VALIDATE: 'border-blue-200 bg-blue-50 text-blue-700',
  PUBLISH: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  CONFIRM: 'border-blue-200 bg-blue-50 text-blue-700',
  CANCEL: 'border-red-200 bg-red-50 text-red-600',
  ROLE_ASSIGN: 'border-purple-200 bg-purple-50 text-purple-700',
  PERMISSION_OVERRIDE: 'border-purple-200 bg-purple-50 text-purple-700',
}

const ACTION_OPTIONS = [
  'all', 'CREATE', 'UPDATE', 'DELETE', 'DEACTIVATE',
  'LOGIN', 'LOGIN_FAILED', 'VALIDATE', 'PUBLISH',
  'CONFIRM', 'CANCEL', 'ROLE_ASSIGN', 'PERMISSION_OVERRIDE',
]

const PAGE_SIZE_OPTIONS = ['25', '50', '100'] as const

type QuickRange = 'this_month' | 'last_month' | 'last_7' | 'today'

const isoDate = (d: Date) => d.toISOString().slice(0, 10)

function buildDefaultRange(): { from: string; to: string } {
  const today = new Date()
  return {
    from: isoDate(new Date(today.getFullYear(), today.getMonth(), 1)),
    to: isoDate(today),
  }
}

function rangeFor(kind: QuickRange): { from: string; to: string } {
  const now = new Date()
  if (kind === 'this_month') {
    return {
      from: isoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
      to: isoDate(now),
    }
  }
  if (kind === 'last_month') {
    return {
      from: isoDate(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
      to: isoDate(new Date(now.getFullYear(), now.getMonth(), 0)),
    }
  }
  if (kind === 'last_7') {
    const start = new Date(now)
    start.setDate(now.getDate() - 6)
    return { from: isoDate(start), to: isoDate(now) }
  }
  // today
  return { from: isoDate(now), to: isoDate(now) }
}

export function AuditLogPage() {
  const initial = useMemo(buildDefaultRange, [])

  const [actionFilter, setActionFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [from, setFrom] = useState(initial.from)
  const [to, setTo] = useState(initial.to)
  const [activeRange, setActiveRange] = useState<QuickRange | null>('this_month')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<string>('25')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  function applyQuickRange(kind: QuickRange) {
    const r = rangeFor(kind)
    setFrom(r.from)
    setTo(r.to)
    setActiveRange(kind)
    setPage(1)
  }

  function handleDateChange(field: 'from' | 'to', value: string) {
    if (field === 'from') setFrom(value); else setTo(value)
    setActiveRange(null)
    setPage(1)
  }

  // Reset to page 1 whenever filters change so the user doesn't sit on
  // a now-empty deep page after narrowing the result set.
  const params: Record<string, string | number | undefined> = {
    page,
    page_size: pageSize,
    from,
    to,
    action: actionFilter !== 'all' ? actionFilter : undefined,
    search: searchQuery || undefined,
  }

  const { data, isLoading, error, refetch, isFetching } = useAuditLogs(params)
  const envelope = data?.data
  const logs = envelope?.results ?? []
  const total = envelope?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / Number(pageSize)))

  if (error) return <ErrorState onRetry={refetch} />

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Log" description="Immutable trail of all actions in this laboratory" />

      {/* ---- Filters ---------------------------------------------- */}
      <section className="rounded-xl border border-black/5 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
        <div className="flex flex-wrap items-end gap-4 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="audit-from" className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">From</Label>
            <Input
              id="audit-from" type="date" value={from}
              onChange={(e) => handleDateChange('from', e.target.value)}
              className="h-9 w-[10rem]"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="audit-to" className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">To</Label>
            <Input
              id="audit-to" type="date" value={to}
              onChange={(e) => handleDateChange('to', e.target.value)}
              className="h-9 w-[10rem]"
            />
          </div>

          <div className="space-y-1.5">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Action</span>
            <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v ?? 'all'); setPage(1) }}>
              <SelectTrigger className="h-9 w-44"><SelectValue placeholder="Action" /></SelectTrigger>
              <SelectContent>
                {ACTION_OPTIONS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a === 'all' ? 'All actions' : a.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="ml-auto space-y-1.5 min-w-[20rem] flex-1 max-w-md">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Search</span>
            <SearchInput
              placeholder="Search actor, email, action, entity, IP…"
              value={searchQuery}
              onChange={(v) => { setSearchQuery(v); setPage(1) }}
              debounceMs={400}
            />
          </div>
        </div>

        {/* Quick range chips */}
        <div className="flex flex-wrap items-center gap-2 border-t border-black/5 px-5 py-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Quick range
          </span>
          {([
            { key: 'today',      label: 'Today' },
            { key: 'last_7',     label: 'Last 7 days' },
            { key: 'this_month', label: 'This month' },
            { key: 'last_month', label: 'Last month' },
          ] as { key: QuickRange; label: string }[]).map((q) => {
            const active = activeRange === q.key
            return (
              <button
                key={q.key}
                type="button"
                onClick={() => applyQuickRange(q.key)}
                className={cn(
                  'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-all',
                  active
                    ? 'border-blue-400 bg-blue-50 text-blue-700 shadow-sm shadow-blue-600/10'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50/60 hover:text-blue-700',
                )}
              >
                {q.label}
              </button>
            )
          })}
        </div>
      </section>

      {/* ---- Table ----------------------------------------------- */}
      {isLoading ? (
        <TableSkeleton rows={10} columns={6} />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No audit entries"
          description="No actions match the current filters."
        />
      ) : (
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <Fragment key={log.id}>
                  <TableRow>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-xs', ACTION_STYLES[log.action] || '')}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{log.entity_type}</span>
                      {log.entity_id && (
                        <span className="ml-1 font-mono text-xs text-muted-foreground">
                          {log.entity_id.slice(0, 8)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="text-foreground">
                        {log.actor_display_name || log.actor_email || log.actor_type}
                      </div>
                      {log.actor_email && log.actor_email !== log.actor_display_name && (
                        <div className="text-xs text-muted-foreground">{log.actor_email}</div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{log.ip_address || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDateTime(log.timestamp)}</TableCell>
                    <TableCell>
                      {log.diff && (
                        <button
                          onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                          className="text-muted-foreground hover:text-foreground"
                          aria-label={expandedId === log.id ? 'Collapse details' : 'Show details'}
                        >
                          {expandedId === log.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                  {expandedId === log.id && log.diff && (
                    <TableRow>
                      <TableCell colSpan={6} className="bg-slate-50/60">
                        <AuditDiff diff={log.diff} />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}
            </TableBody>
          </Table>

          {/* Pagination footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-2.5 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <Select value={pageSize} onValueChange={(v) => { if (v) { setPageSize(v); setPage(1) } }}>
                <SelectTrigger className="h-8 w-[5rem]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="ml-2 text-slate-500">
                {total === 0
                  ? '0 entries'
                  : `Showing ${((page - 1) * Number(pageSize)) + 1}–${Math.min(page * Number(pageSize), total)} of ${total}`}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline" size="sm"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </Button>
              <span className="px-2 tabular-nums text-slate-600">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline" size="sm"
                disabled={page >= totalPages || isFetching}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="gap-1"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
