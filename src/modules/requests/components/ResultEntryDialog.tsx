import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { FormField } from '@/components/shared/FormField'
import { useCreateResult, useUpdateResult, useItemCurrentResult } from '@/modules/results/api'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemId: string
  examCode: string
  examName: string
}

export function ResultEntryDialog({
  open, onOpenChange, itemId, examCode, examName,
}: Props) {
  const { data: existing, isLoading: loadingExisting } = useItemCurrentResult(itemId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {existing?.status === 'DRAFT' ? 'Edit Draft Result' : 'Enter Result'}
          </DialogTitle>
          <DialogDescription>
            <span className="font-mono text-xs mr-1">{examCode}</span>
            {examName}
          </DialogDescription>
        </DialogHeader>

        {loadingExisting ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : (
          <ResultEntryForm
            key={existing?.id ?? 'new'}
            existing={existing?.status === 'DRAFT' ? existing : null}
            itemId={itemId}
            examCode={examCode}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function ResultEntryForm({
  existing,
  itemId,
  examCode,
  onClose,
}: {
  existing: { id: string; result_value: string; result_unit: string; reference_range: string; is_abnormal: boolean; comments: string; internal_notes: string } | null
  itemId: string
  examCode: string
  onClose: () => void
}) {
  const isEdit = !!existing
  const createMut = useCreateResult()
  const updateMut = useUpdateResult(existing?.id ?? '')

  const [resultValue, setResultValue] = useState(existing?.result_value ?? '')
  const [resultUnit, setResultUnit] = useState(existing?.result_unit ?? '')
  const [referenceRange, setReferenceRange] = useState(existing?.reference_range ?? '')
  const [isAbnormal, setIsAbnormal] = useState(existing?.is_abnormal ?? false)
  const [comments, setComments] = useState(existing?.comments ?? '')
  const [internalNotes, setInternalNotes] = useState(existing?.internal_notes ?? '')

  const isPending = createMut.isPending || updateMut.isPending

  async function handleSave() {
    const payload = {
      result_value: resultValue,
      result_unit: resultUnit,
      reference_range: referenceRange,
      is_abnormal: isAbnormal,
      comments,
      internal_notes: internalNotes,
    }
    try {
      if (isEdit) {
        await updateMut.mutateAsync(payload)
        toast.success(`Draft result updated for ${examCode}.`)
      } else {
        await createMut.mutateAsync({ item_id: itemId, ...payload })
        toast.success(`Draft result created for ${examCode}.`)
      }
      onClose()
    } catch {
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} result.`)
    }
  }

  return (
    <>
      <div className="space-y-4 py-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Result value" htmlFor="result_value">
            <Input
              id="result_value"
              value={resultValue}
              onChange={(e) => setResultValue(e.target.value)}
              placeholder="e.g. 12.5"
              className="font-mono"
            />
          </FormField>
          <FormField label="Unit" htmlFor="result_unit">
            <Input
              id="result_unit"
              value={resultUnit}
              onChange={(e) => setResultUnit(e.target.value)}
              placeholder="e.g. g/dL"
            />
          </FormField>
        </div>

        <FormField label="Reference range" htmlFor="reference_range">
          <Input
            id="reference_range"
            value={referenceRange}
            onChange={(e) => setReferenceRange(e.target.value)}
            placeholder="e.g. 12.0 – 16.0"
          />
        </FormField>

        <div className="flex items-center gap-3">
          <Switch
            id="is_abnormal"
            checked={isAbnormal}
            onCheckedChange={setIsAbnormal}
          />
          <Label htmlFor="is_abnormal" className="text-sm">
            Flag as abnormal
          </Label>
        </div>

        <FormField label="Comments" htmlFor="comments" hint="Visible on the result document.">
          <Textarea
            id="comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={2}
            placeholder="Patient-facing remarks…"
          />
        </FormField>

        <FormField label="Internal notes" htmlFor="internal_notes" hint="Lab-internal only, not shared with patient.">
          <Textarea
            id="internal_notes"
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            rows={2}
            placeholder="Lab notes…"
          />
        </FormField>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Save Draft' : 'Create Draft'}
        </Button>
      </DialogFooter>
    </>
  )
}
