import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ClipboardList } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/PageHeader'
import { SearchInput } from '@/components/shared/SearchInput'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { Can } from '@/lib/permissions/Can'
import { P } from '@/lib/permissions/constants'
import { useRequests } from '../api'
import { formatDate } from '@/lib/utils/date'
import { ROUTES } from '@/config/routes'

const STATUS_OPTIONS = ['all', 'DRAFT', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']

export function RequestListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const params: Record<string, string> = {}
  if (search) params.search = search
  if (statusFilter !== 'all') params.status = statusFilter

  const { data, isLoading, error, refetch } = useRequests(params)
  const requests = data?.data ?? []

  if (error) return <ErrorState onRetry={refetch} />

  return (
    <div className="space-y-6">
      <PageHeader title="Analysis Requests" description="Track and manage laboratory requests">
        <Can permission={P.REQUESTS_CREATE}>
          <Button className="gap-2" onClick={() => navigate(ROUTES.REQUEST_NEW)}>
            <Plus className="h-4 w-4" /> New Request
          </Button>
        </Can>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row">
        <SearchInput placeholder="Search by patient, request #, partner..." value={search} onChange={setSearch} />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
          <SelectTrigger className="sm:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s === 'all' ? 'All Statuses' : s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <TableSkeleton rows={8} columns={7} /> : requests.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No requests found"
          description={search ? 'Try adjusting your search or filters.' : 'Create your first analysis request.'}
          action={!search ? { label: 'New Request', onClick: () => navigate(ROUTES.REQUEST_NEW) } : undefined}
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request #</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req.id} className="cursor-pointer" onClick={() => navigate(`/requests/${req.id}`)}>
                  <TableCell className="font-mono text-sm font-medium">{req.request_number}</TableCell>
                  <TableCell className="font-medium">{req.patient_name}</TableCell>
                  <TableCell><StatusBadge status={req.status} /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px]">
                        {req.source_type === 'PARTNER_ORGANIZATION' ? 'Partner' : 'Direct'}
                      </Badge>
                      {req.partner_organization_name && (
                        <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                          {req.partner_organization_name}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">{req.items_count}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(req.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
