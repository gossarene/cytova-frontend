import { useState } from 'react'
import { toast } from 'sonner'
import {
  Loader2, ShieldCheck, ShieldX, Pencil,
  User, Clock, MessageSquare, FileText,
} from 'lucide-react'
import {
  Dialog, DialogContentLarge, DialogHeader, DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { P } from '@/lib/permissions/constants'
import { usePermission } from '@/lib/permissions/hooks'
import {
  useItemCurrentResult, useValidateResult, useRejectResult,
  useUpdateReviewComments,
} from '@/modules/results/api'
import { useExamDefinition } from '@/modules/catalog/api'
import type { ResultDetail } from '@/modules/results/types'
import { formatDateTime } from '@/lib/utils/date'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemId: string
  examDefinitionId: string
  examCode: string
  examName: string
  requestFinalized: boolean
}

export function ResultReviewModal({
  open, onOpenChange, itemId, examDefinitionId, examCode, examName,
  requestFinalized,
}: Props) {
  const { data: result, isLoading } = useItemCurrentResult(itemId)
  const { data: examDef } = useExamDefinition(examDefinitionId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContentLarge>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">{examCode}</span>
            {examName}
          </DialogTitle>
          {result && (
            <DialogDescription className="flex items-center gap-2">
              <StatusBadge status={result.status} />
              {result.version_number > 1 && (
                <Badge variant="outline" className="text-xs">v{result.version_number}</Badge>
              )}
              {examDef && (
                <Badge variant="outline" className="text-xs">
                  {examDef.result_structure === 'MULTI_PARAMETER' ? 'Multi-Parameter' : 'Single Value'}
                </Badge>
              )}
            </DialogDescription>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading result…
          </div>
        ) : !result ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No result entered yet.</p>
        ) : (
          <ResultReviewContent
            result={result}
            examCode={examCode}
            isMultiParam={examDef?.result_structure === 'MULTI_PARAMETER'}
            requestFinalized={requestFinalized}
          />
        )}
      </DialogContentLarge>
    </Dialog>
  )
}


function ResultReviewContent({
  result,
  examCode,
  isMultiParam,
  requestFinalized,
}: {
  result: ResultDetail
  examCode: string
  isMultiParam: boolean
  requestFinalized: boolean
}) {
  const canValidate = usePermission(P.RESULTS_VALIDATE)
  const canReject = usePermission(P.RESULTS_REJECT)
  const [showReject, setShowReject] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectError, setRejectError] = useState(false)
  const validateMut = useValidateResult(result.id)
  const rejectMut = useRejectResult(result.id)

  const isReviewable = result.status === 'SUBMITTED' && !requestFinalized
  const isCommentEditable = (result.status === 'SUBMITTED' || result.status === 'VALIDATED') && !requestFinalized

  async function handleValidate() {
    try {
      await validateMut.mutateAsync('')
      toast.success(`Result validated for ${examCode}.`)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { errors?: { message?: string }[] } } })
        ?.response?.data?.errors?.[0]?.message
      toast.error(msg || 'Failed to validate.')
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) { setRejectError(true); return }
    try {
      await rejectMut.mutateAsync(rejectReason)
      toast.success(`Result rejected for ${examCode}.`)
      setShowReject(false)
      setRejectReason('')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { errors?: { message?: string }[] } } })
        ?.response?.data?.errors?.[0]?.message
      toast.error(msg || 'Failed to reject.')
    }
  }

  return (
    <div className="space-y-4">
      {/* Result values */}
      <Section title="Result Values">
        {isMultiParam && result.values && result.values.length > 0 ? (
          <div className="rounded-lg border">
            <div className="grid grid-cols-[1.5fr_1fr_0.8fr_1fr_auto] gap-x-3 px-3 py-1.5 bg-muted/50 text-xs font-medium text-muted-foreground border-b">
              <span>Parameter</span><span>Value</span><span>Unit</span><span>Ref. Range</span><span>ABN</span>
            </div>
            {result.values
              .sort((a, b) => a.display_order - b.display_order)
              .map((v) => (
              <div key={v.id} className="grid grid-cols-[1.5fr_1fr_0.8fr_1fr_auto] gap-x-3 px-3 py-2 border-b last:border-b-0 items-center">
                <span className="text-sm">{v.name_snapshot || '—'}</span>
                <span className="text-sm font-mono font-medium">{v.value || '—'}</span>
                <span className="text-xs text-muted-foreground">{v.unit_snapshot || '—'}</span>
                <span className="text-xs text-muted-foreground">{v.reference_range_snapshot || '—'}</span>
                <span>{v.is_abnormal ? <Badge variant="outline" className="text-[10px] px-1 py-0 border-red-300 text-red-600">ABN</Badge> : ''}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-baseline gap-3">
            <span className="text-lg font-mono font-semibold">{result.result_value || '—'}</span>
            <span className="text-sm text-muted-foreground">{result.result_unit}</span>
            {result.reference_range && (
              <span className="text-xs text-muted-foreground">Ref: {result.reference_range}</span>
            )}
            {result.is_abnormal && (
              <Badge variant="outline" className="text-xs border-red-300 text-red-600">Abnormal</Badge>
            )}
          </div>
        )}
      </Section>

      <Separator />

      {/* Comments */}
      <Section title="Comments">
        <div className="grid gap-3 sm:grid-cols-2">
          <CommentBlock
            icon={<FileText className="h-3.5 w-3.5" />}
            label="Patient-facing comment"
            value={result.comments}
            editable={isCommentEditable && canValidate}
            resultId={result.id}
          />
          <CommentBlock
            icon={<MessageSquare className="h-3.5 w-3.5" />}
            label="Internal notes"
            value={result.internal_notes}
            muted
          />
        </div>
        {result.validation_notes && (
          <div className="mt-2">
            <CommentBlock
              icon={<ShieldCheck className="h-3.5 w-3.5" />}
              label="Validation notes"
              value={result.validation_notes}
            />
          </div>
        )}
        {result.rejection_notes && (
          <div className="mt-2">
            <CommentBlock
              icon={<ShieldX className="h-3.5 w-3.5" />}
              label="Rejection reason"
              value={result.rejection_notes}
              destructive
            />
          </div>
        )}
      </Section>

      <Separator />

      {/* Metadata */}
      <Section title="Traceability">
        <div className="grid gap-2 sm:grid-cols-2 text-xs">
          <MetaRow icon={<User className="h-3 w-3" />} label="Entered by" value={result.entered_by_display || result.entered_by_email} />
          <MetaRow icon={<Clock className="h-3 w-3" />} label="Entered at" value={result.entered_at ? formatDateTime(result.entered_at) : null} />
          {(result.submitted_by_display || result.submitted_by_email) && (
            <MetaRow icon={<User className="h-3 w-3" />} label="Submitted by" value={result.submitted_by_display || result.submitted_by_email} />
          )}
          {result.submitted_at && (
            <MetaRow icon={<Clock className="h-3 w-3" />} label="Submitted at" value={formatDateTime(result.submitted_at)} />
          )}
          {(result.validated_by_display || result.validated_by_email) && (
            <MetaRow icon={<ShieldCheck className="h-3 w-3 text-blue-600" />} label="Validated by" value={result.validated_by_display || result.validated_by_email} />
          )}
          {result.validated_at && (
            <MetaRow icon={<Clock className="h-3 w-3" />} label="Validated at" value={formatDateTime(result.validated_at)} />
          )}
          {result.rejected_by_email && (
            <MetaRow icon={<ShieldX className="h-3 w-3 text-red-600" />} label="Rejected by" value={result.rejected_by_email} />
          )}
          {result.rejected_at && (
            <MetaRow icon={<Clock className="h-3 w-3" />} label="Rejected at" value={formatDateTime(result.rejected_at)} />
          )}
        </div>
      </Section>

      {/* Actions */}
      {isReviewable && (canValidate || canReject) && (
        <>
          <Separator />
          <div className="flex gap-2">
            {canValidate && (
              <Button className="gap-2" onClick={handleValidate} disabled={validateMut.isPending}>
                {validateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Validate Result
              </Button>
            )}
            {canReject && !showReject && (
              <Button variant="outline" className="gap-2 text-destructive hover:text-destructive"
                onClick={() => setShowReject(true)}
              >
                <ShieldX className="h-4 w-4" /> Reject Result
              </Button>
            )}
          </div>
          {showReject && (
            <div className="space-y-2 rounded-lg border border-destructive/30 p-3">
              <p className="text-sm font-medium text-destructive">Reject this result</p>
              <Textarea
                value={rejectReason}
                onChange={(e) => { setRejectReason(e.target.value); setRejectError(false) }}
                placeholder="Rejection reason (required)…"
                rows={2}
              />
              {rejectError && <p className="text-xs text-destructive">A rejection reason is required.</p>}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { setShowReject(false); setRejectReason('') }}
                  disabled={rejectMut.isPending}
                >
                  Cancel
                </Button>
                <Button size="sm" variant="destructive" onClick={handleReject} disabled={rejectMut.isPending}>
                  {rejectMut.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                  Reject
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-2">{title}</p>
      {children}
    </div>
  )
}

function CommentBlock({
  icon, label, value, muted, destructive, editable, resultId,
}: {
  icon: React.ReactNode
  label: string
  value: string
  muted?: boolean
  destructive?: boolean
  editable?: boolean
  resultId?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const updateMut = useUpdateReviewComments(resultId ?? '')

  async function handleSave() {
    try {
      await updateMut.mutateAsync({ comments: draft })
      toast.success('Patient comment updated.')
      setEditing(false)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { errors?: { message?: string }[] } } })
        ?.response?.data?.errors?.[0]?.message
      toast.error(msg || 'Failed to update comment.')
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon} {label}
      </div>
      {editing ? (
        <div className="space-y-1.5">
          <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} className="text-sm" />
          <div className="flex gap-1">
            <Button size="sm" variant="outline" className="text-xs h-6 px-2"
              onClick={() => setEditing(false)} disabled={updateMut.isPending}>Cancel</Button>
            <Button size="sm" className="text-xs h-6 px-2" onClick={handleSave} disabled={updateMut.isPending}>
              {updateMut.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />} Save
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-1">
          <p className={`text-sm ${destructive ? 'text-red-600' : muted ? 'text-muted-foreground' : ''}`}>
            {value || <span className="text-muted-foreground italic">None</span>}
          </p>
          {editable && resultId && (
            <Button size="sm" variant="ghost" className="h-5 w-5 p-0 shrink-0"
              onClick={() => { setDraft(value); setEditing(true) }}
              title="Edit patient comment"
            >
              <Pencil className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-muted-foreground">{label}:</span>
      <span>{value}</span>
    </div>
  )
}
