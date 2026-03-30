import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Package, ArrowLeftRight, Ban,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/components/shared/PageHeader'
import { ErrorState } from '@/components/shared/ErrorState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { CardSkeleton, TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { Can } from '@/lib/permissions/Can'
import { P } from '@/lib/permissions/constants'
import { QuantityIndicator } from '../components/QuantityIndicator'
import { ExpiryBadge } from '../components/ExpiryBadge'
import { MovementDialog } from '../components/MovementDialog'
import { useStockItem, useStockLots, useDeactivateStockItem } from '../api'
import { formatDate, formatDateTime } from '@/lib/utils/date'
import { ROUTES } from '@/config/routes'

export function StockItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: item, isLoading, error, refetch } = useStockItem(id!)
  const { data: lotsData, isLoading: lotsLoading } = useStockLots(id!)
  const deactivateMut = useDeactivateStockItem(id!)

  const [showDeactivate, setShowDeactivate] = useState(false)
  const [movementLotId, setMovementLotId] = useState<string | null>(null)
  const [movementLotQty, setMovementLotQty] = useState(0)

  if (error) return <ErrorState onRetry={refetch} />
  if (isLoading || !item) return <div className="space-y-6"><CardSkeleton /><CardSkeleton /></div>

  const lots = lotsData?.data ?? []
  const qty = parseFloat(item.current_quantity)
  const threshold = parseFloat(item.minimum_threshold)

  async function handleDeactivate() {
    try {
      await deactivateMut.mutateAsync()
      toast.success('Stock item deactivated.')
      setShowDeactivate(false)
    } catch { toast.error('Failed to deactivate.') }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={item.name}
        breadcrumbs={[{ label: 'Stock', href: ROUTES.STOCK }, { label: item.code }]}
      >
        <Can permission={P.STOCK_MANAGE}>
          {item.is_active && (
            <Button variant="destructive" className="gap-2" onClick={() => setShowDeactivate(true)}>
              <Ban className="h-4 w-4" /> Deactivate
            </Button>
          )}
        </Can>
      </PageHeader>

      {/* Item info + quantity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4 text-muted-foreground" /> Stock Item
              </CardTitle>
              <Badge variant="outline" className={item.is_active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-600'}>
                {item.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Code" value={item.code} mono />
              <Field label="Category" value={item.category.name} />
              <Field label="Unit" value={item.unit} />
              <Field label="Supplier" value={item.main_supplier_name || '—'} />
              <Field label="Minimum threshold" value={`${item.minimum_threshold} ${item.unit}`} />
              <Field label="Reorder quantity" value={item.reorder_quantity ? `${item.reorder_quantity} ${item.unit}` : '—'} />
            </div>
            {item.description && <><Separator /><Field label="Description" value={item.description} /></>}
            <div className="text-xs text-muted-foreground pt-2">
              Created {formatDateTime(item.created_at)} &middot; Updated {formatDateTime(item.updated_at)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Current Stock</CardTitle></CardHeader>
          <CardContent>
            <QuantityIndicator current={qty} threshold={threshold} unit={item.unit} />
          </CardContent>
        </Card>
      </div>

      {/* Lots */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Lots ({lots.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {lotsLoading ? <TableSkeleton rows={4} columns={6} /> : lots.length === 0 ? (
            <EmptyState icon={Package} title="No lots" description="Lots are created through procurement receptions or manual entry." />
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lot #</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lots.map((lot) => {
                    const lotQty = parseFloat(lot.current_quantity)
                    return (
                      <TableRow key={lot.id}>
                        <TableCell className="font-mono text-sm">{lot.lot_number}</TableCell>
                        <TableCell>
                          <span className={`font-mono text-sm font-semibold tabular-nums ${lot.is_exhausted ? 'text-red-500' : ''}`}>
                            {lot.current_quantity} / {lot.initial_quantity}
                          </span>
                          {lot.is_exhausted && (
                            <Badge variant="outline" className="ml-2 border-red-200 bg-red-50 text-red-600 text-[10px]">Exhausted</Badge>
                          )}
                        </TableCell>
                        <TableCell><ExpiryBadge expiryDate={lot.expiry_date} /></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{lot.supplier_name || '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(lot.received_at)}</TableCell>
                        <TableCell>
                          <Can permission={P.STOCK_MANAGE}>
                            {!lot.is_exhausted && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1.5 text-xs"
                                onClick={() => { setMovementLotId(lot.id); setMovementLotQty(lotQty) }}
                              >
                                <ArrowLeftRight className="h-3.5 w-3.5" /> Move
                              </Button>
                            )}
                          </Can>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ConfirmDialog open={showDeactivate} onOpenChange={setShowDeactivate}
        title="Deactivate stock item" variant="destructive"
        description={`"${item.name}" will be hidden from active inventory. Existing lots and movements are preserved.`}
        confirmLabel="Deactivate" onConfirm={handleDeactivate} isLoading={deactivateMut.isPending}
      />

      {movementLotId && (
        <MovementDialog
          open
          onOpenChange={(v) => { if (!v) setMovementLotId(null) }}
          lotId={movementLotId}
          currentQuantity={movementLotQty}
        />
      )}
    </div>
  )
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return <div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className={`mt-0.5 text-sm ${mono ? 'font-mono' : ''}`}>{value}</p></div>
}
