import { useState } from 'react'
import { toast } from 'sonner'
import {
  Send, CheckCircle2, XCircle, Megaphone, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Can } from '@/lib/permissions/Can'
import { P } from '@/lib/permissions/constants'
import {
  useSubmitResult, useValidateResult, useRejectValidation, usePublishResult,
} from '../api'
import type { ResultStatus } from '../types'

interface Props {
  resultId: string
  status: ResultStatus
  hasValue: boolean
}

export function ResultActions({ resultId, status, hasValue }: Props) {
  const submitMut = useSubmitResult(resultId)
  const validateMut = useValidateResult(resultId)
  const rejectMut = useRejectValidation(resultId)
  const publishMut = usePublishResult(resultId)

  const [showValidate, setShowValidate] = useState(false)
  const [showReject, setShowReject] = useState(false)
  const [showPublish, setShowPublish] = useState(false)
  const [validationNotes, setValidationNotes] = useState('')
  const [rejectNotes, setRejectNotes] = useState('')

  async function handleSubmit() {
    try {
      await submitMut.mutateAsync()
      toast.success('Result submitted for validation.')
    } catch { toast.error('Failed to submit.') }
  }

  async function handleValidate() {
    try {
      await validateMut.mutateAsync(validationNotes)
      toast.success('Result validated.')
      setShowValidate(false)
      setValidationNotes('')
    } catch { toast.error('Validation failed.') }
  }

  async function handleReject() {
    if (!rejectNotes.trim()) { toast.error('Rejection reason is required.'); return }
    try {
      await rejectMut.mutateAsync(rejectNotes)
      toast.success('Result sent back for revision.')
      setShowReject(false)
      setRejectNotes('')
    } catch { toast.error('Rejection failed.') }
  }

  async function handlePublish() {
    try {
      await publishMut.mutateAsync()
      toast.success('Result published.')
      setShowPublish(false)
    } catch { toast.error('Publication failed.') }
  }

  const anyPending = submitMut.isPending || validateMut.isPending || rejectMut.isPending || publishMut.isPending

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* DRAFT → Submit for validation */}
        {status === 'DRAFT' && (
          <Can permission={P.RESULTS_CREATE}>
            <Button
              className="w-full gap-2"
              onClick={handleSubmit}
              disabled={anyPending || !hasValue}
            >
              {submitMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Submit for Validation
            </Button>
            {!hasValue && (
              <p className="text-xs text-muted-foreground text-center">
                Enter a result value before submitting.
              </p>
            )}
          </Can>
        )}

        {/* PENDING_VALIDATION → Validate or Reject */}
        {status === 'PENDING_VALIDATION' && (
          <Can permission={P.RESULTS_VALIDATE}>
            <div className="space-y-2">
              <Button
                className="w-full gap-2"
                onClick={() => setShowValidate(true)}
                disabled={anyPending}
              >
                <CheckCircle2 className="h-4 w-4" />
                Validate Result
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2 text-destructive hover:text-destructive"
                onClick={() => setShowReject(true)}
                disabled={anyPending}
              >
                <XCircle className="h-4 w-4" />
                Reject / Send Back
              </Button>
            </div>
          </Can>
        )}

        {/* VALIDATED → Publish */}
        {status === 'VALIDATED' && (
          <Can permission={P.RESULTS_PUBLISH}>
            <Button
              className="w-full gap-2"
              onClick={() => setShowPublish(true)}
              disabled={anyPending}
            >
              <Megaphone className="h-4 w-4" />
              Publish Result
            </Button>
          </Can>
        )}

        {/* PUBLISHED — no actions */}
        {status === 'PUBLISHED' && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            Result published. No further changes allowed.
          </div>
        )}

        {/* Validate dialog */}
        {showValidate && (
          <ConfirmDialog
            open
            onOpenChange={setShowValidate}
            title="Validate result"
            description="Confirm that this result has been reviewed and is accurate."
            confirmLabel="Validate"
            onConfirm={handleValidate}
            isLoading={validateMut.isPending}
          />
        )}

        {/* Reject dialog — requires notes */}
        {showReject && (
          <ConfirmDialog
            open
            onOpenChange={(open) => { setShowReject(open); if (!open) setRejectNotes('') }}
            title="Reject result"
            description="Send this result back to DRAFT for revision. A rejection reason is required."
            confirmLabel="Reject"
            variant="destructive"
            onConfirm={handleReject}
            isLoading={rejectMut.isPending}
          />
        )}

        {/* Publish dialog — HIGH RISK: requires typing PUBLISH */}
        {showPublish && (
          <ConfirmDialog
            open
            onOpenChange={setShowPublish}
            title="Publish result"
            description="This action is IRREVERSIBLE. Once published, this result cannot be modified. It will become visible to the patient."
            confirmLabel="Publish"
            variant="destructive"
            requireConfirmText="PUBLISH"
            onConfirm={handlePublish}
            isLoading={publishMut.isPending}
          />
        )}
      </CardContent>
    </Card>
  )
}
