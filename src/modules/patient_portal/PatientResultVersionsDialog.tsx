import { useState } from 'react'
import { toast } from 'sonner'
import {
  CheckCircle2, Clock, Download, FileClock, History,
  Loader2, Mail, Link2, Wrench,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  downloadPatientResultFile,
  useResultVersions,
  type PatientResultVersionRow, type PatientSharedChannel,
} from './api'
import { formatDate } from '@/lib/utils/date'

/**
 * Modal listing every version of a single result that the lab actively
 * shared with the patient (Phase 4 UI for the Phase 2 versions API).
 *
 * Patient-side invariants reflected here:
 *   - Lab-only versions (regenerated but never shared) are absent —
 *     they have no row server-side; the dialog can't render them.
 *   - "Current" / "Superseded" badges come from the per-row
 *     ``status`` field already computed by the backend.
 *   - Per-version download hits the row's own opaque ``download_url``;
 *     superseded versions remain downloadable for as long as the lab
 *     keeps the row patient-visible (Phase 2 contract).
 */
export interface PatientResultVersionsDialogProps {
  /** Anchor row's id. ``null`` keeps the dialog mounted-but-closed and
   *  the underlying query disabled. */
  resultId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PatientResultVersionsDialog({
  resultId, open, onOpenChange,
}: PatientResultVersionsDialogProps) {
  const { data, isLoading, error, refetch } = useResultVersions(
    open ? resultId : null,
  )
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  async function handleDownload(version: PatientResultVersionRow) {
    if (!version.download_url) {
      toast.error('This version has no downloadable file.')
      return
    }
    setDownloadingId(version.id)
    try {
      const filename = _suggestedFilename(version)
      await downloadPatientResultFile(version.download_url, filename)
    } catch {
      toast.error('Could not download the file. Please try again.')
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileClock className="h-5 w-5 text-muted-foreground" />
            Result version history
          </DialogTitle>
          {/*
            Friendly copy required by the spec — patients should
            understand they only see versions actually shared with
            their Cytova account, never internal lab versions.
          */}
          <p className="mt-2 text-sm text-muted-foreground">
            Only versions shared with your Cytova account are shown here.
          </p>
        </DialogHeader>

        <div className="mt-3 max-h-[60vh] overflow-y-auto pr-1">
          {isLoading && <VersionsSkeleton />}

          {error && !isLoading && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-sm text-destructive">
                We couldn't load the version history. Please try again.
              </p>
              <Button
                variant="outline" size="sm" className="mt-3"
                onClick={() => refetch()}
              >
                Try again
              </Button>
            </div>
          )}

          {!isLoading && !error && data && data.versions.length === 0 && (
            <div className="rounded-md border border-slate-200 bg-slate-50/60 p-4 text-sm text-muted-foreground">
              No versions to show.
            </div>
          )}

          {!isLoading && !error && data && data.versions.length > 0 && (
            <ul className="space-y-3">
              {data.versions.map((v) => (
                <VersionRow
                  key={v.id}
                  version={v}
                  busy={downloadingId === v.id}
                  onDownload={() => handleDownload(v)}
                />
              ))}
            </ul>
          )}
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


// ---------------------------------------------------------------------------
// Per-row presentation
// ---------------------------------------------------------------------------

interface VersionRowProps {
  version: PatientResultVersionRow
  busy: boolean
  onDownload: () => void
}

function VersionRow({ version, busy, onDownload }: VersionRowProps) {
  const isCurrent = version.status === 'CURRENT'
  return (
    <li className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium">
              <History className="h-3.5 w-3.5 text-muted-foreground" />
              Version {version.version_number ?? '—'}
            </span>
            {isCurrent ? (
              <Badge
                variant="outline"
                className="border-emerald-200 bg-emerald-50 text-emerald-700"
              >
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Current
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="border-slate-200 bg-slate-50 text-slate-600"
              >
                <Clock className="mr-1 h-3 w-3" />
                Superseded
              </Badge>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Calendar /> {version.shared_at ? formatDate(version.shared_at) : '—'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              {_channelIcon(version.shared_channel)}
              {_channelLabel(version.shared_channel)}
            </span>
          </div>
        </div>

        <Button
          type="button" size="sm" className="gap-2 shrink-0"
          onClick={onDownload}
          disabled={busy || !version.download_url}
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          Download
        </Button>
      </div>
    </li>
  )
}


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Friendly per-channel labels. Patients never see the raw enum value
 * (e.g. ``CYTOVA``) — translating here keeps the copy approachable
 * without coupling the API contract to the UI.
 */
function _channelLabel(channel: PatientSharedChannel | ''): string {
  switch (channel) {
    case 'CYTOVA': return 'Shared via Cytova'
    case 'EMAIL': return 'Shared by email'
    case 'SHARE_LINK': return 'Shared by link'
    case 'MANUAL': return 'Shared by lab staff'
    default: return 'Shared with your account'
  }
}

function _channelIcon(channel: PatientSharedChannel | '') {
  const cls = 'h-3 w-3'
  switch (channel) {
    case 'EMAIL': return <Mail className={cls} />
    case 'SHARE_LINK': return <Link2 className={cls} />
    case 'MANUAL': return <Wrench className={cls} />
    case 'CYTOVA':
    default: return <FileClock className={cls} />
  }
}

/** Inline calendar icon — no extra import; matches the muted palette
 *  of the surrounding metadata text. */
function Calendar() {
  return (
    <svg
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      className="h-3 w-3"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}

/**
 * Build a clear download filename per version. The server already
 * stamps a friendly filename on the file row; we add a version
 * suffix client-side so a patient who downloads multiple versions
 * doesn't end up with overwriting "result.pdf" entries in their
 * Downloads folder.
 */
function _suggestedFilename(version: PatientResultVersionRow): string {
  const v = version.version_number ?? '?'
  return `cytova_result_v${v}.pdf`
}


// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function VersionsSkeleton() {
  return (
    <ul className="space-y-3">
      {Array.from({ length: 2 }).map((_, i) => (
        <li
          key={i}
          className="rounded-md border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
          <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-slate-100" />
          <div className="mt-3 h-8 w-24 animate-pulse rounded bg-slate-100" />
        </li>
      ))}
    </ul>
  )
}
