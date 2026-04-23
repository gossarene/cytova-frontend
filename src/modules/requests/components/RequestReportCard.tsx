import { useState } from 'react'
import { toast } from 'sonner'
import { Download, Loader2, FileText, RefreshCw, History } from 'lucide-react'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Can } from '@/lib/permissions/Can'
import { P } from '@/lib/permissions/constants'
import { api } from '@/lib/api/client'
import { formatDateTime } from '@/lib/utils/date'
import {
  useGenerateRequestReport, useRegenerateRequestReport,
} from '../api'
import { ReportHistoryDialog } from './ReportHistoryDialog'
import type { CurrentReportMeta, RequestStatus } from '../types'

interface Props {
  requestId: string
  // The patient-facing reference — printed on PDFs, shown on receipts.
  // The internal ``request_number`` stays in the detail payload for audit
  // but never appears in this card's copy or filenames.
  publicReference: string
  requestStatus: RequestStatus
  // Authoritative report state from the detail payload — survives reload,
  // avoids local state drift between Generate/Regenerate actions.
  hasReport: boolean
  currentReport: CurrentReportMeta | null
}

/**
 * Final patient report panel.
 *
 * Three operational states, driven exclusively by the detail payload:
 *   1. Request not yet VALIDATED    → explanatory hint, no actions.
 *   2. VALIDATED, no report yet     → Generate Report PDF (primary).
 *   3. VALIDATED, report exists     → Download Report PDF (primary)
 *                                      + Regenerate (secondary, confirmed).
 *
 * Downloads stream through the protected backend endpoint — no raw
 * media URL is ever constructed on the client.
 */
export function RequestReportCard({
  requestId,
  publicReference,
  requestStatus,
  hasReport,
  currentReport,
}: Props) {
  const generate = useGenerateRequestReport(requestId)
  const regenerate = useRegenerateRequestReport(requestId)
  const [isDownloading, setIsDownloading] = useState(false)
  const [showRegenerate, setShowRegenerate] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const isValidated = requestStatus === 'VALIDATED' || requestStatus === 'COMPLETED'

  async function handleGenerate() {
    try {
      const report = await generate.mutateAsync()
      toast.success(
        `Report v${report.version_number} generated for ${publicReference}.`,
      )
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { errors?: { message?: string }[] } } })
        ?.response?.data?.errors?.[0]?.message
      toast.error(msg || 'Failed to generate report.')
    }
  }

  async function handleRegenerate() {
    setShowRegenerate(false)
    try {
      const report = await regenerate.mutateAsync()
      toast.success(
        `New report version v${report.version_number} generated for ${publicReference}.`,
      )
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { errors?: { message?: string }[] } } })
        ?.response?.data?.errors?.[0]?.message
      toast.error(msg || 'Failed to regenerate report.')
    }
  }

  async function handleDownload() {
    if (!currentReport) return
    setIsDownloading(true)
    try {
      const response = await api.get<Blob>(
        currentReport.pdf_url,
        { responseType: 'blob' },
      )
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const blobUrl = URL.createObjectURL(blob)
      try {
        const anchor = document.createElement('a')
        anchor.href = blobUrl
        anchor.download =
          `report_${publicReference}_v${currentReport.version_number}.pdf`
        document.body.appendChild(anchor)
        anchor.click()
        document.body.removeChild(anchor)
      } finally {
        URL.revokeObjectURL(blobUrl)
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 404) {
        toast.error('Report has not been generated yet.')
      } else {
        toast.error('Failed to download report PDF.')
      }
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Final Patient Report
            </CardTitle>
            <CardDescription>
              Grouped result PDF for the finalized request. Download the current
              version anytime — regenerate to create a new version while keeping
              previous ones for traceability.
            </CardDescription>
          </div>
          {hasReport && currentReport && (
            <Badge variant="outline" className="text-xs">
              v{currentReport.version_number}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isValidated ? (
          <p className="text-sm text-muted-foreground">
            The final report can be generated once the request has been validated.
          </p>
        ) : hasReport && currentReport ? (
          <>
            <div className="grid gap-2 text-sm sm:grid-cols-3">
              <MetadataRow label="Current version" value={`v${currentReport.version_number}`} />
              <MetadataRow label="Generated" value={formatDateTime(currentReport.generated_at)} />
              <MetadataRow label="By" value={currentReport.generated_by_email ?? '—'} />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                The PDF is streamed securely through the backend — no public link
                is ever created. Older versions remain stored for traceability.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button" variant="ghost" size="sm" className="gap-2"
                  onClick={() => setShowHistory(true)}
                >
                  <History className="h-4 w-4" />
                  History
                </Button>
                <Can permission={P.REQUESTS_FINALIZE}>
                  <Button
                    type="button" variant="outline" className="gap-2"
                    onClick={() => setShowRegenerate(true)}
                    disabled={regenerate.isPending || generate.isPending}
                  >
                    {regenerate.isPending
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <RefreshCw className="h-4 w-4" />}
                    Regenerate
                  </Button>
                </Can>
                <Button
                  type="button" className="gap-2"
                  onClick={handleDownload}
                  disabled={isDownloading || !currentReport.downloadable}
                >
                  {isDownloading
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Download className="h-4 w-4" />}
                  Download Report PDF
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              No report has been generated yet for this request.
            </p>
            <Can permission={P.REQUESTS_FINALIZE}>
              <Button
                type="button" className="gap-2"
                onClick={handleGenerate} disabled={generate.isPending}
              >
                {generate.isPending
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <FileText className="h-4 w-4" />}
                Generate Report PDF
              </Button>
            </Can>
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={showRegenerate}
        onOpenChange={setShowRegenerate}
        title="Regenerate report?"
        description={
          currentReport
            ? `A new version (v${currentReport.version_number + 1}) will be ` +
              `created and become the current report. Version ` +
              `v${currentReport.version_number} will remain stored for ` +
              `traceability and will no longer be downloadable from this page.`
            : 'A new version will be created. Previous versions remain stored for traceability.'
        }
        confirmLabel="Regenerate"
        onConfirm={handleRegenerate}
        isLoading={regenerate.isPending}
      />

      <ReportHistoryDialog
        open={showHistory}
        onOpenChange={setShowHistory}
        requestId={requestId}
        publicReference={publicReference}
      />
    </Card>
  )
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm truncate">{value}</p>
    </div>
  )
}
