import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Upload, Trash2, ImageIcon } from 'lucide-react'
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { FormField } from '@/components/shared/FormField'
import { useUpdatePartnerBranding } from '../api'
import type { PartnerDetail } from '../types'

const MAX_LOGO_BYTES = 2 * 1024 * 1024
const ACCEPTED_LOGO_TYPES = ['image/png', 'image/jpeg']

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  partner: PartnerDetail
}

export function PartnerBrandingDrawer({ open, onOpenChange, partner }: Props) {
  const mutation = useUpdatePartnerBranding(partner.id)

  const [enabled, setEnabled] = useState(partner.custom_report_branding_enabled)
  const [headerName, setHeaderName] = useState(partner.report_header_name)
  const [subtitle, setSubtitle] = useState(partner.report_header_subtitle)
  const [address, setAddress] = useState(partner.report_header_address)
  const [phone, setPhone] = useState(partner.report_header_phone)
  const [email, setEmail] = useState(partner.report_header_email)
  const [footer, setFooter] = useState(partner.report_footer_text)

  // Logo state — three pieces:
  //   - existingLogoUrl: URL currently saved on the server (or '')
  //   - logoFile: a freshly picked File (not yet uploaded)
  //   - clearExisting: explicit "remove the saved logo" flag
  // The preview reads from logoFile when present, else from
  // existingLogoUrl (unless cleared).
  const [existingLogoUrl, setExistingLogoUrl] = useState(partner.report_header_logo)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [clearExisting, setClearExisting] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Re-sync from props when the drawer is reopened on a freshly-fetched
  // partner — without this, edits made in another tab wouldn't show.
  useEffect(() => {
    if (!open) return
    setEnabled(partner.custom_report_branding_enabled)
    setHeaderName(partner.report_header_name)
    setSubtitle(partner.report_header_subtitle)
    setAddress(partner.report_header_address)
    setPhone(partner.report_header_phone)
    setEmail(partner.report_header_email)
    setFooter(partner.report_footer_text)
    setExistingLogoUrl(partner.report_header_logo)
    setLogoFile(null)
    setClearExisting(false)
    setLogoError(null)
  }, [open, partner])

  // Browser-side preview URL — built from the picked File via
  // ``URL.createObjectURL`` and revoked on unmount/file-change so we
  // don't leak object URLs.
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!logoFile) {
      setFilePreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(logoFile)
    setFilePreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [logoFile])

  const previewSrc = filePreviewUrl
    || (clearExisting ? null : existingLogoUrl || null)

  function handleFilePick(file: File | null) {
    setLogoError(null)
    if (!file) {
      setLogoFile(null)
      return
    }
    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
      setLogoError('Logo must be a PNG or JPEG image.')
      return
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError(`Logo is too large (${Math.round(file.size / 1024)} KB). Max 2 MB.`)
      return
    }
    setLogoFile(file)
    setClearExisting(false)
  }

  function handleRemoveLogo() {
    setLogoFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (existingLogoUrl) setClearExisting(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (logoError) return
    try {
      const updated = await mutation.mutateAsync({
        custom_report_branding_enabled: enabled,
        report_header_name: headerName,
        report_header_subtitle: subtitle,
        report_header_address: address,
        report_header_phone: phone,
        report_header_email: email,
        report_footer_text: footer,
        logo_file: logoFile ?? undefined,
        clear_logo: clearExisting && !logoFile,
      })
      toast.success('Report branding saved.')
      // Refresh local state from the server response so the preview
      // immediately shows the persisted logo URL (and clears the picked
      // File so subsequent edits diff against truth, not the old File).
      setExistingLogoUrl(updated.report_header_logo)
      setLogoFile(null)
      setClearExisting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      onOpenChange(false)
    } catch {
      toast.error('Failed to save branding.')
    }
  }

  // Drawer is purely presentational when toggle is OFF — fields disabled
  // so it's still discoverable that they exist, but the user can't edit
  // values they haven't opted into.
  const fieldsDisabled = !enabled

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto" side="right">
        <SheetHeader>
          <SheetTitle>Report branding</SheetTitle>
          <SheetDescription>
            When enabled, result PDFs for this partner will use this header
            instead of the laboratory header.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 px-4 pb-2 gap-5">
          <div className="flex items-center justify-between gap-3 rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">Use custom report branding</p>
              <p className="text-xs text-muted-foreground">
                Falls back to the laboratory branding when off.
              </p>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={(v) => setEnabled(Boolean(v))}
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <FormField label="Header name" htmlFor="branding-name">
              <Input id="branding-name" value={headerName}
                onChange={(e) => setHeaderName(e.target.value)} disabled={fieldsDisabled}
                placeholder="Acme Laboratory" maxLength={255} />
            </FormField>
            <FormField label="Subtitle" htmlFor="branding-subtitle">
              <Input id="branding-subtitle" value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)} disabled={fieldsDisabled}
                placeholder="Specialised diagnostic services" maxLength={255} />
            </FormField>
            <FormField label="Address" htmlFor="branding-address">
              <Textarea id="branding-address" value={address}
                onChange={(e) => setAddress(e.target.value)} disabled={fieldsDisabled}
                rows={2} placeholder="Street, city" />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Phone" htmlFor="branding-phone">
                <Input id="branding-phone" type="tel" value={phone}
                  onChange={(e) => setPhone(e.target.value)} disabled={fieldsDisabled}
                  maxLength={50} />
              </FormField>
              <FormField label="Email" htmlFor="branding-email">
                <Input id="branding-email" type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)} disabled={fieldsDisabled} />
              </FormField>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">Logo</p>
              <p className="text-xs text-muted-foreground">
                PNG or JPEG, up to 2 MB. Rendered in the report header.
              </p>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-md border bg-muted/30 overflow-hidden">
                {previewSrc ? (
                  <img src={previewSrc} alt="Logo preview" className="max-h-full max-w-full object-contain" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" aria-hidden />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={(e) => handleFilePick(e.target.files?.[0] ?? null)}
                  disabled={fieldsDisabled}
                />
                <Button
                  type="button" size="sm" variant="outline" className="gap-2"
                  disabled={fieldsDisabled}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-3.5 w-3.5" />
                  {previewSrc ? 'Replace logo' : 'Upload logo'}
                </Button>
                {previewSrc && (
                  <Button
                    type="button" size="sm" variant="ghost" className="gap-2 text-destructive hover:text-destructive"
                    disabled={fieldsDisabled}
                    onClick={handleRemoveLogo}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </Button>
                )}
              </div>
            </div>
            {logoError && (
              <p className="text-xs text-destructive">{logoError}</p>
            )}
          </div>

          <Separator />

          <FormField label="Legal / confidentiality footer" htmlFor="branding-footer">
            <Textarea id="branding-footer" value={footer}
              onChange={(e) => setFooter(e.target.value)} disabled={fieldsDisabled}
              rows={3} placeholder="Confidential — for the patient's eyes only." />
          </FormField>
        </form>

        <SheetFooter>
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button" variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button" onClick={handleSubmit}
              disabled={mutation.isPending || !!logoError}
            >
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save branding
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
