import { useState } from 'react'
import { toast } from 'sonner'
import {
  CheckCircle2, Clock, Download, FileText, History, Link2, Loader2,
  Mail, RotateCcw, Send, ShieldOff, UserMinus, Wrench,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ErrorState } from '@/components/shared/ErrorState'
import { api } from '@/lib/api/client'
import { formatDateTime } from '@/lib/utils/date'
import { useReportHistory } from '../api'
import type {
  LabReportSharedChannel, ReportHistoryLabVersion, ReportHistoryPayload,
  ReportHistoryShareEvent,
} from '../api'


interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  requestId: string
  publicReference: string
}

/**
 * Lab-side "Report history" traceability dialog.
 *
 * Combines the lab-internal version line (every ``AnalysisRequestReport``
 * row) with the patient-portal share events that referenced each
 * version. Lets staff answer at a glance: which versions did we
 * generate, which were shared with the patient, through which channel,
 * and which is currently the patient-facing one.
 *
 * Lab-only versions (regenerated but never shared) appear with no
 * patient-share sub-list — that's the visible asymmetry the spec
 * requires: the lab can see internal versions, the patient cannot.
 *
 * The query is gated on ``open`` so no traceability request is sent
 * on pages where the operator never opens the panel.
 */
export function ReportHistoryDialog({
  open, onOpenChange, requestId, publicReference,
}: Props) {
  const { data, isLoading, isError, refetch } = useReportHistory(requestId, open)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Report history
          </DialogTitle>
          <DialogDescription>
            Generated versions for request {publicReference}, with the
            patient-facing share lifecycle. Older versions remain
            downloadable for traceability. Lab-only versions are visible
            here even when they were never shared with the patient.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[65vh] overflow-y-auto pr-1">
          {isLoading && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading history…
            </div>
          )}

          {isError && !isLoading && <ErrorState onRetry={refetch} />}

          {!isLoading && !isError && data && (
            <>
              <IssuanceSummary data={data} />

              {data.lab_versions.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No report versions have been generated yet.
                </p>
              ) : (
                <ul className="divide-y rounded-md border">
                  {data.lab_versions.map((v) => (
                    <VersionRow
                      key={v.id} version={v}
                      publicReference={publicReference}
                    />
                  ))}
                </ul>
              )}

              {data.unversioned_shares.length > 0 && (
                <div className="mt-5">
                  <Separator className="my-3" />
                  <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Earlier shares (no version recorded)
                  </h4>
                  <ul className="space-y-2">
                    {data.unversioned_shares.map((evt) => (
                      <li
                        key={evt.shared_result_id}
                        className="rounded-md border border-slate-200 bg-slate-50/60 p-3"
                      >
                        <ShareEvent event={evt} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


// ---------------------------------------------------------------------------
// Issuance summary header
// ---------------------------------------------------------------------------

function IssuanceSummary({ data }: { data: ReportHistoryPayload }) {
  // Skip the entire summary panel for requests that haven't reached
  // any issuance milestone — keeps the dialog tight on early-lifecycle
  // requests where there's nothing meaningful to summarise yet.
  const hasIssuance =
    data.issued_at !== null
    || data.reopened_at !== null
    || data.channels_used.length > 0

  if (!hasIssuance) return null

  return (
    <div className="mb-4 rounded-md border border-slate-200 bg-slate-50/60 p-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {data.issued_at && (
          <span className="inline-flex items-center gap-1.5">
            <Send className="h-3.5 w-3.5" />
            Issued {formatDateTime(data.issued_at)}
            {data.issued_by_email && <> · {data.issued_by_email}</>}
          </span>
        )}
        {data.reopened_at && (
          <span className="inline-flex items-center gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            Reopened {formatDateTime(data.reopened_at)}
            {data.reopened_by_email && <> · {data.reopened_by_email}</>}
          </span>
        )}
      </div>

      {data.reopen_reason && (
        <p className="mt-2 rounded border border-amber-200 bg-amber-50/70 p-2 text-xs text-amber-900">
          <span className="font-medium">Correction reason:</span>{' '}
          {data.reopen_reason}
        </p>
      )}

      {data.channels_used.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Channels used
          </span>
          {data.channels_used.map((c) => (
            <Badge key={c} variant="outline" className="text-xs">
              {_channelLabel(c)}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}


// ---------------------------------------------------------------------------
// Per-version row
// ---------------------------------------------------------------------------

function VersionRow({
  version, publicReference,
}: {
  version: ReportHistoryLabVersion
  publicReference: string
}) {
  const [isDownloading, setIsDownloading] = useState(false)

  async function handleDownload() {
    setIsDownloading(true)
    try {
      const response = await api.get<Blob>(
        version.pdf_url, { responseType: 'blob' },
      )
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const blobUrl = URL.createObjectURL(blob)
      try {
        const anchor = document.createElement('a')
        anchor.href = blobUrl
        anchor.download =
          `report_${publicReference}_v${version.version_number}.pdf`
        document.body.appendChild(anchor)
        anchor.click()
        document.body.removeChild(anchor)
      } finally {
        URL.revokeObjectURL(blobUrl)
      }
    } catch {
      toast.error(`Failed to download version v${version.version_number}.`)
    } finally {
      setIsDownloading(false)
    }
  }

  const sharedCount = version.shared_with_patient.length

  return (
    <li className="px-3 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">v{version.version_number}</span>
            {version.is_current && (
              <Badge variant="outline" className="text-xs">Current</Badge>
            )}
            {sharedCount === 0 && (
              <Badge
                variant="outline"
                className="border-slate-200 bg-white text-xs text-muted-foreground"
              >
                Internal only
              </Badge>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {formatDateTime(version.generated_at)}
            {version.generated_by_email && (
              <> · {version.generated_by_email}</>
            )}
          </p>
        </div>
        <Button
          type="button" size="sm" variant="outline" className="gap-1.5 shrink-0"
          onClick={handleDownload}
          disabled={isDownloading || !version.downloadable}
        >
          {isDownloading
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Download className="h-3.5 w-3.5" />}
          Download
        </Button>
      </div>

      {sharedCount > 0 && (
        <ul className="mt-2 space-y-1.5 border-l border-slate-200 pl-3">
          {version.shared_with_patient.map((evt) => (
            <li key={evt.shared_result_id}>
              <ShareEvent event={evt} />
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}


// ---------------------------------------------------------------------------
// Per share event
// ---------------------------------------------------------------------------

function ShareEvent({ event }: { event: ReportHistoryShareEvent }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      <span className="inline-flex items-center gap-1.5 text-foreground">
        {_channelIcon(event.shared_channel)}
        Shared {formatDateTime(event.shared_at)}
        <span className="text-muted-foreground">
          via {_channelLabel(event.shared_channel)}
        </span>
      </span>
      {event.is_current_for_patient ? (
        <Badge
          variant="outline"
          className="border-emerald-200 bg-emerald-50 text-emerald-700"
        >
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Patient sees this
        </Badge>
      ) : (
        <Badge
          variant="outline"
          className="border-slate-200 bg-slate-50 text-slate-600"
        >
          <Clock className="mr-1 h-3 w-3" />
          Superseded for patient
        </Badge>
      )}
      {event.share_status === 'REVOKED' && (
        <Badge
          variant="outline"
          className="border-rose-200 bg-rose-50 text-rose-700"
        >
          <ShieldOff className="mr-1 h-3 w-3" />
          Revoked
        </Badge>
      )}
      {event.share_status === 'HIDDEN_BY_PATIENT' && (
        <Badge
          variant="outline"
          className="border-amber-200 bg-amber-50 text-amber-700"
        >
          <UserMinus className="mr-1 h-3 w-3" />
          Hidden by patient
        </Badge>
      )}
    </div>
  )
}


// ---------------------------------------------------------------------------
// Channel label/icon helpers
// ---------------------------------------------------------------------------

function _channelLabel(channel: LabReportSharedChannel | ''): string {
  switch (channel) {
    case 'CYTOVA': return 'Cytova'
    case 'EMAIL': return 'Email'
    case 'SHARE_LINK': return 'Share link'
    case 'MANUAL': return 'Manual'
    default: return 'Unknown'
  }
}

function _channelIcon(channel: LabReportSharedChannel | '') {
  const cls = 'h-3.5 w-3.5 text-muted-foreground'
  switch (channel) {
    case 'EMAIL': return <Mail className={cls} />
    case 'SHARE_LINK': return <Link2 className={cls} />
    case 'MANUAL': return <Wrench className={cls} />
    case 'CYTOVA':
    default: return <History className={cls} />
  }
}
