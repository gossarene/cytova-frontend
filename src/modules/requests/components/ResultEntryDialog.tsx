import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Sparkles } from 'lucide-react'
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
import { computeAbnormalFromReference } from '@/modules/results/abnormalDetection'
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
  showAutoFlagHint,
  onValueChange,
  onAbnormalChange,
}: {
  examDef: ExamDefinitionDetail
  initialValue: string
  initialAbnormal: boolean
  /** True iff the current ``initialAbnormal`` was set by the
   *  auto-detection helper (not by an operator toggle). Drives the
   *  subtle "auto-flagged" hint required by spec §3. */
  showAutoFlagHint: boolean
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
      {showAutoFlagHint && <AutoFlaggedHint />}
    </div>
  )
}

/**
 * Subtle helper line under the abnormal switch when the flag was
 * set by the auto-detection helper. Hidden whenever:
 *   - the operator manually toggled the switch (manual override
 *     suppresses the hint until the value changes again),
 *   - no reference range is configured / parseable,
 *   - the value is non-numeric or empty.
 *
 * Required by spec §3 ``"Automatically marked abnormal because the
 * value is outside the reference range."``
 */
function AutoFlaggedHint() {
  return (
    <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
      <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
      <span>
        Automatically marked abnormal because the value is outside the
        reference range.
      </span>
    </p>
  )
}


// ---------------------------------------------------------------------------
// Form — MULTI_PARAMETER
// ---------------------------------------------------------------------------

interface ParamRow {
  parameter_id: string
  value: string
  is_abnormal: boolean
  /** Tracks whether the operator manually toggled the abnormal
   *  switch on this row. While ``true``, the auto-detector stops
   *  rewriting the flag — the operator's intent wins until the
   *  next value edit on this same row, which clears the flag. */
  manual_override: boolean
  /** True iff the current ``is_abnormal`` was set by the
   *  auto-detector (not by a manual toggle). Drives the per-row
   *  subtle hint required by spec §3. */
  auto_flagged: boolean
}

function MultiParameterForm({
  parameters,
  rows,
  onRowValueChange,
  onRowAbnormalChange,
}: {
  parameters: ExamParameterItem[]
  rows: ParamRow[]
  /** Value-edit handler. The parent recomputes the abnormal flag
   *  via ``computeAbnormalFromReference`` and clears the row's
   *  manual-override marker. */
  onRowValueChange: (paramId: string, value: string) => void
  /** Abnormal-toggle handler. The parent sets the row's
   *  manual-override marker so the next value edit doesn't fight
   *  the operator's choice. */
  onRowAbnormalChange: (paramId: string, isAbnormal: boolean) => void
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
            className="rounded-lg border px-2 py-1.5"
          >
            <div className="grid grid-cols-[1.5fr_1fr_auto_1fr_auto] gap-x-2 items-center">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" title={param.name}>{param.name}</p>
                <p className="text-[10px] font-mono text-muted-foreground">{param.code}</p>
              </div>
              <Input
                value={row?.value ?? ''}
                onChange={(e) => onRowValueChange(param.id, e.target.value)}
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
                onCheckedChange={(v) => onRowAbnormalChange(param.id, v)}
                size="sm"
              />
            </div>
            {row?.auto_flagged && (
              <div className="mt-1 px-1">
                <AutoFlaggedHint />
              </div>
            )}
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
  const [singleValue, setSingleValueRaw] = useState(existingSingleVal?.value ?? existing?.result_value ?? '')
  const [singleAbnormal, setSingleAbnormal] = useState(existingSingleVal?.is_abnormal ?? existing?.is_abnormal ?? false)
  // Manual-override marker (spec §4): the operator toggling the
  // abnormal switch sets this to ``true`` and the auto-detector
  // stops fighting them. Cleared by the next value edit.
  const [singleManualOverride, setSingleManualOverride] = useState(false)
  // Tracks whether the current ``singleAbnormal`` was set by the
  // auto-detector. Drives the subtle hint required by spec §3.
  const [singleAutoFlagged, setSingleAutoFlagged] = useState(false)

  /**
   * Handle a value edit on the single-value form.
   *
   * Always:
   *   - persist the new value as-is (no normalisation — the
   *     operator's keystrokes go straight into state and the
   *     model's TextField on save),
   *   - clear the manual override (spec §4 ``"when value changes
   *     again, recompute automatically"``).
   *
   * Then ask the helper for a decision:
   *   - ``true`` / ``false`` → set the abnormal flag accordingly
   *     and mark the row as auto-flagged so the hint can render.
   *   - ``null`` (indeterminate) → leave the abnormal flag
   *     untouched. Drop the auto-flagged marker so a stale hint
   *     from a prior recompute doesn't linger.
   */
  function handleSingleValueChange(next: string) {
    setSingleValueRaw(next)
    setSingleManualOverride(false)
    const decision = computeAbnormalFromReference(
      next, examDef.reference_range || '',
    )
    if (decision === null) {
      // Indeterminate — leave the existing abnormal flag alone but
      // drop the hint, so the operator isn't told the flag was
      // auto-set when it actually wasn't recomputed this round.
      setSingleAutoFlagged(false)
      return
    }
    setSingleAbnormal(decision)
    // Only show the hint when the auto-decision flipped the flag
    // ON. Showing it on ``false`` would be noise — "your value is
    // normal" doesn't need a banner.
    setSingleAutoFlagged(decision === true)
  }

  function handleSingleAbnormalChange(next: boolean) {
    setSingleAbnormal(next)
    // The operator's manual choice wins until they edit the value
    // again. Drop the auto-flag hint at the same time.
    setSingleManualOverride(true)
    setSingleAutoFlagged(false)
  }

  // Multi-parameter state. The row carries its own manual_override
  // and auto_flagged flags so each parameter has independent
  // override behaviour — toggling one row's switch doesn't
  // suppress auto-detection on the others.
  const [paramRows, setParamRows] = useState<ParamRow[]>(() => {
    if (!existing?.values) return []
    return existing.values
      .filter((v) => v.parameter_id)
      .map((v) => ({
        parameter_id: v.parameter_id!,
        value: v.value,
        is_abnormal: v.is_abnormal,
        manual_override: false,
        auto_flagged: false,
      }))
  })

  // Shared fields
  const [comments, setComments] = useState(existing?.comments ?? '')
  const [internalNotes, setInternalNotes] = useState(existing?.internal_notes ?? '')

  const isPending = createMut.isPending || updateMut.isPending

  /**
   * Multi-parameter value edit. Mirrors the single-value contract
   * row-by-row: clears the row's manual override, runs the helper
   * against the row's parameter reference range, applies the
   * auto-decision when non-null, leaves the flag alone otherwise.
   */
  function handleParamValueChange(paramId: string, value: string) {
    const param = (examDef.parameters ?? []).find((p) => p.id === paramId)
    const refRange = param?.reference_range || ''
    const decision = computeAbnormalFromReference(value, refRange)
    setParamRows((prev) => {
      const idx = prev.findIndex((r) => r.parameter_id === paramId)
      const baseRow = idx >= 0
        ? prev[idx]
        : {
            parameter_id: paramId, value: '',
            is_abnormal: false,
            manual_override: false, auto_flagged: false,
          }
      const nextRow: ParamRow = {
        ...baseRow,
        value,
        manual_override: false,
        // Apply the auto-decision when it produced a verdict;
        // otherwise leave the flag alone (and drop a stale hint).
        is_abnormal: decision === null ? baseRow.is_abnormal : decision,
        auto_flagged: decision === true,
      }
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = nextRow
        return updated
      }
      return [...prev, nextRow]
    })
  }

  function handleParamAbnormalChange(paramId: string, isAbnormal: boolean) {
    setParamRows((prev) => {
      const idx = prev.findIndex((r) => r.parameter_id === paramId)
      const baseRow = idx >= 0
        ? prev[idx]
        : {
            parameter_id: paramId, value: '',
            is_abnormal: false,
            manual_override: false, auto_flagged: false,
          }
      const nextRow: ParamRow = {
        ...baseRow,
        is_abnormal: isAbnormal,
        manual_override: true,
        auto_flagged: false,
      }
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = nextRow
        return updated
      }
      return [...prev, nextRow]
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
            // Helper text only renders when (a) the auto-detector
            // set the flag this round AND (b) the operator hasn't
            // manually overridden since. The override path drops
            // ``singleAutoFlagged`` itself so checking it alone is
            // sufficient — the explicit ``!singleManualOverride``
            // here is belt-and-braces in case a future code path
            // forgets to drop the marker.
            showAutoFlagHint={singleAutoFlagged && !singleManualOverride}
            onValueChange={handleSingleValueChange}
            onAbnormalChange={handleSingleAbnormalChange}
          />
        ) : (
          <MultiParameterForm
            parameters={examDef.parameters ?? []}
            rows={paramRows}
            onRowValueChange={handleParamValueChange}
            onRowAbnormalChange={handleParamAbnormalChange}
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
