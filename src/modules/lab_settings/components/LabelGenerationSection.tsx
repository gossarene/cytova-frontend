import { useId } from 'react'
import { Hash, RotateCcw, Eye } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormField } from '@/components/shared/FormField'
import { cn } from '@/lib/utils'
import type { LabSettings } from '../types'


type NumberingMode = LabSettings['label_numbering_mode']
type ResetPeriod = LabSettings['label_sequence_reset_period']

interface Props {
  numberingMode: NumberingMode
  extraLabelCount: number
  resetPeriod: ResetPeriod
  onNumberingModeChange: (next: NumberingMode) => void
  onExtraLabelCountChange: (next: number) => void
  onResetPeriodChange: (next: ResetPeriod) => void
}

/**
 * Lab Settings — label generation behaviour (numbering mode +
 * extras + sequence reset cadence).
 *
 * Pairs with the existing ``LabelPrintingSettings`` block, which
 * owns the print-mode + paper layout knobs. Generation behaviour
 * is conceptually distinct ("how do we ASSIGN numbers and how
 * many labels do we print" vs "how do we LAY them out on paper")
 * so the two live in separate sub-sections inside the same
 * collapsible Label Printing card.
 *
 * Live preview
 * ------------
 * The bottom block recomputes "3 families → N labels (3 + X
 * extra)" + numbering-mode summary on every render, mirroring the
 * exact math the backend ``LabelCountStrategy`` runs at generation
 * time. The "3 families" assumption comes from spec §1.4 — it's the
 * canonical sample size that lets the operator see the practical
 * impact of their settings without having to model the full
 * request lifecycle.
 */
export function LabelGenerationSection({
  numberingMode, extraLabelCount, resetPeriod,
  onNumberingModeChange, onExtraLabelCountChange, onResetPeriodChange,
}: Props) {
  // Stable IDs so the radio inputs' ``name`` attribute groups them
  // correctly even if multiple instances of this component are
  // mounted on the same page (defensive — there's only one today).
  const numberingGroupId = useId()
  const resetGroupId = useId()

  // Preview math — assume 3 families per spec §1.4. The number of
  // labels mirrors the backend ``LabelCountStrategy.compute``: family
  // count + extras for PER_FAMILY mode, and the same total for
  // SAME_REQUEST_NUMBER mode (the SHARING is the difference, not the
  // count). The Math.max keeps the preview honest if a future field
  // value somehow lands negative — UI can't trust the input value
  // until the user blurs.
  const sampleFamilies = 3
  const safeExtras = Math.max(0, Number.isFinite(extraLabelCount) ? extraLabelCount : 0)
  const totalLabels = sampleFamilies + safeExtras
  const numberingSummary = numberingMode === 'SAME_REQUEST_NUMBER'
    ? 'Same number for all labels'
    : 'One number per label'
  const resetSummary = resetPeriod === 'YEARLY' ? 'yearly' : 'monthly'

  return (
    <div className="space-y-5">
      {/* Numbering mode */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Label numbering</Label>
        <RadioCardGroup
          name={numberingGroupId}
          value={numberingMode}
          onChange={(v) => onNumberingModeChange(v as NumberingMode)}
          options={[
            {
              value: 'PER_FAMILY',
              label: 'One number per label',
              hint: 'Recommended. Each label carries its own unique number.',
            },
            {
              value: 'SAME_REQUEST_NUMBER',
              label: 'Same number for all labels in a request',
              hint: 'A single number is shared across every label in the same batch.',
            },
          ]}
        />
        <p className="text-xs text-muted-foreground">
          Choose whether each label gets a unique number or all
          labels share the same number.
        </p>
      </div>

      {/* Extra labels */}
      <FormField
        label="Extra labels"
        htmlFor="extra-label-count"
        hint="Additional labels added on top of exam families (e.g. spare tubes or backup labels). Typical 0–5."
      >
        <Input
          id="extra-label-count"
          type="number"
          min={0}
          step={1}
          value={extraLabelCount}
          onChange={(e) => {
            // Clamp to a non-negative integer client-side. The
            // backend MinValueValidator(0) is the authoritative
            // gate; this is a UX nicety so the operator can't
            // accidentally type ``-1`` and stare at a 400 toast
            // after Save.
            const raw = e.target.value
            const parsed = raw === '' ? 0 : Number(raw)
            const next = Number.isFinite(parsed)
              ? Math.max(0, Math.floor(parsed))
              : 0
            onExtraLabelCountChange(next)
          }}
          className="w-24 text-sm"
        />
      </FormField>

      {/* Sequence reset */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Sequence reset</Label>
        <RadioCardGroup
          name={resetGroupId}
          value={resetPeriod}
          onChange={(v) => onResetPeriodChange(v as ResetPeriod)}
          options={[
            { value: 'MONTHLY', label: 'Monthly' },
            { value: 'YEARLY', label: 'Yearly' },
          ]}
          variant="compact"
        />
        <p className="text-xs text-muted-foreground">
          Defines how often label numbering restarts.
        </p>
      </div>

      {/* Live preview — "3 families → N labels" */}
      <div className="rounded-md border border-slate-200 bg-slate-50/60 p-3">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Eye className="h-3 w-3" />
          Preview
        </div>
        <ul className="space-y-1.5 text-sm">
          <li className="flex items-start gap-2">
            <Hash className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span>
              {sampleFamilies} families →{' '}
              <span className="font-medium">
                {totalLabels} label{totalLabels === 1 ? '' : 's'}
              </span>
              <span className="text-muted-foreground">
                {' '}({sampleFamilies} + {safeExtras} extra
                {safeExtras === 1 ? '' : 's'})
              </span>
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Hash className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span>
              Numbering:{' '}
              <span className="font-medium">{numberingSummary}</span>
            </span>
          </li>
          <li className="flex items-start gap-2">
            <RotateCcw className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span>
              Sequence resets{' '}
              <span className="font-medium">{resetSummary}</span>
            </span>
          </li>
        </ul>
      </div>
    </div>
  )
}


// ---------------------------------------------------------------------------
// RadioCardGroup — minimal radio-as-card primitive
// ---------------------------------------------------------------------------

interface RadioCardOption {
  value: string
  label: string
  hint?: string
}

/**
 * Stacked button-card radio group. The project doesn't ship a
 * dedicated <RadioGroup> primitive, and a <Select> would feel
 * heavy for the binary "this OR that" choices in this section.
 * Card-style radios match the Stripe/Linear aesthetic the spec
 * requests and give the helper text a natural visual home.
 *
 * The underlying input type IS a real ``<input type="radio">`` so
 * keyboard navigation, accessibility tree, and form-control
 * semantics work out of the box. The visible card is purely
 * presentation.
 */
function RadioCardGroup({
  name, value, onChange, options, variant = 'default',
}: {
  name: string
  value: string
  onChange: (next: string) => void
  options: RadioCardOption[]
  /** ``compact`` removes the multi-line padding for short binary
   *  choices like Monthly / Yearly where there's no helper text. */
  variant?: 'default' | 'compact'
}) {
  return (
    <div
      role="radiogroup"
      className={cn(
        variant === 'compact' ? 'flex flex-wrap gap-2' : 'space-y-2',
      )}
    >
      {options.map((opt) => {
        const checked = value === opt.value
        const inputId = `${name}-${opt.value}`
        return (
          <label
            key={opt.value}
            htmlFor={inputId}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-md border px-3 transition-colors',
              variant === 'compact' ? 'py-1.5' : 'py-2.5',
              checked
                ? 'border-primary/60 bg-primary/5'
                : 'border-slate-200 bg-white hover:border-slate-300',
            )}
          >
            <input
              id={inputId}
              type="radio"
              name={name}
              value={opt.value}
              checked={checked}
              onChange={() => onChange(opt.value)}
              className="mt-0.5 h-4 w-4 cursor-pointer accent-primary"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-tight">
                {opt.label}
              </p>
              {opt.hint && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {opt.hint}
                </p>
              )}
            </div>
          </label>
        )
      })}
    </div>
  )
}
