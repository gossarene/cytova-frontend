import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, ClipboardList, X, ChevronRight, CalendarDays } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/shared/PageHeader'
import { SearchInput } from '@/components/shared/SearchInput'
import { PatientCombobox } from '@/components/shared/PatientCombobox'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { Can } from '@/lib/permissions/Can'
import { P } from '@/lib/permissions/constants'
import { usePermission } from '@/lib/permissions/hooks'
import { useRequests } from '../api'
import { usePatient } from '@/modules/patients/api'
import { SOURCE_TYPE_OPTIONS } from '../types'
import { formatDate } from '@/lib/utils/date'
import { ROUTES } from '@/config/routes'

// ---------------------------------------------------------------------------
// Filter options
// ---------------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'COLLECTION_IN_PROGRESS', label: 'Collection In Progress' },
  { value: 'IN_ANALYSIS', label: 'In Analysis' },
  { value: 'AWAITING_REVIEW', label: 'Awaiting Review' },
  { value: 'RETEST_REQUIRED', label: 'Retest Required' },
  { value: 'READY_FOR_RELEASE', label: 'Ready For Release' },
  { value: 'VALIDATED', label: 'Validated' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

const SOURCE_OPTIONS = [
  { value: 'all', label: 'All' },
  ...SOURCE_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
]

// ---------------------------------------------------------------------------
// Date shortcut helpers
// ---------------------------------------------------------------------------

type DatePreset = 'today' | '7days' | 'month' | null

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function getPresetRange(preset: DatePreset): { from: string; to: string } | null {
  if (!preset) return null
  const now = new Date()
  const today = toISODate(now)
  switch (preset) {
    case 'today':
      return { from: today, to: today }
    case '7days': {
      const d = new Date(now)
      d.setDate(d.getDate() - 6)
      return { from: toISODate(d), to: today }
    }
    case 'month':
      return { from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`, to: today }
  }
}

function detectPreset(from: string, to: string): DatePreset {
  const today = toISODate(new Date())
  if (from === today && to === today) return 'today'
  const d7 = new Date()
  d7.setDate(d7.getDate() - 6)
  if (from === toISODate(d7) && to === today) return '7days'
  const monthStart = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`
  if (from === monthStart && to === today) return 'month'
  return null
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RequestListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const canCreate = usePermission(P.REQUESTS_CREATE)

  // URL-driven filters
  const patientIdParam = searchParams.get('patient_id') ?? ''
  const dateFromParam = searchParams.get('date_from') ?? ''
  const dateToParam = searchParams.get('date_to') ?? ''

  // Local filter state
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [patientId, setPatientId] = useState(patientIdParam)
  const [patientName, setPatientName] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState(dateFromParam)
  const [dateTo, setDateTo] = useState(dateToParam)
  // Lifecycle (closure_status) filter — replaces the previous pair of
  // include-delivered / include-archived checkboxes. Default is 'active'
  // which restricts the list to closure_status=OPEN.
  const [lifecycle, setLifecycle] = useState<'active' | 'delivered' | 'archived' | 'all'>(
    (searchParams.get('lifecycle') as 'active' | 'delivered' | 'archived' | 'all' | null) ?? 'active',
  )

  // Resolve patient name when arriving from URL param
  const { data: resolvedPatient } = usePatient(patientIdParam)
  const displayPatientName = patientName || resolvedPatient?.full_name || ''

  // Active date preset detection
  const activePreset = useMemo(
    () => (dateFrom && dateTo ? detectPreset(dateFrom, dateTo) : null),
    [dateFrom, dateTo],
  )

  // Build query params for backend
  const params: Record<string, string> = {}
  if (search) params.search = search
  if (statusFilter !== 'all') params.status = statusFilter
  if (sourceFilter !== 'all') params.source_type = sourceFilter
  if (patientId) params.patient_id = patientId
  if (dateFrom) params.created_from = dateFrom
  if (dateTo) params.created_to = dateTo
  // Only emit lifecycle when it differs from the default — keeps the URL
  // and backend query log clean for the common case.
  if (lifecycle !== 'active') params.lifecycle = lifecycle

  const { data, isLoading, error, refetch } = useRequests(params)
  const requests = data?.data ?? []

  // --- Filter update helpers ---

  function updateSearchParam(key: string, value: string) {
    if (value) searchParams.set(key, value)
    else searchParams.delete(key)
    setSearchParams(searchParams, { replace: true })
  }

  function handlePatientChange(id: string, name: string) {
    setPatientId(id)
    setPatientName(name)
    updateSearchParam('patient_id', id)
  }

  function clearPatientFilter() {
    setPatientId('')
    setPatientName('')
    searchParams.delete('patient_id')
    setSearchParams(searchParams, { replace: true })
  }

  function applyDatePreset(preset: DatePreset) {
    const range = getPresetRange(preset)
    if (range) {
      setDateFrom(range.from)
      setDateTo(range.to)
      searchParams.set('date_from', range.from)
      searchParams.set('date_to', range.to)
    } else {
      setDateFrom('')
      setDateTo('')
      searchParams.delete('date_from')
      searchParams.delete('date_to')
    }
    setSearchParams(searchParams, { replace: true })
  }

  function handleDateFromChange(v: string) {
    setDateFrom(v)
    updateSearchParam('date_from', v)
  }

  function handleDateToChange(v: string) {
    setDateTo(v)
    updateSearchParam('date_to', v)
  }

  function clearDateFilter() {
    setDateFrom('')
    setDateTo('')
    searchParams.delete('date_from')
    searchParams.delete('date_to')
    setSearchParams(searchParams, { replace: true })
  }

  if (error) return <ErrorState onRetry={refetch} />

  const statusLabel = STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label ?? 'All'
  const sourceLabel = SOURCE_OPTIONS.find((o) => o.value === sourceFilter)?.label ?? 'All'
  const hasDateFilter = Boolean(dateFrom || dateTo)
  const hasPatientFilter = Boolean(patientId)
  const hasAnyFilter = Boolean(search || statusFilter !== 'all' || sourceFilter !== 'all' || hasPatientFilter || hasDateFilter)

  return (
    <div className="space-y-6">
      <PageHeader title="Analysis Requests" description="Track and manage laboratory requests">
        <Can permission={P.REQUESTS_CREATE}>
          <Button className="gap-2" onClick={() => navigate(ROUTES.REQUEST_NEW)}>
            <Plus className="h-4 w-4" /> New Request
          </Button>
        </Can>
      </PageHeader>

      {/* ================================================================
          FILTERS
          ================================================================ */}
      <div className="space-y-3">
        {/* Primary filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchInput
            placeholder="Search requests..."
            value={search}
            onChange={setSearch}
          />
          <div className="sm:w-56">
            <PatientCombobox
              value={patientId}
              displayName={displayPatientName}
              onChange={handlePatientChange}
              onClear={clearPatientFilter}
              placeholder="Patient: All"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
            <SelectTrigger className="sm:w-44">
              <span className="text-sm">
                <span className="text-muted-foreground">Status:</span> {statusLabel}
              </span>
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v ?? 'all')}>
            <SelectTrigger className="sm:w-52">
              <span className="text-sm">
                <span className="text-muted-foreground">Source:</span> {sourceLabel}
              </span>
            </SelectTrigger>
            <SelectContent>
              {SOURCE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Lifecycle (closure) preset. Workflow status filter (above)
              and lifecycle filter are independent: workflow narrows DRAFT…
              CANCELLED; lifecycle narrows OPEN/DELIVERED/ARCHIVED. */}
          <div className="inline-flex rounded-md border border-input bg-background p-0.5 text-sm">
            {(['active', 'delivered', 'archived', 'all'] as const).map((value) => {
              const labels: Record<typeof value, string> = {
                active: 'Active',
                delivered: 'Delivered',
                archived: 'Archived',
                all: 'All',
              }
              const active = lifecycle === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setLifecycle(value)
                    updateSearchParam('lifecycle', value === 'active' ? '' : value)
                  }}
                  className={
                    'rounded-sm px-3 py-1 transition-colors ' +
                    (active
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted/40')
                  }
                  aria-pressed={active}
                >
                  {labels[value]}
                </button>
              )
            })}
          </div>
        </div>

        <Separator />

        {/* Date filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => handleDateFromChange(e.target.value)}
              className="h-8 w-36 text-sm"
              aria-label="From date"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => handleDateToChange(e.target.value)}
              className="h-8 w-36 text-sm"
              aria-label="To date"
            />
            {hasDateFilter && (
              <button
                type="button"
                onClick={clearDateFilter}
                className="rounded-sm p-1 text-muted-foreground hover:bg-muted transition-colors"
                aria-label="Clear date filter"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {([
              { key: 'today', label: 'Today' },
              { key: '7days', label: 'Last 7 days' },
              { key: 'month', label: 'This month' },
            ] as const).map((p) => (
              <Button
                key={p.key}
                type="button"
                variant={activePreset === p.key ? 'secondary' : 'ghost'}
                size="sm"
                className="text-xs h-7"
                onClick={() => applyDatePreset(activePreset === p.key ? null : p.key)}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Active filter chips */}
      {(hasPatientFilter || hasDateFilter) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Active filters:</span>
          {hasPatientFilter && (
            <FilterChip
              label={`Patient: ${displayPatientName || 'Loading...'}`}
              color="blue"
              onClear={clearPatientFilter}
            />
          )}
          {hasDateFilter && (
            <FilterChip
              label={`Date: ${dateFrom || '...'} \u2014 ${dateTo || '...'}`}
              color="amber"
              onClear={clearDateFilter}
            />
          )}
        </div>
      )}

      {/* ================================================================
          TABLE
          ================================================================ */}
      {isLoading ? <TableSkeleton rows={8} columns={6} /> : requests.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No requests found"
          description={
            hasPatientFilter
              ? 'This patient has no matching requests.'
              : hasAnyFilter
                ? 'Try adjusting your search or filters.'
                : 'Create your first analysis request.'
          }
          action={
            !hasAnyFilter && canCreate
              ? { label: 'New Request', onClick: () => navigate(ROUTES.REQUEST_NEW) }
              : undefined
          }
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request #</TableHead>
                {!hasPatientFilter && <TableHead>Patient</TableHead>}
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => (
                <TableRow
                  key={req.id}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/requests/${req.id}`)}
                >
                  <TableCell className="font-mono text-sm font-medium">
                    {req.public_reference}
                  </TableCell>
                  {!hasPatientFilter && (
                    <TableCell className="font-medium">{req.patient_name}</TableCell>
                  )}
                  <TableCell><StatusBadge status={req.status} /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {req.source_type === 'PARTNER_ORGANIZATION' ? (
                        <span className="text-xs text-muted-foreground truncate max-w-[160px]">
                          {req.partner_organization_name || 'Partner'}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Direct</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">{req.items_count}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(req.created_at)}</TableCell>
                  <TableCell>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/30 transition-colors group-hover:text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Private components
// ---------------------------------------------------------------------------

function FilterChip({
  label,
  color,
  onClear,
}: {
  label: string
  color: 'blue' | 'amber'
  onClear: () => void
}) {
  const styles = color === 'blue'
    ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
    : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'

  return (
    <Badge variant="outline" className={`gap-1.5 pr-1 text-xs font-normal ${styles}`}>
      {label}
      <button
        type="button"
        onClick={onClear}
        className="ml-0.5 rounded-sm p-0.5 transition-colors"
        aria-label="Remove filter"
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  )
}
