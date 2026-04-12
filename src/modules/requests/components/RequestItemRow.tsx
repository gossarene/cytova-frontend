import { Trash2, ChevronDown, ChevronUp, FlaskConical, Info } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/currency'
import { EXECUTION_MODE_OPTIONS } from '../types'
import type { ExecutionMode, RequestItemInput } from '../types'

interface ExamOption {
  id: string
  code: string
  name: string
  sample_type: string
  unit_price: string
}

interface Props {
  item: RequestItemInput & { _exam: ExamOption }
  index: number
  onUpdate: (index: number, updates: Partial<RequestItemInput>) => void
  onRemove: (index: number) => void
  disabled?: boolean
  /**
   * Whether to expose the manual ``billed_price`` override field in the
   * expanded-details panel. Defaults to ``true`` for backward-compat with
   * the legacy draft-edit flow; the new 3-step request-creation workflow
   * passes ``false`` so the backend resolver is the single source of
   * truth for pricing and no manual editing leaks into the UI.
   */
  allowPriceOverride?: boolean
  /**
   * Whether to expose the external partner name input in the expanded
   * panel. Defaults to ``true`` for backward-compat with the legacy
   * draft-edit flow; the 3-step wizard passes ``false`` to keep Step 1
   * minimal and operational.
   */
  showExternalPartner?: boolean
}

export function RequestItemRow({
  item, index, onUpdate, onRemove, disabled,
  allowPriceOverride = true,
  showExternalPartner = true,
}: Props) {
  const [expanded, setExpanded] = useState(false)
  const exam = item._exam
  const isRejected = item.execution_mode === 'REJECTED'
  const hasOverride = item.billed_price !== null && item.billed_price !== undefined

  // The expanded section only exists if there is actually something to
  // show. For the 3-step wizard (no billed override, no external
  // partner) that leaves just the item notes, which is still useful.
  const hasExpandedContent = allowPriceOverride || showExternalPartner || true // notes always

  return (
    <div className={cn(
      'rounded-lg border transition-colors',
      isRejected ? 'bg-red-50/50 border-red-200' : 'bg-card',
    )}>
      {/* Top row — identity + pricing + actions */}
      <div className="flex items-center gap-3 px-4 pt-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary/10">
          <FlaskConical className="h-4 w-4 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{exam.code}</span>
            <span className="text-sm font-medium truncate">{exam.name}</span>
            <Badge variant="outline" className="text-[10px] shrink-0">{exam.sample_type}</Badge>
          </div>
        </div>

        {/* Pricing columns */}
        <div className="hidden sm:flex items-center gap-4 shrink-0">
          <div className="text-right w-24">
            <p className="text-xs text-muted-foreground">Unit price</p>
            <p className="text-sm font-mono">{isRejected ? '\u2014' : formatCurrency(exam.unit_price)}</p>
          </div>
          {allowPriceOverride && (
            <div className="text-right w-28">
              <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                Billed
                {hasOverride && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-amber-500" />
                    </TooltipTrigger>
                    <TooltipContent>Manual override</TooltipContent>
                  </Tooltip>
                )}
              </p>
              <p className={cn('text-sm font-mono font-semibold', isRejected && 'text-muted-foreground')}>
                {isRejected ? '0' : hasOverride ? formatCurrency(item.billed_price!) : formatCurrency(exam.unit_price)}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {hasExpandedContent && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setExpanded(!expanded)}
              aria-label={expanded ? 'Collapse item details' : 'Expand item details'}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(index)}
            disabled={disabled}
            aria-label="Remove item"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/*
        Execution mode — promoted out of the expanded panel so the
        user sees and can change it without expanding each row. Sits
        on its own line indented under the identity so it aligns
        visually with the exam name.
      */}
      <div className="flex items-center gap-2 px-4 pb-3 pt-2 pl-[3.25rem]">
        <label
          htmlFor={`item-${index}-execution-mode`}
          className="text-xs text-muted-foreground shrink-0"
        >
          Mode
        </label>
        <Select
          value={item.execution_mode ?? 'INTERNAL'}
          onValueChange={(v) => { if (v) onUpdate(index, { execution_mode: v as ExecutionMode }) }}
          disabled={disabled}
          items={EXECUTION_MODE_OPTIONS}
        >
          <SelectTrigger
            id={`item-${index}-execution-mode`}
            className="h-7 w-full sm:w-44 text-xs"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EXECUTION_MODE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Expanded details — holds optional fields only */}
      {expanded && (
        <div className="border-t px-4 py-3 space-y-3">
          {(allowPriceOverride || showExternalPartner) && (
            <div className={cn(
              'grid gap-3',
              allowPriceOverride && showExternalPartner ? 'sm:grid-cols-2' : 'sm:grid-cols-1',
            )}>
              {allowPriceOverride && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Billed price override
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Auto-resolved"
                    value={item.billed_price ?? ''}
                    onChange={(e) => onUpdate(index, { billed_price: e.target.value || null })}
                    className="h-8 text-xs font-mono"
                    disabled={disabled || isRejected}
                  />
                </div>
              )}
              {showExternalPartner && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">External partner</label>
                  <Input
                    placeholder="External lab name"
                    value={item.external_partner_name ?? ''}
                    onChange={(e) => onUpdate(index, { external_partner_name: e.target.value })}
                    className="h-8 text-xs"
                    disabled={disabled}
                  />
                </div>
              )}
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Item notes</label>
            <Input
              placeholder="Special instructions for this exam..."
              value={item.notes ?? ''}
              onChange={(e) => onUpdate(index, { notes: e.target.value })}
              className="h-8 text-xs"
              disabled={disabled}
            />
          </div>
        </div>
      )}
    </div>
  )
}
