import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Building2, FileText, Upload, Trash2, ImageIcon } from 'lucide-react'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
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
import type { LabSettings } from '../types'
import { ROUTES } from '@/config/routes'

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
  const [form, setForm] = useState<LabSettings>(initial)
  const [dirty, setDirty] = useState(false)

  function update<K extends keyof LabSettings>(key: K, value: LabSettings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setDirty(true)
  }

  async function handleSave() {
    if (!form) return
    try {
      const { updated_at: _omit, ...payload } = form
      void _omit
      await updateMut.mutateAsync(payload)
      toast.success('Lab settings updated.')
      setDirty(false)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { errors?: { message?: string }[] } } })
        ?.response?.data?.errors?.[0]?.message
      toast.error(msg || 'Failed to update settings.')
    }
  }

  function handleReset() {
    setForm(initial)
    setDirty(false)
  }

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

      {/* Laboratory Identity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            Laboratory Identity
          </CardTitle>
          <CardDescription>
            Displayed on report headers. These values are used on every generated report.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
            label="Signature file key" htmlFor="signature_file_key"
            hint="Internal storage key for the validator signature/stamp."
          >
            <Input
              id="signature_file_key" value={form.signature_file_key}
              onChange={(e) => update('signature_file_key', e.target.value)}
              className="font-mono text-xs"
            />
          </FormField>

          <FormField
            label="Legal / confidentiality footer" htmlFor="legal_footer"
            hint="Printed at the bottom of every report when enabled."
          >
            <Textarea
              id="legal_footer" rows={2} value={form.legal_footer}
              onChange={(e) => update('legal_footer', e.target.value)}
            />
          </FormField>
        </CardContent>
      </Card>

      {/* Report Display Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Report Display Options
          </CardTitle>
          <CardDescription>
            Toggle what appears on generated patient reports. Changes apply to newly generated reports.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
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
