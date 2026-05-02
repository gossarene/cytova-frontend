import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Check, Copy, Loader2, Mail, RefreshCw, Send, Share2, ShieldOff,
  Sparkles, Link2, MessageCircle,
} from 'lucide-react'
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useLabSettings } from '@/modules/lab_settings/api'
import {
  useAccessTokenState, useCreateAccessToken, useRegenerateAccessToken,
  useNotifyPatientByEmail, useNotifyCytova,
  useCytovaShareStatus, useRevokeCytovaShare,
} from '../api'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  requestId: string
  /**
   * Drives the resend / re-share confirmations. The backend rejects
   * un-flagged resends with 409 ALREADY_ISSUED once the request has
   * reached this state; the drawer mirrors that rule client-side so
   * the operator doesn't see a raw error.
   */
  requestStatus: string
  /**
   * Mirrors ``request.has_report``. Every action in this drawer is
   * gated on the existence of a report PDF — without one there's
   * nothing to deliver. Kept as a prop rather than re-fetched so the
   * drawer doesn't race the page detail query.
   */
  hasReport: boolean
  /**
   * Whether the patient has an email on file. Email-channel button
   * is disabled with a hint when not. The backend would reject the
   * call with PATIENT_EMAIL_MISSING anyway; pre-disabling avoids a
   * wasted round-trip.
   */
  patientHasEmail: boolean
  /**
   * Drives the "Send another email?" confirmation modal. ``> 0``
   * means at least one notification has already been sent and a
   * resend is intentional.
   */
  notificationCount: number
  /**
   * Phase F: link-state for the Cytova section. ``true`` enables the
   * "Send to Cytova" CTA without re-asking for identity; ``false``
   * surfaces a disabled state with a "Link this patient first" hint
   * pointing at the patient detail page. Defaults to ``false`` so a
   * caller that hasn't been migrated to the new shape stays safe.
   */
  patientHasCytovaIdentity?: boolean
  /**
   * Phase F: route to the patient detail page so the disabled-state
   * hint can offer a one-click jump to the link flow. Optional; the
   * hint falls back to plain text when omitted.
   */
  patientDetailHref?: string
}

/**
 * Right-side drawer that consolidates every patient-delivery action
 * the lab UI exposes for a single request. Replaces the previous
 * cluster of header buttons (secure link / WhatsApp / email / Cytova
 * share) so the request-detail page stays uncluttered.
 *
 * What lives here vs. on the page
 * -------------------------------
 * - Drawer:   secure-link generate/copy/regenerate, WhatsApp share,
 *             notify-by-email + force_resend confirmation, Notify
 *             Cytova + force_share, revoke Cytova share. Each section
 *             owns its loading / error toasts.
 * - Page:     status-only badges (Issued, Delivered, Archived),
 *             non-delivery lifecycle buttons (Confirm, Cancel,
 *             Finalize, Reopen, Mark-as-delivered, Archive), Reopen
 *             confirmation modal. These are NOT delivery channels —
 *             they are workflow / closure actions.
 *
 * Backend contract preserved verbatim
 * -----------------------------------
 * No request body changed, no permission gate moved, no new endpoint
 * added. Every mutation hook used here was already used by the page;
 * the only change is that they fire from inside this component now.
 */
export function PatientDeliveryDrawer({
  open, onOpenChange, requestId, requestStatus,
  hasReport, patientHasEmail, notificationCount,
  patientHasCytovaIdentity = false, patientDetailHref,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        <SheetHeader className="space-y-1.5 border-b border-slate-200/70 bg-white px-6 py-5">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-4.5 w-4.5 text-primary" />
            Patient delivery
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            Send the result to the patient through any of the channels
            below. Each action keeps its own audit trail.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto bg-slate-50/40 px-6 py-5">
          {!hasReport ? (
            <NoReportEmptyState />
          ) : (
            <div className="space-y-4">
              <SecureAccessSection requestId={requestId} requestStatus={requestStatus} />
              <EmailSection
                requestId={requestId}
                requestStatus={requestStatus}
                patientHasEmail={patientHasEmail}
                notificationCount={notificationCount}
              />
              <CytovaSection
                requestId={requestId}
                patientHasCytovaIdentity={patientHasCytovaIdentity}
                patientDetailHref={patientDetailHref}
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}


// ---------------------------------------------------------------------------
// Empty state — no report yet, nothing to deliver
// ---------------------------------------------------------------------------

function NoReportEmptyState() {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-5 text-center">
      <p className="text-sm font-medium text-foreground">
        No report yet
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Generate the result report on the request detail page first.
        Delivery channels become available once a PDF exists.
      </p>
    </div>
  )
}


// ---------------------------------------------------------------------------
// Section A — Secure access (generate / copy / regenerate / whatsapp)
// ---------------------------------------------------------------------------

function SecureAccessSection({
  requestId, requestStatus,
}: { requestId: string; requestStatus: string }) {
  const { data: tokenState } = useAccessTokenState(requestId)
  const createMut = useCreateAccessToken(requestId)
  const regenMut = useRegenerateAccessToken(requestId)
  const { data: labSettings } = useLabSettings()
  const whatsappEnabled = labSettings?.notification_enable_whatsapp_share ?? false
  const [linkCopied, setLinkCopied] = useState(false)
  const [showRegenConfirm, setShowRegenConfirm] = useState(false)

  const isActive =
    !!tokenState && tokenState.status === 'active' && !!tokenState.access_url

  async function handleGenerate() {
    try {
      await createMut.mutateAsync()
      toast.success('Secure link generated.')
    } catch {
      toast.error('Failed to generate link.')
    }
  }

  async function doRegen(force_resend = false) {
    setShowRegenConfirm(false)
    try {
      await regenMut.mutateAsync({ force_resend })
      toast.success('Secure link regenerated.')
    } catch (err: unknown) {
      const apiErr = err as {
        response?: { data?: { errors?: { code?: string; message?: string }[] } }
      }
      const first = apiErr.response?.data?.errors?.[0]
      if (first?.code === 'ALREADY_ISSUED') {
        // Backend gate — operator must confirm the re-issue.
        setShowRegenConfirm(true)
      } else {
        toast.error(first?.message || 'Failed to regenerate link.')
      }
    }
  }

  function handleCopy(url: string) {
    navigator.clipboard.writeText(url)
    setLinkCopied(true)
    toast.success('Link copied to clipboard.')
    window.setTimeout(() => setLinkCopied(false), 2000)
  }

  return (
    <SectionCard
      icon={<Link2 className="h-4 w-4 text-muted-foreground" />}
      title="Secure access"
      hint="Single-use link the patient can open to download the report PDF."
    >
      {!isActive ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            No active link.
          </p>
          <Button
            size="sm" variant="outline" className="gap-2"
            onClick={handleGenerate}
            disabled={createMut.isPending}
          >
            {createMut.isPending
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Send className="h-3.5 w-3.5" />}
            Generate link
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {tokenState!.expires_at && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Expires</span>
              <span className="font-medium">
                {new Date(tokenState!.expires_at!).toLocaleString()}
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              size="sm" variant="outline" className="gap-2"
              onClick={() => handleCopy(tokenState!.access_url!)}
            >
              {linkCopied
                ? <Check className="h-3.5 w-3.5" />
                : <Copy className="h-3.5 w-3.5" />}
              {linkCopied ? 'Copied' : 'Copy link'}
            </Button>
            {whatsappEnabled && (
              <Button
                size="sm" variant="outline" className="gap-2"
                onClick={() => {
                  const msg = encodeURIComponent(
                    `Your lab result is ready.\n\nAccess it securely here:\n${tokenState!.access_url}`,
                  )
                  window.open(`https://wa.me/?text=${msg}`, '_blank')
                }}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp
              </Button>
            )}
            <Button
              size="sm" variant="outline" className="gap-2"
              onClick={() => {
                // Pre-issuance: regenerate fires immediately. Post-issuance:
                // backend rejects the un-flagged call with 409 — we surface
                // the confirmation modal in the catch branch.
                if (requestStatus === 'RESULT_ISSUED') {
                  setShowRegenConfirm(true)
                } else {
                  void doRegen(false)
                }
              }}
              disabled={regenMut.isPending}
            >
              {regenMut.isPending
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <RefreshCw className="h-3.5 w-3.5" />}
              Regenerate
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showRegenConfirm}
        onOpenChange={setShowRegenConfirm}
        title="Regenerate the secure link?"
        description="The current link will be invalidated and a fresh one will be issued. The patient will need the new link to access the result."
        confirmLabel="Regenerate"
        onConfirm={() => void doRegen(true)}
        isLoading={regenMut.isPending}
      />
    </SectionCard>
  )
}


// ---------------------------------------------------------------------------
// Section B — Email notification
// ---------------------------------------------------------------------------

function EmailSection({
  requestId, requestStatus, patientHasEmail, notificationCount,
}: {
  requestId: string
  requestStatus: string
  patientHasEmail: boolean
  notificationCount: number
}) {
  const notifyMut = useNotifyPatientByEmail(requestId)
  const { data: labSettings } = useLabSettings()
  const emailEnabled = labSettings?.notification_enable_email ?? false
  const [showResendConfirm, setShowResendConfirm] = useState(false)

  const isIssued = requestStatus === 'RESULT_ISSUED'

  async function doSend(opts: { force_resend?: boolean } = {}) {
    setShowResendConfirm(false)
    try {
      const res = await notifyMut.mutateAsync(opts)
      if (res.channels_succeeded.includes('EMAIL')) {
        toast.success('Email notification sent.')
      } else {
        const failed = res.channels_failed.find((c) => c.channel === 'EMAIL')
        toast.error(
          failed?.error
            ? `Email could not be delivered (${failed.error}).`
            : 'Email could not be delivered.',
        )
      }
    } catch (err: unknown) {
      const apiErr = err as {
        response?: { data?: { errors?: { code?: string; message?: string }[] } }
      }
      const first = apiErr.response?.data?.errors?.[0]
      if (first?.code === 'ALREADY_ISSUED') {
        // Defensive fallback for the case where the pre-flight gate
        // missed (typically a stale ``requestStatus`` prop — e.g. the
        // request was just flipped to RESULT_ISSUED via another
        // channel in this same drawer session, and the page detail
        // query hasn't re-fetched yet). Surface the friendly toast
        // and re-open the confirmation modal so the operator can
        // intentionally send again — the same modal also handles
        // the planned resend path, so the UX converges. We never
        // silently retry; force_resend always requires an explicit
        // confirmation click.
        toast.error(
          'This result has already been issued. Please confirm before sending it again.',
        )
        setShowResendConfirm(true)
      } else if (first?.code === 'PATIENT_EMAIL_MISSING') {
        toast.error('Patient email is required to send an email notification.')
      } else if (first?.code === 'EMAIL_CHANNEL_DISABLED') {
        toast.error('Email notifications are disabled in lab settings.')
      } else {
        toast.error(first?.message || 'Failed to send email notification.')
      }
    }
  }

  if (!emailEnabled) {
    return (
      <SectionCard
        icon={<Mail className="h-4 w-4 text-muted-foreground" />}
        title="Email notification"
        hint="Disabled in lab settings."
      >
        <p className="text-xs text-muted-foreground">
          Enable email notifications in Lab Settings to use this channel.
        </p>
      </SectionCard>
    )
  }

  return (
    <SectionCard
      icon={<Mail className="h-4 w-4 text-muted-foreground" />}
      title="Email notification"
      hint="Sends the patient a short email with a link to the secure download. The link is created automatically if needed."
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">
          {notificationCount > 0 ? (
            <>Sent {notificationCount} time{notificationCount > 1 ? 's' : ''} so far.</>
          ) : (
            <>No emails sent yet.</>
          )}
        </div>
        <Button
          size="sm" variant="outline" className="gap-2"
          disabled={!patientHasEmail || notifyMut.isPending}
          title={!patientHasEmail ? 'Patient has no email on file.' : undefined}
          onClick={() => {
            // Resend confirmation kicks in either when a previous
            // notification has gone out OR when the result has been
            // formally issued (the backend rejects un-flagged
            // resends with 409 ALREADY_ISSUED).
            if (notificationCount > 0 || isIssued) {
              setShowResendConfirm(true)
            } else {
              void doSend()
            }
          }}
        >
          {notifyMut.isPending
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Mail className="h-3.5 w-3.5" />}
          {notificationCount > 0 ? 'Send again' : 'Notify by email'}
        </Button>
      </div>

      <ConfirmDialog
        open={showResendConfirm}
        onOpenChange={setShowResendConfirm}
        title={
          isIssued
            ? 'Send this result again?'
            : 'Send another email notification?'
        }
        description={
          isIssued
            ? 'This result has already been issued. Do you want to send it again?'
            : 'This patient has already been notified by email. Send another notification?'
        }
        confirmLabel="Send again"
        onConfirm={() => void doSend({ force_resend: true })}
        isLoading={notifyMut.isPending}
      />
    </SectionCard>
  )
}


// ---------------------------------------------------------------------------
// Section C — Cytova patient space
// ---------------------------------------------------------------------------

function CytovaSection({
  requestId, patientHasCytovaIdentity, patientDetailHref,
}: {
  requestId: string
  patientHasCytovaIdentity: boolean
  patientDetailHref?: string
}) {
  const { data: labSettings } = useLabSettings()
  const cytovaEnabled = labSettings?.notification_enable_cytova ?? true
  const cytovaShareQuery = useCytovaShareStatus(requestId, true)
  const cytovaShareStatus = cytovaShareQuery.data?.status ?? null
  const notifyMut = useNotifyCytova(requestId)
  const revokeMut = useRevokeCytovaShare(requestId)
  const [showSendConfirm, setShowSendConfirm] = useState(false)
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false)

  // Lab kill switch — Phase D added ``notification_enable_cytova``
  // and the backend refuses with CYTOVA_CHANNEL_DISABLED when off.
  // Hide the entire section so the operator never sees a CTA they
  // can't use; the backend still enforces.
  if (!cytovaEnabled) return null

  const isActive = cytovaShareStatus === 'ACTIVE'

  async function doSend() {
    setShowSendConfirm(false)
    try {
      // Empty body — Phase D's linked-path call. The backend reuses
      // the verified Cytova link snapshot on the patient and
      // re-checks the global account is still active.
      await notifyMut.mutateAsync({})
      toast.success('Result shared with the patient on Cytova.')
    } catch (err: unknown) {
      const apiErr = err as {
        response?: { data?: { errors?: { code?: string; message?: string }[] } }
      }
      const first = apiErr.response?.data?.errors?.[0]
      if (first?.code === 'IDENTITY_VERIFICATION_FAILED') {
        // Either a fresh interactive mismatch (impossible here — no
        // identity payload) or a linked-but-deactivated global
        // account. Same generic message either way; the audit row
        // carries the distinguishing marker.
        toast.error(
          'Could not verify the patient on Cytova. The Cytova account '
          + 'may have been deactivated — re-link the patient.',
        )
      } else if (first?.code === 'MISSING_IDENTITY') {
        // Defensive — the section hides the CTA when the patient is
        // unlinked, so this only fires on a stale page where a
        // concurrent unlink happened. Surface a clear nudge.
        toast.error(
          'This patient is not linked to a Cytova account. '
          + 'Link them first from the patient detail page.',
        )
      } else if (first?.code === 'CYTOVA_ALREADY_SHARED') {
        toast.error(
          'This result has already been shared with the patient on Cytova.',
        )
      } else {
        toast.error(first?.message || 'Could not share the result on Cytova.')
      }
    }
  }

  return (
    <SectionCard
      icon={<Share2 className="h-4 w-4 text-muted-foreground" />}
      title="Cytova patient space"
      hint="Push the result into the patient's Cytova account so they can read it from any device."
    >
      <div className="space-y-3">
        {isActive && (
          <Badge
            variant="outline"
            className="gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700"
          >
            <Check className="h-3 w-3" />
            Shared with Cytova patient
          </Badge>
        )}
        {cytovaShareStatus === 'REVOKED' && (
          <Badge
            variant="outline"
            className="gap-1.5 border-rose-200 bg-rose-50 text-rose-700"
          >
            <ShieldOff className="h-3 w-3" />
            Sharing revoked
          </Badge>
        )}

        {/* Three states converge here:
            1. Active share → Revoke CTA.
            2. Linked + no active share → Send CTA (linked-path,
               no identity re-prompt).
            3. Unlinked → disabled state + link to patient detail
               page where the operator can run the link flow. */}
        {isActive ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              size="sm" variant="outline" className="gap-2"
              onClick={() => setShowRevokeConfirm(true)}
            >
              <ShieldOff className="h-3.5 w-3.5" />
              Revoke share
            </Button>
          </div>
        ) : patientHasCytovaIdentity ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              size="sm" variant="outline" className="gap-2"
              onClick={() => setShowSendConfirm(true)}
              disabled={notifyMut.isPending}
            >
              {notifyMut.isPending
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Share2 className="h-3.5 w-3.5" />}
              Send to Cytova
            </Button>
          </div>
        ) : (
          <div className="rounded-md border border-slate-200 bg-slate-50/60 p-3 text-xs text-muted-foreground">
            <p>
              This patient isn't linked to a Cytova account yet.
              {patientDetailHref ? (
                <>
                  {' '}
                  <Link
                    to={patientDetailHref}
                    className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
                  >
                    Link the patient first
                  </Link>
                  {' '}to enable Cytova sharing.
                </>
              ) : (
                <> Link them from the patient detail page first.</>
              )}
            </p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showSendConfirm}
        onOpenChange={setShowSendConfirm}
        title="Send this result to the patient's Cytova account?"
        description={
          'The patient will receive a notification and can download the '
          + 'report from their Cytova space at any time.'
        }
        confirmLabel="Send to Cytova"
        onConfirm={doSend}
        isLoading={notifyMut.isPending}
      />

      <ConfirmDialog
        open={showRevokeConfirm}
        onOpenChange={setShowRevokeConfirm}
        title="Revoke Cytova sharing?"
        description="The patient will no longer be able to access this result from their Cytova space. The laboratory record will remain unchanged."
        confirmLabel="Revoke share"
        variant="destructive"
        onConfirm={async () => {
          try {
            await revokeMut.mutateAsync()
            toast.success('Cytova sharing revoked.')
            setShowRevokeConfirm(false)
          } catch {
            toast.error('Could not revoke the share. Please try again.')
          }
        }}
        isLoading={revokeMut.isPending}
      />
    </SectionCard>
  )
}


// ---------------------------------------------------------------------------
// Section card primitive (visual shell)
// ---------------------------------------------------------------------------

function SectionCard({
  icon, title, hint, children,
}: {
  icon: React.ReactNode
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-lg border border-slate-200/80 bg-white p-4 shadow-sm">
      <header className="flex items-start gap-2">
        <span className="mt-0.5">{icon}</span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          {hint && (
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {hint}
            </p>
          )}
        </div>
      </header>
      <Separator className="my-3" />
      {children}
    </section>
  )
}
