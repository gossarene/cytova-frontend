import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, Building2, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ErrorState } from '@/components/shared/ErrorState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { CardSkeleton } from '@/components/shared/LoadingSkeleton'
import { Can } from '@/lib/permissions/Can'
import { P } from '@/lib/permissions/constants'
import { useRequest, useConfirmRequest, useCancelRequest } from '../api'
import { PRICE_SOURCE_LABELS } from '../types'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDateTime } from '@/lib/utils/date'
import { ROUTES } from '@/config/routes'

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: request, isLoading, error, refetch } = useRequest(id!)
  const confirmMut = useConfirmRequest(id!)
  const cancelMut = useCancelRequest(id!)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showCancel, setShowCancel] = useState(false)

  if (error) return <ErrorState onRetry={refetch} />
  if (isLoading || !request) return <div className="space-y-6"><CardSkeleton /><CardSkeleton /></div>

  const total = request.items.reduce((sum, item) => {
    if (item.execution_mode === 'REJECTED') return sum
    return sum + parseFloat(item.billed_price || '0')
  }, 0)

  const isDraft = request.status === 'DRAFT'

  async function handleConfirm() {
    try {
      await confirmMut.mutateAsync()
      toast.success('Request confirmed.')
      setShowConfirm(false)
    } catch { toast.error('Failed to confirm request.') }
  }

  async function handleCancel() {
    try {
      await cancelMut.mutateAsync()
      toast.success('Request cancelled.')
      setShowCancel(false)
    } catch { toast.error('Failed to cancel request.') }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Request ${request.request_number}`}
        breadcrumbs={[{ label: 'Requests', href: ROUTES.REQUESTS }, { label: request.request_number }]}
      >
        {isDraft && (
          <>
            <Can permission={P.REQUESTS_CONFIRM}>
              <Button className="gap-2" onClick={() => setShowConfirm(true)} disabled={request.items.length === 0}>
                <CheckCircle2 className="h-4 w-4" /> Confirm
              </Button>
            </Can>
            <Can permission={P.REQUESTS_CANCEL}>
              <Button variant="destructive" className="gap-2" onClick={() => setShowCancel(true)}>
                <XCircle className="h-4 w-4" /> Cancel
              </Button>
            </Can>
          </>
        )}
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Request info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Request Details
              </CardTitle>
              <StatusBadge status={request.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Request #" value={request.request_number} mono />
              <Field label="Created by" value={request.created_by_email || '—'} />
            </div>
            {request.notes && <Field label="Notes" value={request.notes} />}
            {request.confirmed_at && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Confirmed at" value={formatDateTime(request.confirmed_at)} />
                <Field label="Confirmed by" value={request.confirmed_by_email || '—'} />
              </div>
            )}
            {request.cancelled_at && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Cancelled at" value={formatDateTime(request.cancelled_at)} />
                <Field label="Cancelled by" value={request.cancelled_by_email || '—'} />
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              Created {formatDateTime(request.created_at)} &middot; Updated {formatDateTime(request.updated_at)}
            </div>
          </CardContent>
        </Card>

        {/* Source & billing sidebar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-muted-foreground" /> Source & Billing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Source</span>
              <Badge variant="outline" className="text-xs">
                {request.source_type === 'PARTNER_ORGANIZATION' ? 'Partner' : 'Direct'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Billing</span>
              <span className="font-medium">{request.billing_mode === 'PARTNER_BILLING' ? 'Partner Billing' : 'Direct Payment'}</span>
            </div>
            {request.partner_organization_name && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Partner</span>
                <span className="font-medium">{request.partner_organization_name}</span>
              </div>
            )}
            {request.external_reference && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ext. reference</span>
                <span className="font-mono text-xs">{request.external_reference}</span>
              </div>
            )}
            {request.source_notes && (
              <><Separator /><p className="text-xs bg-muted p-2 rounded">{request.source_notes}</p></>
            )}
            <Separator />
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total</span>
              <span className="text-lg font-bold font-mono tabular-nums">{formatCurrency(total)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Exam Items ({request.items.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {request.items.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No items in this request.</p>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Billed</TableHead>
                    <TableHead>Price Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {request.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <span className="font-mono text-xs text-muted-foreground mr-2">{item.exam_code}</span>
                          <span className="text-sm font-medium">{item.exam_name}</span>
                        </div>
                        {item.notes && <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>}
                      </TableCell>
                      <TableCell><StatusBadge status={item.status} /></TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{item.execution_mode}</Badge>
                        {item.external_partner_name && (
                          <p className="text-xs text-muted-foreground mt-0.5">{item.external_partner_name}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(item.unit_price)}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold">{formatCurrency(item.billed_price)}</TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">{PRICE_SOURCE_LABELS[item.price_source]}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog open={showConfirm} onOpenChange={setShowConfirm}
        title="Confirm this request"
        description={`This will confirm request ${request.request_number} with ${request.items.length} items. Items marked as REJECTED will be zeroed out.`}
        confirmLabel="Confirm Request" onConfirm={handleConfirm} isLoading={confirmMut.isPending}
      />
      <ConfirmDialog open={showCancel} onOpenChange={setShowCancel}
        title="Cancel this request" variant="destructive"
        description={`This will cancel request ${request.request_number}. This action cannot be undone.`}
        confirmLabel="Cancel Request" onConfirm={handleCancel} isLoading={cancelMut.isPending}
      />
    </div>
  )
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return <div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className={`mt-0.5 text-sm ${mono ? 'font-mono' : ''}`}>{value}</p></div>
}
