import { useMemo } from 'react'
import { Printer, Info } from 'lucide-react'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { FormField } from '@/components/shared/FormField'
import { useLabelDefaults, useLabelPresets } from '../api'
import type {
  LabSettings, LabelPrintMode, LabelPrintPreset,
} from '../types'


const NO_PRESET = '__NONE__'

const MODE_LABELS: Record<LabelPrintMode, string> = {
  A4_SHEET: 'A4 Sheet',
  THERMAL_ROLL: 'Thermal Roll',
}

// Shape matches the pattern used in PartnerForm — ``items`` on <Select>
// makes <SelectValue> render the human label in the closed trigger
// instead of the raw enum code.
const PRINT_MODE_OPTIONS: { value: LabelPrintMode; label: string }[] = [
  { value: 'A4_SHEET', label: MODE_LABELS.A4_SHEET },
  { value: 'THERMAL_ROLL', label: MODE_LABELS.THERMAL_ROLL },
]

const MODE_DESCRIPTIONS: Record<LabelPrintMode, string> = {
  A4_SHEET:
    'Print multiple labels per A4 (or custom) page using a regular office printer and adhesive label sheets.',
  THERMAL_ROLL:
    'Print one label per feed on a thermal label printer (e.g. Zebra, Dymo) using a continuous roll.',
}


interface Props {
  form: LabSettings
  /**
   * Generic setter. Declared as ``unknown`` because the card manipulates
   * a heterogeneous mix of strings, numbers, and booleans — the parent
   * form holds the fully typed shape, so the cast is safe locally.
   */
  update: (key: keyof LabSettings, value: unknown) => void
  /**
   * Batch update — used when applying a preset or per-mode defaults
   * to avoid flickering the UI through N single-key updates.
   */
  updateMany: (partial: Partial<LabSettings>) => void
  /** When true, omit the outer Card wrapper. Used by callers (e.g. the
      Lab Settings page) that already render the section inside their own
      collapsible card and don't want a Card-in-Card. The header /
      description copy is preserved by the wrapping component. */
  bare?: boolean
}


export function LabelPrintingSettings({ form, update, updateMany, bare = false }: Props) {
  const presetsQ = useLabelPresets()
  const defaultsQ = useLabelDefaults()

  const mode = form.label_print_mode
  const presets = presetsQ.data ?? []
  const presetsForMode = useMemo(
    () => presets.filter((p) => p.print_mode === mode),
    [presets, mode],
  )

  // --------------------------------------------------------------
  // Smart-defaults / preset application
  // --------------------------------------------------------------

  function applyPreset(preset: LabelPrintPreset) {
    updateMany({
      label_preset: preset.id,
      label_print_mode: preset.print_mode,
      label_page_width_mm: preset.page_width_mm,
      label_page_height_mm: preset.page_height_mm,
      label_label_width_mm: preset.label_width_mm,
      label_label_height_mm: preset.label_height_mm,
      label_margin_top_mm: preset.margin_top_mm,
      label_margin_left_mm: preset.margin_left_mm,
      label_horizontal_gap_mm: preset.horizontal_gap_mm,
      label_vertical_gap_mm: preset.vertical_gap_mm,
      label_thermal_gap_mm: preset.thermal_gap_mm,
      label_show_barcode: preset.show_barcode,
      label_show_numeric_code: preset.show_numeric_code,
    })
  }

  function applyModeDefaults(nextMode: LabelPrintMode) {
    const defaults = defaultsQ.data?.[nextMode]
    if (!defaults) {
      update('label_print_mode', nextMode)
      update('label_preset', null)
      return
    }
    updateMany({
      label_print_mode: nextMode,
      label_preset: null,
      label_page_width_mm: defaults.page_width_mm,
      label_page_height_mm: defaults.page_height_mm,
      label_label_width_mm: defaults.label_width_mm,
      label_label_height_mm: defaults.label_height_mm,
      label_margin_top_mm: defaults.margin_top_mm,
      label_margin_left_mm: defaults.margin_left_mm,
      label_horizontal_gap_mm: defaults.horizontal_gap_mm,
      label_vertical_gap_mm: defaults.vertical_gap_mm,
      label_thermal_gap_mm: defaults.thermal_gap_mm,
      label_show_barcode: defaults.show_barcode,
      label_show_numeric_code: defaults.show_numeric_code,
    })
  }

  function handleModeChange(next: string | null) {
    if (!next || next === mode) return
    applyModeDefaults(next as LabelPrintMode)
  }

  function handlePresetChange(next: string | null) {
    if (!next || next === NO_PRESET) {
      update('label_preset', null)
      return
    }
    const preset = presets.find((p) => p.id === next)
    if (preset) applyPreset(preset)
  }

  // --------------------------------------------------------------
  // Rendering
  // --------------------------------------------------------------

  // The body content is identical in both modes — only the outer Card
  // wrapper is conditionally rendered.
  const body = (
    <div className="space-y-6">
        {/* --- Mode selector ------------------------------------ */}
        <FormField
          label="Print mode"
          htmlFor="label_print_mode"
          hint={MODE_DESCRIPTIONS[mode]}
        >
          <Select
            value={mode}
            onValueChange={handleModeChange}
            items={PRINT_MODE_OPTIONS}
          >
            <SelectTrigger id="label_print_mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRINT_MODE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        {/* --- Preset selector --------------------------------- */}
        {presetsForMode.length > 0 && (
          <FormField
            label="Preset (optional)"
            htmlFor="label_preset"
            hint="Picking a preset fills in the fields below. You can still edit any value afterwards."
          >
            <Select
              value={form.label_preset ?? NO_PRESET}
              onValueChange={handlePresetChange}
            >
              <SelectTrigger id="label_preset">
                <SelectValue placeholder="Custom (no preset)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PRESET}>Custom (no preset)</SelectItem>
                {presetsForMode.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                    {p.is_system && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        · Cytova default
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        )}

        <Separator />

        {/* --- Layout fields (mode-specific) ------------------ */}
        {mode === 'A4_SHEET' ? (
          <A4Fields form={form} update={update} />
        ) : (
          <ThermalFields form={form} update={update} />
        )}

        <Separator />

        {/* --- Shared display options ------------------------- */}
        <div>
          <h4 className="mb-3 text-sm font-medium">Label content</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <ToggleRow
              id="label_show_barcode"
              label="Show barcode"
              hint="Code 128 barcode — scanable on most readers."
              checked={form.label_show_barcode}
              onChange={(v) => update('label_show_barcode', v)}
            />
            <ToggleRow
              id="label_show_numeric_code"
              label="Show numeric code"
              hint="Human-readable number. Useful for manual entry."
              checked={form.label_show_numeric_code}
              onChange={(v) => update('label_show_numeric_code', v)}
            />
          </div>
        </div>

        {/* --- Explainer --------------------------------------- */}
        <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>
            Values above are the <strong>effective configuration</strong> used to render
            labels. Presets are only a starting template — once applied, their values are
            copied here. Any future edit to a preset by the Cytova platform will not
            silently change your labels.
          </p>
        </div>
    </div>
  )

  if (bare) return body

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Printer className="h-4 w-4 text-muted-foreground" />
          Label Printing
        </CardTitle>
        <CardDescription>
          Choose how specimen labels are printed for this laboratory. Settings below drive
          the PDF generated for every request batch.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {body}
      </CardContent>
    </Card>
  )
}


// ---------------------------------------------------------------------------
// Mode-specific field groups
// ---------------------------------------------------------------------------

function A4Fields({
  form, update,
}: {
  form: LabSettings
  update: Props['update']
}) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">A4 sheet layout (mm)</h4>

      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          id="label_page_width_mm" label="Page width" value={form.label_page_width_mm}
          onChange={(v) => update('label_page_width_mm', v)}
        />
        <NumberField
          id="label_page_height_mm" label="Page height" value={form.label_page_height_mm}
          onChange={(v) => update('label_page_height_mm', v)}
        />
        <NumberField
          id="label_label_width_mm" label="Label width" value={form.label_label_width_mm}
          onChange={(v) => update('label_label_width_mm', v)}
        />
        <NumberField
          id="label_label_height_mm" label="Label height" value={form.label_label_height_mm}
          onChange={(v) => update('label_label_height_mm', v)}
        />
        <NumberField
          id="label_margin_top_mm" label="Top margin" value={form.label_margin_top_mm}
          onChange={(v) => update('label_margin_top_mm', v)}
        />
        <NumberField
          id="label_margin_left_mm" label="Left margin" value={form.label_margin_left_mm}
          onChange={(v) => update('label_margin_left_mm', v)}
        />
        <NumberField
          id="label_horizontal_gap_mm" label="Horizontal gap" value={form.label_horizontal_gap_mm}
          onChange={(v) => update('label_horizontal_gap_mm', v)}
          hint="Space between labels in the same row."
        />
        <NumberField
          id="label_vertical_gap_mm" label="Vertical gap" value={form.label_vertical_gap_mm}
          onChange={(v) => update('label_vertical_gap_mm', v)}
          hint="Space between rows of labels."
        />
      </div>
    </div>
  )
}


function ThermalFields({
  form, update,
}: {
  form: LabSettings
  update: Props['update']
}) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">Thermal roll layout (mm)</h4>

      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          id="label_label_width_mm" label="Label width" value={form.label_label_width_mm}
          onChange={(v) => update('label_label_width_mm', v)}
        />
        <NumberField
          id="label_label_height_mm" label="Label height" value={form.label_label_height_mm}
          onChange={(v) => update('label_label_height_mm', v)}
        />
        <NumberField
          id="label_thermal_gap_mm" label="Gap between labels" value={form.label_thermal_gap_mm}
          onChange={(v) => update('label_thermal_gap_mm', v)}
          hint="Blank space the printer advances between consecutive labels."
        />
      </div>
    </div>
  )
}


// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function NumberField({
  id, label, value, onChange, hint,
}: {
  id: string
  label: string
  value: number
  onChange: (value: number) => void
  hint?: string
}) {
  return (
    <FormField label={label} htmlFor={id} hint={hint}>
      <Input
        id={id}
        type="number"
        min={0}
        step={1}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10)
          onChange(Number.isFinite(n) ? n : 0)
        }}
      />
    </FormField>
  )
}


function ToggleRow({
  id, label, hint, checked, onChange,
}: {
  id: string
  label: string
  hint?: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2">
      <div className="min-w-0 flex-1">
        <Label htmlFor={id} className="text-sm">{label}</Label>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
