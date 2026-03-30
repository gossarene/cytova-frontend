import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CreditCard } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { useSubscriptions } from './api'
import { formatDate } from '@/lib/utils/date'

const STATUSES = ['all', 'TRIAL', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED']

export function SubscriptionsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')

  const params: Record<string, string> = {}
  if (search) params.search = search
  if (statusFilter !== 'all') params.status = statusFilter
  const tenantId = searchParams.get('tenant_id')
  if (tenantId) params.tenant_id = tenantId

  const { data, isLoading, error, refetch } = useSubscriptions(params)
  const subscriptions = data?.data ?? []

  if (error) return <ErrorState onRetry={refetch} />

  return (
    <div className="space-y-6">
      <PageHeader title="Subscriptions" description="Manage laboratory subscription lifecycle" />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search by lab name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s === 'all' ? 'All Statuses' : s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} columns={6} />
      ) : subscriptions.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No subscriptions found"
          description="No subscriptions match your filters."
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Laboratory</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Trial/Period End</TableHead>
                <TableHead>Days Left</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((sub) => (
                <TableRow
                  key={sub.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/platform/subscriptions/${sub.id}`)}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">{sub.tenant_name}</p>
                      <p className="text-xs text-muted-foreground">{sub.tenant_subdomain}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{sub.plan_name}</TableCell>
                  <TableCell><StatusBadge status={sub.status} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(sub.started_at)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {sub.trial_end_date
                      ? formatDate(sub.trial_end_date)
                      : sub.current_period_end
                        ? formatDate(sub.current_period_end)
                        : '—'}
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">
                    {sub.trial_days_remaining !== null
                      ? `${sub.trial_days_remaining}d`
                      : '—'}
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
