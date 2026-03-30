import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ShoppingCart } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
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
import { usePurchaseOrders } from '../api'
import { formatDate } from '@/lib/utils/date'

const STATUSES = ['all', 'DRAFT', 'CONFIRMED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED']

export function POListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const params: Record<string, string> = {}
  if (search) params.search = search
  if (statusFilter !== 'all') params.status = statusFilter

  const { data, isLoading, error, refetch } = usePurchaseOrders(params)
  const orders = data?.data ?? []

  if (error) return <ErrorState onRetry={refetch} />

  return (
    <div className="space-y-6">
      <PageHeader title="Purchase Orders" description="Manage procurement from suppliers">
        <Can permission={P.PROCUREMENT_MANAGE}>
          <Button className="gap-2" onClick={() => navigate('/procurement/new')}>
            <Plus className="h-4 w-4" /> New Order
          </Button>
        </Can>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row">
        <SearchInput placeholder="Search by PO # or supplier..." value={search} onChange={setSearch} />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
          <SelectTrigger className="sm:w-52"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s === 'all' ? 'All Statuses' : s.replace(/_/g, ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <TableSkeleton rows={6} columns={6} /> : orders.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="No purchase orders"
          description={search ? 'Try adjusting your search.' : 'Create your first purchase order.'}
          action={!search ? { label: 'New Order', onClick: () => navigate('/procurement/new') } : undefined}
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Receptions</TableHead>
                <TableHead>Expected</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((po) => (
                <TableRow key={po.id} className="cursor-pointer" onClick={() => navigate(`/procurement/${po.id}`)}>
                  <TableCell className="font-mono text-sm font-medium">{po.order_number}</TableCell>
                  <TableCell className="font-medium">{po.supplier_name}</TableCell>
                  <TableCell><StatusBadge status={po.status} /></TableCell>
                  <TableCell className="text-sm tabular-nums">{po.items_count}</TableCell>
                  <TableCell className="text-sm tabular-nums">{po.receptions_count}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {po.expected_delivery_date ? formatDate(po.expected_delivery_date) : '—'}
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
