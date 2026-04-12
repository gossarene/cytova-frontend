import { useState } from 'react'
import { toast } from 'sonner'
import {
  Ban, Pencil, Plus, RotateCcw, DollarSign,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger,
} from '@/components/ui/select'
import { SearchInput } from '@/components/shared/SearchInput'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { Can } from '@/lib/permissions/Can'
import { P } from '@/lib/permissions/constants'
import { formatCurrency } from '@/lib/utils/currency'
import {
  usePartnerExamPrices, useDeactivatePartnerExamPrice, useReactivatePartnerExamPrice,
} from '../api'
import { PartnerExamPriceDialog } from './PartnerExamPriceDialog'
import type { PartnerExamPriceItem } from '../types'

type StatusFilter = 'all' | 'active' | 'inactive'

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: 'All',
  active: 'Active',
  inactive: 'Inactive',
}

function statusToParam(status: StatusFilter): string | undefined {
  if (status === 'all') return undefined
  return status === 'active' ? 'true' : 'false'
}

interface Props {
  partnerId: string
}

/**
 * Agreed-prices section rendered inside the Partner detail page.
 *
 * Mirrors the catalog reference-management UX (search + status filter
 * above a row-oriented table, per-row edit and lifecycle buttons)
 * without importing any catalog components directly — the pattern is
 * small enough to keep this file self-contained inside the partners
 * module, avoiding cross-module UI coupling.
 */
export function PartnerExamPricesSection({ partnerId }: Props) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PartnerExamPriceItem | null>(null)

  const params: { is_active?: string; search?: string } = {}
  const isActive = statusToParam(status)
  if (isActive !== undefined) params.is_active = isActive
  if (search) params.search = search

  const { data: prices = [], isLoading, error, refetch } = usePartnerExamPrices(
    partnerId,
    params,
  )

  const hasFilters = !!search || status !== 'all'
  const statusLabel = STATUS_LABELS[status]

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(row: PartnerExamPriceItem) {
    setEditing(row)
    setDialogOpen(true)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            Agreed Prices
          </CardTitle>
          <Can permission={P.PARTNERS_MANAGE}>
            <Button className="gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add Agreed Price
            </Button>
          </Can>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filter row — same shape as the catalog filter bars. */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchInput
            placeholder="Search by exam code or name..."
            value={search}
            onChange={setSearch}
          />
          <Select
            value={status}
            onValueChange={(v) => { if (v) setStatus(v as StatusFilter) }}
          >
            <SelectTrigger className="sm:w-48">
              <span className="text-sm">
                <span className="text-muted-foreground">Status:</span> {statusLabel}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error ? (
          <ErrorState onRetry={refetch} />
        ) : isLoading ? (
          <TableSkeleton rows={4} columns={6} />
        ) : prices.length === 0 ? (
          <EmptyState
            icon={DollarSign}
            title={hasFilters ? 'No matching agreed prices' : 'No agreed prices yet'}
            description={
              hasFilters
                ? 'Try adjusting the search or status filter.'
                : 'Record a negotiated price for one of this partner\u2019s exams.'
            }
          />
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Exam</TableHead>
                  <TableHead className="text-right">Reference</TableHead>
                  <TableHead className="text-right">Agreed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20 text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {prices.map((row) => (
                  <PriceRow
                    key={row.id}
                    row={row}
                    partnerId={partnerId}
                    onEdit={() => openEdit(row)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/*
        The dialog is keyed on the target row id so each open is a fresh
        dialog instance: create mode starts from empty defaults, edit mode
        pre-fills from ``editing`` without state leaking between sessions.
      */}
      <PartnerExamPriceDialog
        key={editing?.id ?? 'new'}
        open={dialogOpen}
        onOpenChange={(next) => {
          setDialogOpen(next)
          if (!next) setEditing(null)
        }}
        partnerId={partnerId}
        editPrice={editing}
      />
    </Card>
  )
}

function PriceRow({
  row, partnerId, onEdit,
}: {
  row: PartnerExamPriceItem
  partnerId: string
  onEdit: () => void
}) {
  const deactivate = useDeactivatePartnerExamPrice(partnerId, row.id)
  const reactivate = useReactivatePartnerExamPrice(partnerId, row.id)

  async function handleDeactivate() {
    try {
      await deactivate.mutateAsync()
      toast.success('Agreed price deactivated.')
    } catch {
      toast.error('Failed to deactivate agreed price.')
    }
  }

  async function handleReactivate() {
    try {
      await reactivate.mutateAsync()
      toast.success('Agreed price reactivated.')
    } catch {
      // Backend rejects reactivation when another active row already
      // exists for the same (partner, exam) pair — surface that so the
      // admin has an actionable path.
      toast.error(
        'Failed to reactivate agreed price. '
        + 'Another active row may already exist for this exam.',
      )
    }
  }

  const delta = Number(row.agreed_price) - Number(row.reference_unit_price)
  const deltaLabel = Number.isFinite(delta) && delta !== 0
    ? ` (${delta > 0 ? '+' : ''}${formatCurrency(String(delta))})`
    : ''

  return (
    <TableRow className={row.is_active ? '' : 'bg-muted/30'}>
      <TableCell className="font-mono text-sm font-medium">{row.exam_code}</TableCell>
      <TableCell>
        <div className="font-medium">{row.exam_name}</div>
        {row.notes && (
          <div className="text-xs text-muted-foreground line-clamp-1">{row.notes}</div>
        )}
      </TableCell>
      <TableCell className="text-right font-mono text-sm text-muted-foreground">
        {formatCurrency(row.reference_unit_price)}
      </TableCell>
      <TableCell className="text-right font-mono text-sm font-medium">
        {formatCurrency(row.agreed_price)}
        {deltaLabel && (
          <span className={`ml-1 text-xs ${delta > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {deltaLabel}
          </span>
        )}
      </TableCell>
      <TableCell>
        {row.is_active ? (
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-xs">
            Active
          </Badge>
        ) : (
          <Badge variant="outline" className="border-red-200 bg-red-50 text-red-600 text-xs">
            Inactive
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <Can permission={P.PARTNERS_MANAGE}>
          <div className="flex justify-end gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={onEdit}
              aria-label="Edit agreed price"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            {row.is_active ? (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-red-600 hover:text-red-600"
                onClick={handleDeactivate}
                disabled={deactivate.isPending}
                aria-label="Deactivate agreed price"
              >
                <Ban className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-600"
                onClick={handleReactivate}
                disabled={reactivate.isPending}
                aria-label="Reactivate agreed price"
                title="Reactivate"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </Can>
      </TableCell>
    </TableRow>
  )
}
