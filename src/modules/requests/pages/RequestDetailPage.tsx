import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  CheckCircle2, XCircle, Building2, FileText,
  Loader2, Pipette, FlaskConical, Send, Pencil,
  ClipboardCheck,
} from 'lucide-react'
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
import { useRole, usePermission } from '@/lib/permissions/hooks'
import {
  useRequest, useConfirmRequest, useCancelRequest,
  useMarkItemCollected, useFinalizeValidation, useRequestLabels,
} from '../api'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useItemCurrentResult, useSubmitResult } from '@/modules/results/api'
import { RequestLabelsCard } from '../components/RequestLabelsCard'
import { RequestReportCard } from '../components/RequestReportCard'
import { ResultEntryDialog } from '../components/ResultEntryDialog'
import { ResultReviewModal } from '../components/ResultReviewModal'
import type { RequestItemBrief } from '../types'
import { PRICE_SOURCE_LABELS } from '../types'
import type { ResultDetail } from '@/modules/results/types'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDateTime } from '@/lib/utils/date'
import { ROUTES } from '@/config/routes'

const COLLECTION_ROLES = new Set(['LAB_ADMIN', 'BIOLOGIST', 'TECHNICIAN'])

const RESULT_PHASE_STATUSES = new Set([
  'IN_ANALYSIS', 'AWAITING_REVIEW', 'RETEST_REQUIRED', 'READY_FOR_RELEASE',
  'VALIDATED', 'IN_PROGRESS', 'COMPLETED',
])

const RESULT_ELIGIBLE_ITEM_STATUSES = new Set([
  'COLLECTED', 'RESULT_ENTERED', 'UNDER_REVIEW', 'VALIDATED',
  'IN_PROGRESS', 'COMPLETED',
])

function isResultComplete(result: ResultDetail): boolean {
  if (result.values && result.values.length > 0) {
    return result.values.some((v) => v.value.trim() !== '')
  }
  return !!result.result_value.trim()
}

const COLLECTED_OR_BEYOND = new Set([
  'COLLECTED', 'RESULT_ENTERED', 'UNDER_REVIEW', 'VALIDATED',
  'IN_PROGRESS', 'COMPLETED',
])

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: request, isLoading, error, refetch } = useRequest(id!)
  const confirmMut = useConfirmRequest(id!)
  const cancelMut = useCancelRequest(id!)
  const finalizeMut = useFinalizeValidation(id!)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [showFinalize, setShowFinalize] = useState(false)
  const role = useRole()
  const canCollect = !!role && COLLECTION_ROLES.has(role)
  const canFinalize = usePermission(P.REQUESTS_FINALIZE)
  const isCollectionPhase = request?.status === 'CONFIRMED' || request?.status === 'COLLECTION_IN_PROGRESS'
  // Backend rule (see services.AnalysisRequestItemService.mark_collected):
  // collection is blocked until a RequestLabelBatch exists for the request.
  // We mirror that rule in the UI so the control reflects reality without
  // relying on a round-trip error.
  const { data: labelBatch } = useRequestLabels(id!)
  const labelsGenerated = !!labelBatch

  if (error) return <ErrorState onRetry={refetch} />
  if (isLoading || !request) return <div className="space-y-6"><CardSkeleton /><CardSkeleton /></div>

  const total = request.items.reduce((sum, item) => {
    if (item.execution_mode === 'REJECTED') return sum
    return sum + parseFloat(item.billed_price || '0')
  }, 0)

  const isDraft = request.status === 'DRAFT'
  const isReadyForRelease = request.status === 'READY_FOR_RELEASE'
  const isFinalized = request.status === 'VALIDATED'
  const showCollectionCol = isCollectionPhase || !isDraft
  const showResultCol = RESULT_PHASE_STATUSES.has(request.status)

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

  async function handleFinalize() {
    try {
      await finalizeMut.mutateAsync()
      toast.success('Request validation finalized.')
      setShowFinalize(false)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { errors?: { message?: string }[] } } })
        ?.response?.data?.errors?.[0]?.message
      toast.error(msg || 'Failed to finalize validation.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Request ${request.public_reference}`}
        breadcrumbs={[{ label: 'Requests', href: ROUTES.REQUESTS }, { label: request.public_reference }]}
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
        {isReadyForRelease && canFinalize && (
          <Button className="gap-2" onClick={() => setShowFinalize(true)}>
            <ClipboardCheck className="h-4 w-4" /> Finalize Validation
          </Button>
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
              <Field label="Request #" value={request.public_reference} mono />
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
                    {showCollectionCol && <TableHead>Collection</TableHead>}
                    {showResultCol && <TableHead>Result</TableHead>}
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
                      {showCollectionCol && (
                        <TableCell>
                          <ItemCollectionCell
                            item={item}
                            requestId={request.id}
                            canCollect={canCollect && isCollectionPhase}
                            labelsGenerated={labelsGenerated}
                          />
                        </TableCell>
                      )}
                      {showResultCol && (
                        <TableCell>
                          <ItemResultCell item={item} requestFinalized={isFinalized} />
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <RequestLabelsCard
        requestId={request.id}
        requestNumber={request.request_number}
        requestStatus={request.status}
        items={request.items}
      />

      <RequestReportCard
        requestId={request.id}
        publicReference={request.public_reference}
        requestStatus={request.status}
        hasReport={request.has_report}
        currentReport={request.current_report}
      />

      <ConfirmDialog open={showConfirm} onOpenChange={setShowConfirm}
        title="Confirm this request"
        description={`This will confirm request ${request.public_reference} with ${request.items.length} items. Items marked as REJECTED will be zeroed out.`}
        confirmLabel="Confirm Request" onConfirm={handleConfirm} isLoading={confirmMut.isPending}
      />
      <ConfirmDialog open={showCancel} onOpenChange={setShowCancel}
        title="Cancel this request" variant="destructive"
        description={`This will cancel request ${request.public_reference}. This action cannot be undone.`}
        confirmLabel="Cancel Request" onConfirm={handleCancel} isLoading={cancelMut.isPending}
      />
      <ConfirmDialog open={showFinalize} onOpenChange={setShowFinalize}
        title="Finalize request validation"
        description={`This will finalize validation for request ${request.public_reference}. After finalization, item-level review modifications will no longer be possible.`}
        confirmLabel="Finalize Validation" onConfirm={handleFinalize} isLoading={finalizeMut.isPending}
      />
    </div>
  )
}


// ---------------------------------------------------------------------------
// Item Collection Cell
// ---------------------------------------------------------------------------

function ItemCollectionCell({
  item,
  requestId,
  canCollect,
  labelsGenerated,
}: {
  item: RequestItemBrief
  requestId: string
  canCollect: boolean
  labelsGenerated: boolean
}) {
  const markCollected = useMarkItemCollected(requestId, item.id)

  if (item.status === 'REJECTED') {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  if (COLLECTED_OR_BEYOND.has(item.status)) {
    return (
      <div className="space-y-0.5">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
          <span className="text-xs font-medium text-teal-700">Collected</span>
        </div>
        {item.collected_at && (
          <p className="text-xs text-muted-foreground">{formatDateTime(item.collected_at)}</p>
        )}
        {item.collected_by_email && (
          <p className="text-xs text-muted-foreground">{item.collected_by_email}</p>
        )}
      </div>
    )
  }

  if (item.status === 'PENDING' && canCollect) {
    async function handleMarkCollected() {
      try {
        await markCollected.mutateAsync({})
        toast.success(`Specimen collected for ${item.exam_code}.`)
      } catch {
        toast.error('Failed to mark specimen as collected.')
      }
    }

    const disabled = markCollected.isPending || !labelsGenerated
    const button = (
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5 text-xs h-7"
        onClick={handleMarkCollected}
        disabled={disabled}
      >
        {markCollected.isPending
          ? <Loader2 className="h-3 w-3 animate-spin" />
          : <Pipette className="h-3 w-3" />
        }
        Mark Collected
      </Button>
    )

    if (!labelsGenerated) {
      // A disabled <Button> swallows pointer events, so wrap in a span
      // that the tooltip can hook into.
      return (
        <Tooltip>
          <TooltipTrigger
            render={(props) => (
              <span {...props} className="inline-block">{button}</span>
            )}
          />
          <TooltipContent side="left" className="max-w-xs">
            Labels must be generated before specimen collection can be marked.
          </TooltipContent>
        </Tooltip>
      )
    }

    return button
  }

  return <span className="text-xs text-muted-foreground">—</span>
}


// ---------------------------------------------------------------------------
// Item Result Cell — compact summary + modal trigger
// ---------------------------------------------------------------------------

function ItemResultCell({ item, requestFinalized }: { item: RequestItemBrief; requestFinalized: boolean }) {
  const canCreate = usePermission(P.RESULTS_CREATE)
  const canSubmit = usePermission(P.RESULTS_SUBMIT)
  const [showEntryDialog, setShowEntryDialog] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)

  if (item.status === 'REJECTED') {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  if (!RESULT_ELIGIBLE_ITEM_STATUSES.has(item.status)) {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  return (
    <>
      <CompactResultCell
        item={item}
        requestFinalized={requestFinalized}
        canCreate={canCreate}
        canSubmit={canSubmit}
        onOpenEntry={() => setShowEntryDialog(true)}
        onOpenReview={() => setShowReviewModal(true)}
      />
      {showEntryDialog && (
        <ResultEntryDialog
          open={showEntryDialog}
          onOpenChange={setShowEntryDialog}
          itemId={item.id}
          examDefinitionId={item.exam_definition_id}
          examCode={item.exam_code}
          examName={item.exam_name}
        />
      )}
      {showReviewModal && (
        <ResultReviewModal
          open={showReviewModal}
          onOpenChange={setShowReviewModal}
          itemId={item.id}
          examDefinitionId={item.exam_definition_id}
          examCode={item.exam_code}
          examName={item.exam_name}
          requestFinalized={requestFinalized}
        />
      )}
    </>
  )
}

function CompactResultCell({
  item, requestFinalized, canCreate, canSubmit, onOpenEntry, onOpenReview,
}: {
  item: RequestItemBrief
  requestFinalized: boolean
  canCreate: boolean
  canSubmit: boolean
  onOpenEntry: () => void
  onOpenReview: () => void
}) {
  const { data: result, isLoading } = useItemCurrentResult(item.id)
  const submitMut = useSubmitResult(result?.id ?? '')

  if (isLoading) {
    return <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
  }

  if (!result) {
    if (!canCreate) return <span className="text-xs text-muted-foreground">No result</span>
    return (
      <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7" onClick={onOpenEntry}>
        <FlaskConical className="h-3 w-3" /> Enter Result
      </Button>
    )
  }

  // DRAFT — technician edit + submit
  if (result.status === 'DRAFT') {
    async function handleSubmit() {
      try {
        await submitMut.mutateAsync()
        toast.success(`Result submitted for review (${item.exam_code}).`)
      } catch { toast.error('Failed to submit result.') }
    }

    return (
      <div className="flex flex-col gap-1">
        <StatusBadge status="DRAFT" className="text-[10px] px-1.5 py-0 w-fit" />
        <div className="flex gap-1">
          {canCreate && (
            <Button size="sm" variant="ghost" className="gap-1 text-xs h-6 px-2" onClick={onOpenEntry}>
              <Pencil className="h-3 w-3" /> Edit
            </Button>
          )}
          {canSubmit && isResultComplete(result) && (
            <Button size="sm" variant="outline" className="gap-1 text-xs h-6 px-2"
              onClick={handleSubmit} disabled={submitMut.isPending}
            >
              {submitMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              Submit
            </Button>
          )}
        </div>
      </div>
    )
  }

  // REJECTED — show status + re-enter
  if (result.status === 'REJECTED') {
    return (
      <div className="flex flex-col gap-1">
        <StatusBadge status="REJECTED" className="text-[10px] px-1.5 py-0 w-fit" />
        {canCreate && !requestFinalized && (
          <Button size="sm" variant="outline" className="gap-1 text-xs h-6 px-2" onClick={onOpenEntry}>
            <FlaskConical className="h-3 w-3" /> Re-enter
          </Button>
        )}
      </div>
    )
  }

  // SUBMITTED / VALIDATED / PUBLISHED — compact + Review button
  return (
    <div className="flex flex-col gap-1">
      <StatusBadge status={result.status} className="text-[10px] px-1.5 py-0 w-fit" />
      <Button size="sm" variant="outline" className="gap-1 text-xs h-6 px-2 w-fit" onClick={onOpenReview}>
        <FileText className="h-3 w-3" />
        {result.status === 'SUBMITTED' ? 'Review' : 'View'}
      </Button>
    </div>
  )
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return <div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className={`mt-0.5 text-sm ${mono ? 'font-mono' : ''}`}>{value}</p></div>
}
