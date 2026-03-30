import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  CheckCircle2, XCircle, Lock, ShoppingCart, PackageCheck, AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ErrorState } from '@/components/shared/ErrorState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { CardSkeleton, TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { Can } from '@/lib/permissions/Can'
import { P } from '@/lib/permissions/constants'
import { usePurchaseOrder, useConfirmPO, useCancelPO, useClosePO, useReceptions } from '../api'
import { formatDate, formatDateTime } from '@/lib/utils/date'
import { formatCurrency } from '@/lib/utils/currency'
import { ROUTES } from '@/config/routes'
import { cn } from '@/lib/utils'

export function PODetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: po, isLoading, error, refetch } = usePurchaseOrder(id!)
  const { data: receptionsData, isLoading: recLoading } = useReceptions(id!)
  const confirmMut = useConfirmPO(id!)
  const cancelMut = useCancelPO(id!)
  const closeMut = useClosePO(id!)

  const [showConfirm, setShowConfirm] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [showClose, setShowClose] = useState(false)

  if (error) return <ErrorState onRetry={refetch} />
  if (isLoading || !po) return <div className="space-y-6"><CardSkeleton /><CardSkeleton /></div>

  const isDraft = po.status === 'DRAFT'
  const isReceivable = po.status === 'CONFIRMED' || po.status === 'PARTIALLY_RECEIVED'
  const receptions = receptionsData?.data ?? []

  async function handleConfirm() {
    try { await confirmMut.mutateAsync(); toast.success('Order confirmed.'); setShowConfirm(false) }
    catch { toast.error('Failed.') }
  }
  async function handleCancel() {
    try { await cancelMut.mutateAsync(); toast.success('Order cancelled.'); setShowCancel(false) }
    catch { toast.error('Failed.') }
  }
  async function handleClose() {
    try { await closeMut.mutateAsync(); toast.success('Order force-closed.'); setShowClose(false) }
    catch { toast.error('Failed.') }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`PO ${po.order_number}`}
        breadcrumbs={[{ label: 'Procurement', href: ROUTES.PROCUREMENT }, { label: po.order_number }]}
      >
        <Can permission={P.PROCUREMENT_MANAGE}>
          {isDraft && (
            <>
              <Button className="gap-2" onClick={() => setShowConfirm(true)} disabled={po.items.length === 0}>
                <CheckCircle2 className="h-4 w-4" /> Confirm
              </Button>
              <Button variant="destructive" className="gap-2" onClick={() => setShowCancel(true)}>
                <XCircle className="h-4 w-4" /> Cancel
              </Button>
            </>
          )}
          {isReceivable && (
            <Button variant="outline" className="gap-2" onClick={() => setShowClose(true)}>
              <Lock className="h-4 w-4" /> Force Close
            </Button>
          )}
        </Can>
      </PageHeader>

      {/* Order info */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingCart className="h-4 w-4 text-muted-foreground" /> Order Details
              </CardTitle>
              <StatusBadge status={po.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Order #" value={po.order_number} mono />
              <Field label="Supplier" value={po.supplier.name} />
              <Field label="Expected delivery" value={po.expected_delivery_date ? formatDate(po.expected_delivery_date) : 'Not set'} />
              <Field label="Created by" value={po.created_by_email || '—'} />
            </div>
            {po.notes && <Field label="Notes" value={po.notes} />}
            {po.confirmed_at && <Field label="Confirmed" value={`${formatDateTime(po.confirmed_at)} by ${po.confirmed_by_email}`} />}
            {po.cancelled_at && <Field label="Cancelled" value={`${formatDateTime(po.cancelled_at)} by ${po.cancelled_by_email}`} />}
            {po.closed_at && <Field label="Force-closed" value={`${formatDateTime(po.closed_at)} by ${po.closed_by_email}`} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Summary</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Items</span><span className="font-semibold">{po.items.length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Receptions</span><span className="font-semibold">{po.receptions_count}</span></div>
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <Card>
        <CardHeader><CardTitle className="text-base">Order Lines ({po.items.length})</CardTitle></CardHeader>
        <CardContent>
          {po.items.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No items on this order.</p>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Ordered</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {po.items.map((item) => {
                    const remaining = parseFloat(item.remaining_quantity)
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <span className="font-mono text-xs text-muted-foreground mr-1.5">{item.stock_item_code}</span>
                          <span className="text-sm font-medium">{item.stock_item_name}</span>
                          <span className="text-xs text-muted-foreground ml-1.5">({item.stock_item_unit})</span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm tabular-nums">{item.ordered_quantity}</TableCell>
                        <TableCell className="text-right font-mono text-sm tabular-nums">{item.received_quantity}</TableCell>
                        <TableCell className={cn('text-right font-mono text-sm tabular-nums font-semibold', remaining > 0 ? 'text-amber-600' : 'text-emerald-600')}>
                          {item.remaining_quantity}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-muted-foreground">
                          {item.unit_price ? formatCurrency(item.unit_price) : '—'}
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

      {/* Receptions */}
      <Card>
        <CardHeader><CardTitle className="text-base">Receptions ({receptions.length})</CardTitle></CardHeader>
        <CardContent>
          {recLoading ? <TableSkeleton rows={3} columns={4} /> : receptions.length === 0 ? (
            <EmptyState icon={PackageCheck} title="No receptions yet" description="Record a delivery when goods arrive." />
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Received at</TableHead>
                    <TableHead>Received by</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Discrepancy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receptions.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm">{formatDate(r.received_at)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.received_by_email || '—'}</TableCell>
                      <TableCell className="text-sm tabular-nums">{r.items_count}</TableCell>
                      <TableCell>
                        {r.has_discrepancy && (
                          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-600 text-xs gap-1">
                            <AlertTriangle className="h-3 w-3" /> Discrepancy
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ConfirmDialog open={showConfirm} onOpenChange={setShowConfirm}
        title="Confirm order" description={`Confirm PO ${po.order_number} with ${po.items.length} items? Items and quantities will be locked.`}
        confirmLabel="Confirm" onConfirm={handleConfirm} isLoading={confirmMut.isPending}
      />
      <ConfirmDialog open={showCancel} onOpenChange={setShowCancel}
        title="Cancel order" variant="destructive"
        description={`Cancel PO ${po.order_number}? This action cannot be undone.`}
        confirmLabel="Cancel Order" onConfirm={handleCancel} isLoading={cancelMut.isPending}
      />
      <ConfirmDialog open={showClose} onOpenChange={setShowClose}
        title="Force close order"
        description={`Mark PO ${po.order_number} as fully received even though some items may be outstanding. Use this when the supplier confirms no further deliveries.`}
        confirmLabel="Force Close" onConfirm={handleClose} isLoading={closeMut.isPending}
      />
    </div>
  )
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return <div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className={`mt-0.5 text-sm ${mono ? 'font-mono' : ''}`}>{value}</p></div>
}
