import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import {
  Dialog, DialogContentLarge, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { FormField } from '@/components/shared/FormField'
import { useCreateResult, useUpdateResult, useItemCurrentResult } from '@/modules/results/api'
import { useExamDefinition } from '@/modules/catalog/api'
import type { ResultDetail } from '@/modules/results/types'
import type { ExamDefinitionDetail, ExamParameterItem } from '@/modules/catalog/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemId: string
  examDefinitionId: string
  examCode: string
  examName: string
}

export function ResultEntryDialog({
  open, onOpenChange, itemId, examDefinitionId, examCode, examName,
}: Props) {
  const { data: existing, isLoading: loadingExisting } = useItemCurrentResult(itemId)
  const { data: examDef, isLoading: loadingExam } = useExamDefinition(examDefinitionId)
  const isLoading = loadingExisting || loadingExam

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContentLarge>
        <DialogHeader>
          <DialogTitle>
            {existing?.status === 'DRAFT' ? 'Edit Draft Result' : 'Enter Result'}
          </DialogTitle>
          <DialogDescription>
            <span className="font-mono text-xs mr-1">{examCode}</span>
            {examName}
            {examDef && (
              <Badge variant="outline" className="ml-2 text-[10px]">
                {examDef.result_structure === 'MULTI_PARAMETER' ? 'Multi-Parameter' : 'Single Value'}
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : examDef ? (
          <ResultEntryForm
            key={existing?.id ?? 'new'}
            existing={existing?.status === 'DRAFT' ? existing : null}
            examDef={examDef}
            itemId={itemId}
            examCode={examCode}
            onClose={() => onOpenChange(false)}
          />
        ) : (
          <p className="py-4 text-sm text-muted-foreground text-center">
            Exam definition not found.
          </p>
        )}
      </DialogContentLarge>
    </Dialog>
  )
}


// ---------------------------------------------------------------------------
// Form — SINGLE_VALUE
// ---------------------------------------------------------------------------

function SingleValueForm({
  examDef,
  initialValue,
  initialAbnormal,
  onValueChange,
  onAbnormalChange,
}: {
  examDef: ExamDefinitionDetail
  initialValue: string
  initialAbnormal: boolean
  onValueChange: (v: string) => void
  onAbnormalChange: (v: boolean) => void
}) {
  return (
    <div className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto] items-end">
        <FormField label="Result value" htmlFor="sv-value" required>
          <Input
            id="sv-value"
            value={initialValue}
            onChange={(e) => onValueChange(e.target.value)}
            placeholder="e.g. 12.5"
            className="font-mono"
          />
        </FormField>
        <div className="text-sm text-muted-foreground pb-2">
          {examDef.unit || '—'}
        </div>
        <div className="text-xs text-muted-foreground pb-2">
          {examDef.reference_range ? `Ref: ${examDef.reference_range}` : ''}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Switch id="sv-abnormal" checked={initialAbnormal} onCheckedChange={onAbnormalChange} />
        <Label htmlFor="sv-abnormal" className="text-sm">Flag as abnormal</Label>
      </div>
    </div>
  )
}


// ---------------------------------------------------------------------------
// Form — MULTI_PARAMETER
// ---------------------------------------------------------------------------

interface ParamRow {
  parameter_id: string
  value: string
  is_abnormal: boolean
}

function MultiParameterForm({
  parameters,
  rows,
  onRowChange,
}: {
  parameters: ExamParameterItem[]
  rows: ParamRow[]
  onRowChange: (paramId: string, field: 'value' | 'is_abnormal', val: string | boolean) => void
}) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1.5fr_1fr_auto_1fr_auto] gap-x-2 gap-y-0 text-xs font-medium text-muted-foreground px-1">
        <span>Parameter</span>
        <span>Value</span>
        <span>Unit</span>
        <span>Ref. Range</span>
        <span>ABN</span>
      </div>
      {parameters.filter((p) => p.is_active).map((param) => {
        const row = rows.find((r) => r.parameter_id === param.id)
        return (
          <div
            key={param.id}
            className="grid grid-cols-[1.5fr_1fr_auto_1fr_auto] gap-x-2 items-center rounded-lg border px-2 py-1.5"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" title={param.name}>{param.name}</p>
              <p className="text-[10px] font-mono text-muted-foreground">{param.code}</p>
            </div>
            <Input
              value={row?.value ?? ''}
              onChange={(e) => onRowChange(param.id, 'value', e.target.value)}
              placeholder="—"
              className="font-mono h-7 text-sm"
            />
            <span className="text-xs text-muted-foreground whitespace-nowrap px-1">
              {param.unit || '—'}
            </span>
            <span className="text-xs text-muted-foreground truncate" title={param.reference_range}>
              {param.reference_range || '—'}
            </span>
            <Switch
              checked={row?.is_abnormal ?? false}
              onCheckedChange={(v) => onRowChange(param.id, 'is_abnormal', v)}
              size="sm"
            />
          </div>
        )
      })}
    </div>
  )
}


// ---------------------------------------------------------------------------
// Main form orchestrator
// ---------------------------------------------------------------------------

function ResultEntryForm({
  existing,
  examDef,
  itemId,
  examCode,
  onClose,
}: {
  existing: ResultDetail | null
  examDef: ExamDefinitionDetail
  itemId: string
  examCode: string
  onClose: () => void
}) {
  const isEdit = !!existing
  const createMut = useCreateResult()
  const updateMut = useUpdateResult(existing?.id ?? '')
  const isSingle = examDef.result_structure === 'SINGLE_VALUE'

  // Single-value state
  const existingSingleVal = existing?.values?.find((v) => !v.parameter_id)
  const [singleValue, setSingleValue] = useState(existingSingleVal?.value ?? existing?.result_value ?? '')
  const [singleAbnormal, setSingleAbnormal] = useState(existingSingleVal?.is_abnormal ?? existing?.is_abnormal ?? false)

  // Multi-parameter state
  const [paramRows, setParamRows] = useState<ParamRow[]>(() => {
    if (!existing?.values) return []
    return existing.values
      .filter((v) => v.parameter_id)
      .map((v) => ({
        parameter_id: v.parameter_id!,
        value: v.value,
        is_abnormal: v.is_abnormal,
      }))
  })

  // Shared fields
  const [comments, setComments] = useState(existing?.comments ?? '')
  const [internalNotes, setInternalNotes] = useState(existing?.internal_notes ?? '')

  const isPending = createMut.isPending || updateMut.isPending

  function handleParamRowChange(paramId: string, field: 'value' | 'is_abnormal', val: string | boolean) {
    setParamRows((prev) => {
      const idx = prev.findIndex((r) => r.parameter_id === paramId)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = { ...updated[idx], [field]: val }
        return updated
      }
      return [...prev, { parameter_id: paramId, value: field === 'value' ? (val as string) : '', is_abnormal: field === 'is_abnormal' ? (val as boolean) : false }]
    })
  }

  async function handleSave() {
    const values = isSingle
      ? [{ value: singleValue, is_abnormal: singleAbnormal }]
      : paramRows.filter((r) => r.value.trim())

    const payload: Record<string, unknown> = {
      result_value: isSingle ? singleValue : '',
      is_abnormal: isSingle ? singleAbnormal : false,
      comments,
      internal_notes: internalNotes,
      values,
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
        {isSingle ? (
          <SingleValueForm
            examDef={examDef}
            initialValue={singleValue}
            initialAbnormal={singleAbnormal}
            onValueChange={setSingleValue}
            onAbnormalChange={setSingleAbnormal}
          />
        ) : (
          <MultiParameterForm
            parameters={examDef.parameters ?? []}
            rows={paramRows}
            onRowChange={handleParamRowChange}
          />
        )}

        <FormField label="Comments" htmlFor="rv-comments" hint="Visible on the result document.">
          <Textarea
            id="rv-comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={2}
            placeholder="Patient-facing remarks…"
          />
        </FormField>

        <FormField label="Internal notes" htmlFor="rv-notes" hint="Lab-internal only, not shared with patient.">
          <Textarea
            id="rv-notes"
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
