import { useState } from 'react'
import { ArrowUpCircle, ArrowDownCircle, ArrowLeftRight } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { useMovementReport } from '../api'
import { MOVEMENT_TYPE_OPTIONS } from '../types'
import { formatDateTime } from '@/lib/utils/date'
import { cn } from '@/lib/utils'

const TYPE_STYLES: Record<string, { icon: typeof ArrowUpCircle; color: string; label: string }> = {
  IN: { icon: ArrowUpCircle, color: 'text-emerald-600', label: 'Stock In' },
  OUT: { icon: ArrowDownCircle, color: 'text-red-600', label: 'Stock Out' },
  ADJUSTMENT_IN: { icon: ArrowUpCircle, color: 'text-blue-600', label: 'Adj. In' },
  ADJUSTMENT_OUT: { icon: ArrowDownCircle, color: 'text-amber-600', label: 'Adj. Out' },
  LOSS: { icon: ArrowDownCircle, color: 'text-red-600', label: 'Loss' },
}

export function MovementsPage() {
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const params: Record<string, string> = {}
  if (typeFilter !== 'all') params.movement_type = typeFilter

  const { data, isLoading, error, refetch } = useMovementReport(params)
  const movements = data?.data ?? []

  if (error) return <ErrorState onRetry={refetch} />

  return (
    <div className="space-y-6">
      <PageHeader title="Stock Movements" description="Audit trail of all inventory changes" />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? 'all')}>
          <SelectTrigger className="sm:w-48"><SelectValue placeholder="Movement type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {MOVEMENT_TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <TableSkeleton rows={10} columns={7} /> : movements.length === 0 ? (
        <EmptyState icon={ArrowLeftRight} title="No movements found" description="Stock movements will appear here as inventory changes." />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Before → After</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>By</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((mv) => {
                const style = TYPE_STYLES[mv.movement_type] || TYPE_STYLES.OUT
                const Icon = style.icon
                return (
                  <TableRow key={mv.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className={cn('h-4 w-4', style.color)} />
                        <Badge variant="outline" className="text-xs">{style.label}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className={cn('font-mono text-sm font-semibold tabular-nums', style.color)}>
                      {['OUT', 'ADJUSTMENT_OUT', 'LOSS'].includes(mv.movement_type) ? '-' : '+'}{mv.quantity}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground tabular-nums">
                      {mv.quantity_before} → {mv.quantity_after}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {mv.reason || '—'}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {mv.reference || '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{mv.performed_by_email || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDateTime(mv.performed_at)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
