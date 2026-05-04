import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  Loader2, Building2, FileText, Upload, Trash2, ImageIcon, Receipt,
  Eye, EyeOff, ChevronDown, AlertTriangle, Bell, ShieldCheck, Printer,
} from 'lucide-react'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useUnsavedChangesGuard } from '@/lib/forms/useUnsavedChangesGuard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { PageHeader } from '@/components/shared/PageHeader'
import { FormField } from '@/components/shared/FormField'
import { CardSkeleton } from '@/components/shared/LoadingSkeleton'
import { ErrorState } from '@/components/shared/ErrorState'
import { Can } from '@/lib/permissions/Can'
import { P } from '@/lib/permissions/constants'
import {
  useLabSettings, useUpdateLabSettings,
  useUploadLabLogo, useDeleteLabLogo, useLabLogoPreview,
} from '../api'
import { LabelGenerationSection } from '../components/LabelGenerationSection'
import { LabelPrintingSettings } from '../components/LabelPrintingSettings'
import { PatientEmailTemplateSection } from '../components/PatientEmailTemplateSection'
import type { LabSettings } from '../types'
import { ROUTES } from '@/config/routes'

const PDF_PASSWORD_MODE_OPTIONS: { value: string; label: string }[] = [
  { value: 'PATIENT_DOB', label: 'Patient date of birth' },
  { value: 'PATIENT_PHONE', label: 'Patient phone number' },
  { value: 'REQUEST_REFERENCE', label: 'Request reference' },
  { value: 'DOB_PLUS_PHONE_SUFFIX', label: 'DOB + last 4 digits of phone' },
  { value: 'DOB_PHONE_SECRET', label: 'DOB + phone suffix + lab secret code' },
]

const NOTIFICATION_OPTIONS: { key: keyof LabSettings; label: string; hint?: string; disabled?: boolean }[] = [
  { key: 'notification_enable_secure_link', label: 'Secure access link', hint: 'Allow generating secure links for patient results.' },
  { key: 'notification_enable_whatsapp_share', label: 'WhatsApp manual share', hint: 'Show a Share via WhatsApp button for secure links.' },
  { key: 'notification_enable_email', label: 'Email notification', hint: 'Send patients an email when their result is ready.' },
  { key: 'notification_enable_sms', label: 'SMS notification', hint: 'Coming soon — automatic SMS to patients.', disabled: true },
]

const DOC_MODE_OPTIONS: { value: string; label: string }[] = [
  { value: 'INVOICE_ONLY', label: 'Invoice only' },
  { value: 'STATEMENT_ONLY', label: 'Financial statement only' },
  { value: 'BOTH', label: 'Both' },
]

const DISPLAY_OPTIONS: { key: keyof LabSettings; label: string; hint?: string }[] = [
  { key: 'show_logo', label: 'Laboratory logo' },
  { key: 'show_lab_address', label: 'Laboratory address & contact' },
  { key: 'show_prescriber', label: 'External prescriber reference' },
  { key: 'show_collection_datetime', label: 'Collection date & time' },
  { key: 'show_patient_age', label: 'Patient age / date of birth' },
  { key: 'show_patient_sex', label: 'Patient sex' },
  { key: 'show_exam_technique', label: 'Exam technique', hint: 'Shown in small italic under each exam.' },
  { key: 'show_reference_ranges', label: 'Reference ranges' },
  { key: 'show_patient_comments', label: 'Patient-facing comments' },
  { key: 'show_final_conclusion', label: 'Final conclusion block' },
  { key: 'show_signature', label: 'Validator signature area' },
  { key: 'show_legal_footer', label: 'Legal / confidentiality footer' },
  { key: 'show_abnormal_flags', label: 'Abnormal result flags' },
]

export function LabSettingsPage() {
  const { data, isLoading, error, refetch } = useLabSettings()
  if (error) return <ErrorState onRetry={refetch} />
  if (isLoading || !data) return <div className="space-y-6"><CardSkeleton /><CardSkeleton /></div>
  return <LabSettingsForm key={data.updated_at} initial={data} />
}

function LabSettingsForm({ initial }: { initial: LabSettings }) {
  const updateMut = useUpdateLabSettings()
  // The "saved" snapshot is the source of truth for dirty detection. When a
  // save succeeds we promote the current form to the saved snapshot; Discard
  // resets the form back to it. Using state (not a ref) means React re-renders
  // and the dirty diff is recomputed every keystroke.
  const [saved, setSaved] = useState<LabSettings>(initial)
  const [form, setForm] = useState<LabSettings>(initial)

  // Structural diff via JSON.stringify — fields are flat primitives or short
  // strings/numbers, so this is cheap. Avoids tracking dirty as a flag that
  // can drift out of sync with field-level edits.
  const dirty = JSON.stringify(form) !== JSON.stringify(saved)

  function update<K extends keyof LabSettings>(key: K, value: LabSettings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function updateMany(partial: Partial<LabSettings>) {
    setForm((prev) => ({ ...prev, ...partial }))
  }

  // Returns ``true`` on success so the navigation modal can decide whether
  // to proceed with the pending route change. The PageHeader / banner Save
  // buttons ignore the boolean — they just trigger the side effects (toast,
  // dirty reset) and stay on the page.
  async function handleSave(): Promise<boolean> {
    if (!form) return false
    try {
      const { updated_at: _omit, ...payload } = form
      void _omit
      const fresh = await updateMut.mutateAsync(payload)
      toast.success('Lab settings updated.')
      // Promote both snapshots to the server's response so updated_at stays
      // current and the next dirty diff starts from a clean baseline.
      setSaved(fresh)
      setForm(fresh)
      return true
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { errors?: { message?: string }[] } } })
        ?.response?.data?.errors?.[0]?.message
      toast.error(msg || 'Failed to update settings.')
      return false
    }
  }

  function handleReset() {
    setForm(saved)
  }

  // Unsaved-changes guard: shared across the app. Browser-level
  // beforeunload + SPA-level useBlocker + Cytova-styled modal all live
  // inside the hook; we just provide isDirty + the two actions.
  const { GuardModal } = useUnsavedChangesGuard({
    isDirty: dirty,
    onSave: handleSave,
    onDiscard: handleReset,
    message: 'You have unsaved changes in Lab Settings. What would you like to do?',
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laboratory Settings"
        breadcrumbs={[{ label: 'Settings', href: ROUTES.SETTINGS }, { label: 'Laboratory' }]}
      >
        <Can permission={P.SETTINGS_MANAGE}>
          <Button variant="outline" onClick={handleReset} disabled={!dirty || updateMut.isPending}>
            Reset
          </Button>
          <Button onClick={handleSave} disabled={!dirty || updateMut.isPending}>
            {updateMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </Can>
      </PageHeader>

      {dirty && (
        <DirtyBanner
          saving={updateMut.isPending}
          onSave={handleSave}
          onDiscard={handleReset}
        />
      )}

      {/* Laboratory Identity — open by default (most-edited section) */}
      <CollapsibleCard
        defaultOpen
        icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
        title="Laboratory Identity"
        description="Displayed on report headers. These values are used on every generated report."
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Laboratory name" htmlFor="lab_name">
              <Input
                id="lab_name" value={form.lab_name}
                onChange={(e) => update('lab_name', e.target.value)}
                placeholder="e.g. Acme Medical Labs"
              />
            </FormField>
            <FormField label="Subtitle" htmlFor="lab_subtitle" hint="e.g. Medical Analysis Laboratory">
              <Input
                id="lab_subtitle" value={form.lab_subtitle}
                onChange={(e) => update('lab_subtitle', e.target.value)}
              />
            </FormField>
          </div>

          <FormField label="Address" htmlFor="address" hint="Multi-line — one line per row on the report.">
            <Textarea
              id="address" rows={2} value={form.address}
              onChange={(e) => update('address', e.target.value)}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Phone" htmlFor="phone">
              <Input id="phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
            </FormField>
            <FormField label="Email" htmlFor="email">
              <Input id="email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
            </FormField>
            <FormField label="Website" htmlFor="website">
              <Input id="website" value={form.website} onChange={(e) => update('website', e.target.value)} />
            </FormField>
          </div>

          <Separator />

          <LogoUploader
            hasFile={form.has_logo_file}
            logoUrl={form.logo_url}
            onLogoUrlChange={(v) => update('logo_url', v)}
          />

          <FormField
            label="Legal / confidentiality footer" htmlFor="legal_footer"
            hint="Printed at the bottom of every report when enabled."
          >
            <Textarea
              id="legal_footer" rows={2} value={form.legal_footer}
              onChange={(e) => update('legal_footer', e.target.value)}
            />
          </FormField>
        </div>
      </CollapsibleCard>

      <CollapsibleCard
        icon={<FileText className="h-4 w-4 text-muted-foreground" />}
        title="Report Display Options"
        description="Toggle what appears on generated patient reports. Changes apply to newly generated reports."
      >
          <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {DISPLAY_OPTIONS.map(({ key, label, hint }) => (
              <div
                key={key}
                className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <Label htmlFor={`opt-${key}`} className="text-sm">{label}</Label>
                  {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
                </div>
                <Switch
                  id={`opt-${key}`}
                  checked={form[key] as boolean}
                  onCheckedChange={(v) => update(key, v as never)}
                />
              </div>
            ))}
          </div>
      </CollapsibleCard>

      <CollapsibleCard
        icon={<Receipt className="h-4 w-4 text-muted-foreground" />}
        title="Billing"
        description="Tax rate and financial document settings for partner invoicing."
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Financial document type" htmlFor="doc_mode"
              hint="Controls which document types can be generated for partner invoices."
            >
              <Select
                value={form.financial_document_mode}
                onValueChange={(v) => { if (v) update('financial_document_mode', v as never) }}
                items={DOC_MODE_OPTIONS}
              >
                <SelectTrigger id="doc_mode"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOC_MODE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField
              label="Default invoice VAT rate (%)" htmlFor="vat_rate"
              hint="Applied on the subtotal after partner discount. Leave empty for no VAT."
            >
              <Input
                id="vat_rate" type="number" min="0" max="100" step="0.01"
                placeholder="0.00"
                value={form.default_invoice_vat_rate ?? ''}
                onChange={(e) => {
                  const v = e.target.value
                  update('default_invoice_vat_rate', v === '' ? null : parseFloat(v))
                }}
              />
            </FormField>
          </div>
        </div>
      </CollapsibleCard>

      <CollapsibleCard
        icon={<ShieldCheck className="h-4 w-4 text-muted-foreground" />}
        title="Result PDF Protection"
        description="Password-protect generated result PDFs using patient data."
      >
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2">
            <div className="min-w-0 flex-1">
              <Label htmlFor="pdf-pw-enabled" className="text-sm">Enable PDF password protection</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                When enabled, every generated result PDF requires a password to open.
              </p>
            </div>
            <Switch
              id="pdf-pw-enabled"
              checked={form.result_pdf_password_enabled}
              onCheckedChange={(v) => update('result_pdf_password_enabled', v as never)}
            />
          </div>
          {form.result_pdf_password_enabled && (
            <PdfProtectionFields form={form} update={update} />
          )}
        </div>
      </CollapsibleCard>

      <CollapsibleCard
        icon={<Bell className="h-4 w-4 text-muted-foreground" />}
        title="Patient Notifications"
        description="Control how patients can access their results. SMS will be available in a future update."
      >
          <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {NOTIFICATION_OPTIONS.map(({ key, label, hint, disabled }) => (
              <div key={key} className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2">
                <div className="min-w-0 flex-1">
                  <Label htmlFor={`notif-${key}`} className="text-sm">{label}</Label>
                  {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
                </div>
                <Switch
                  id={`notif-${key}`}
                  checked={form[key] as boolean}
                  onCheckedChange={(v) => update(key, v as never)}
                  disabled={disabled}
                />
              </div>
            ))}
          </div>
      </CollapsibleCard>

      <CollapsibleCard
        icon={<Bell className="h-4 w-4 text-muted-foreground" />}
        title="Patient email template"
        description="Customise the subject and body of the email patients receive when their result is ready. Empty fields fall back to the safe default copy."
      >
        <PatientEmailTemplateSection
          subjectTemplate={form.patient_result_email_subject_template}
          bodyTemplate={form.patient_result_email_body_template}
          labName={form.lab_name}
          onSubjectChange={(v) => update('patient_result_email_subject_template', v)}
          onBodyChange={(v) => update('patient_result_email_body_template', v)}
        />
      </CollapsibleCard>

      <CollapsibleCard
        icon={<Printer className="h-4 w-4 text-muted-foreground" />}
        title="Label Printing"
        description="Choose how specimen labels are numbered, how many are produced per request, and how they are laid out on paper. Settings below drive the PDF generated for every request batch."
      >
        {/* Label generation behaviour (numbering + extras + reset
            cadence). Sits above the print-layout block so the
            operator configures "what gets printed" before "how it
            looks on paper". */}
        <LabelGenerationSection
          numberingMode={form.label_numbering_mode}
          extraLabelCount={form.extra_label_count}
          resetPeriod={form.label_sequence_reset_period}
          onNumberingModeChange={(v) => update('label_numbering_mode', v)}
          onExtraLabelCountChange={(v) => update('extra_label_count', v)}
          onResetPeriodChange={(v) => update('label_sequence_reset_period', v)}
        />
        <Separator className="my-5" />
        <LabelPrintingSettings
          bare
          form={form}
          update={(key, value) => update(key as keyof LabSettings, value as never)}
          updateMany={updateMany}
        />
      </CollapsibleCard>

      <GuardModal />
    </div>
  )
}

// ---------------------------------------------------------------------------
// PDF Protection fields — extracted to keep the main form readable
// ---------------------------------------------------------------------------

function PdfProtectionFields({
  form, update,
}: {
  form: LabSettings
  update: <K extends keyof LabSettings>(key: K, value: LabSettings[K]) => void
}) {
  const [showSecret, setShowSecret] = useState(false)
  const needsSecret = form.result_pdf_password_mode === 'DOB_PHONE_SECRET'
  const secretMissing = needsSecret && !form.lab_secret_code

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Password mode" htmlFor="pdf-pw-mode"
          hint="Determines how the password is derived from patient data."
        >
          <Select
            value={form.result_pdf_password_mode}
            onValueChange={(v) => { if (v) update('result_pdf_password_mode', v as never) }}
            items={PDF_PASSWORD_MODE_OPTIONS}
          >
            <SelectTrigger id="pdf-pw-mode"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PDF_PASSWORD_MODE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField
          label="Password hint (optional)" htmlFor="pdf-pw-hint"
          hint="Displayed to users who need to open the PDF."
        >
          <Input
            id="pdf-pw-hint"
            value={form.result_pdf_password_hint}
            onChange={(e) => update('result_pdf_password_hint', e.target.value as never)}
            placeholder="e.g. Your date of birth + last 4 digits of phone"
          />
        </FormField>
      </div>

      {needsSecret && (
        <FormField
          label="Lab PDF secret code (2 characters)" htmlFor="pdf-secret"
          hint="This code is appended to PDF passwords. Changing it only affects newly generated PDFs."
          required
          error={
            secretMissing ? 'Secret code is required for this password mode.'
            : (form.lab_secret_code.length > 0 && form.lab_secret_code.length !== 2)
              ? 'Must be exactly 2 characters.' : undefined
          }
        >
          <div className="relative w-24">
            <Input
              id="pdf-secret"
              type={showSecret ? 'text' : 'password'}
              className="pr-10 font-mono tracking-widest uppercase text-center"
              maxLength={2}
              value={form.lab_secret_code}
              onChange={(e) => update('lab_secret_code', e.target.value.toUpperCase().slice(0, 2) as never)}
            />
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </FormField>
      )}
    </div>
  )
}


const ALLOWED_LOGO_MIMES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml'])
const MAX_LOGO_BYTES = 2 * 1024 * 1024

function LogoUploader({
  hasFile, logoUrl, onLogoUrlChange,
}: {
  hasFile: boolean
  logoUrl: string
  onLogoUrlChange: (v: string) => void
}) {
  const uploadMut = useUploadLabLogo()
  const deleteMut = useDeleteLabLogo()
  const preview = useLabLogoPreview(hasFile)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (preview.data) URL.revokeObjectURL(preview.data)
    }
  }, [preview.data])

  function pick() {
    inputRef.current?.click()
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!ALLOWED_LOGO_MIMES.has(file.type)) {
      toast.error('Unsupported image type. Use PNG, JPEG, GIF or SVG.')
      return
    }
    if (file.size > MAX_LOGO_BYTES) {
      toast.error('File too large. Maximum size is 2 MB.')
      return
    }
    try {
      await uploadMut.mutateAsync(file)
      toast.success('Logo uploaded.')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { errors?: { message?: string }[] } } })
        ?.response?.data?.errors?.[0]?.message
      toast.error(msg || 'Failed to upload logo.')
    }
  }

  async function onRemove() {
    try {
      await deleteMut.mutateAsync()
      toast.success('Logo removed.')
    } catch {
      toast.error('Failed to remove logo.')
    }
  }

  const busy = uploadMut.isPending || deleteMut.isPending

  return (
    <div className="space-y-3">
      <Label>Laboratory logo</Label>
      <div className="flex items-start gap-4">
        <div className="flex h-24 w-40 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/30">
          {hasFile && preview.data ? (
            <img src={preview.data} alt="Lab logo" className="max-h-full max-w-full object-contain" />
          ) : hasFile && preview.isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 space-y-2">
          <Can permission={P.SETTINGS_MANAGE}>
            <div className="flex flex-wrap gap-2">
              <input
                ref={inputRef} type="file" className="hidden"
                accept="image/png,image/jpeg,image/gif,image/svg+xml"
                onChange={onFile}
              />
              <Button type="button" variant="outline" size="sm" onClick={pick} disabled={busy}>
                {uploadMut.isPending
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <Upload className="mr-2 h-4 w-4" />}
                {hasFile ? 'Replace' : 'Upload'}
              </Button>
              {hasFile && (
                <Button
                  type="button" variant="outline" size="sm"
                  onClick={onRemove} disabled={busy}
                >
                  {deleteMut.isPending
                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    : <Trash2 className="mr-2 h-4 w-4" />}
                  Remove
                </Button>
              )}
            </div>
          </Can>
          <p className="text-xs text-muted-foreground">
            PNG, JPEG, GIF or SVG · up to 2&nbsp;MB. Uploaded logos are rendered on PDF reports.
          </p>
        </div>
      </div>

      <FormField
        label="Logo URL (optional)" htmlFor="logo_url"
        hint="External reference only — PDF reports always use the uploaded file above."
      >
        <Input
          id="logo_url" type="url" value={logoUrl}
          onChange={(e) => onLogoUrlChange(e.target.value)}
          placeholder="https://example.com/logo.png"
        />
      </FormField>
    </div>
  )
}


// ---------------------------------------------------------------------------
// CollapsibleCard
//
// Card whose CardHeader is a button toggling open/close. CRITICAL: the body
// is hidden via CSS (`hidden` class), not unmounted. Form state in the
// children — driven by useState in the parent form — survives collapse
// because the inputs stay in the React tree.
// ---------------------------------------------------------------------------

function CollapsibleCard({
  icon, title, description, defaultOpen = false, children,
}: {
  icon: React.ReactNode
  title: string
  description?: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full text-left"
      >
        <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <CardTitle className="flex items-center gap-2 text-base">
                {icon}
                {title}
              </CardTitle>
              {description && (
                <CardDescription className="mt-1.5">{description}</CardDescription>
              )}
            </div>
            <ChevronDown
              className={cn(
                'mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                open && 'rotate-180',
              )}
            />
          </div>
        </CardHeader>
      </button>
      {/* hidden, not unmounted, so children retain their internal state. */}
      <CardContent className={cn('space-y-4', !open && 'hidden')}>
        {children}
      </CardContent>
    </Card>
  )
}


// ---------------------------------------------------------------------------
// DirtyBanner
//
// Sticky soft-orange banner shown when the form has unsaved changes. The
// Save button calls the same handler as the PageHeader Save (single source
// of truth for the save flow). Discard resets to the last saved snapshot.
// `top-0` keeps it pinned while the user scrolls long sections.
// ---------------------------------------------------------------------------

function DirtyBanner({
  saving, onSave, onDiscard,
}: {
  saving: boolean
  onSave: () => void
  onDiscard: () => void
}) {
  return (
    <div
      role="status"
      className="sticky top-0 z-20 flex flex-col gap-3 rounded-lg border border-amber-300/60 bg-amber-50 px-4 py-3 text-amber-900 shadow-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-2.5">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span className="text-sm font-medium">You have unsaved changes</span>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onDiscard}
          disabled={saving}
          className="border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
        >
          Discard changes
        </Button>
        <Button
          size="sm"
          onClick={onSave}
          disabled={saving}
          className="bg-amber-600 text-white hover:bg-amber-700"
        >
          {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
          Save changes
        </Button>
      </div>
    </div>
  )
}


// Unsaved-changes dialog now lives in `lib/forms/useUnsavedChangesGuard`
// and is shared with patient forms, request forms, and any other dirty-state
// surface. The guard hook is wired in LabSettingsForm above.
