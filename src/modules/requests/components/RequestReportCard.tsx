import { useState } from 'react'
import { toast } from 'sonner'
import { Download, Loader2, FileText } from 'lucide-react'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Can } from '@/lib/permissions/Can'
import { P } from '@/lib/permissions/constants'
import { api } from '@/lib/api/client'
import { formatDateTime } from '@/lib/utils/date'
import { useGenerateRequestReport } from '../api'
import type { RequestStatus } from '../types'

interface Props {
  requestId: string
  requestNumber: string
  requestStatus: RequestStatus
}

/**
 * Final patient report panel.
 *
 * States:
 *   - Request not yet VALIDATED → action disabled with explanatory hint
 *   - Request VALIDATED, no report yet → "Generate Report" (biologist)
 *   - Request VALIDATED, report exists → "Download Report" + metadata
 *
 * Report lifecycle matches the backend: idempotent generate-or-get.
 * Downloads flow through the protected backend endpoint (never raw media).
 */
export function RequestReportCard({ requestId, requestNumber, requestStatus }: Props) {
  const generate = useGenerateRequestReport(requestId)
  const [isDownloading, setIsDownloading] = useState(false)
  const [hasReport, setHasReport] = useState(false)
  const [reportMeta, setReportMeta] = useState<{ generated_at: string; generated_by_email: string | null } | null>(null)

  const isValidated = requestStatus === 'VALIDATED' || requestStatus === 'COMPLETED'
  const pdfUrl = `/requests/${requestId}/report/download/`

  async function handleGenerate() {
    try {
      const report = await generate.mutateAsync()
      setHasReport(true)
      setReportMeta({
        generated_at: report.generated_at,
        generated_by_email: report.generated_by_email,
      })
      toast.success(`Report generated for ${requestNumber}.`)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { errors?: { message?: string }[] } } })
        ?.response?.data?.errors?.[0]?.message
      toast.error(msg || 'Failed to generate report.')
    }
  }

  async function handleDownload() {
    setIsDownloading(true)
    try {
      const response = await api.get<Blob>(pdfUrl, { responseType: 'blob' })
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const blobUrl = URL.createObjectURL(blob)
      try {
        const anchor = document.createElement('a')
        anchor.href = blobUrl
        anchor.download = `report_${requestNumber}.pdf`
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
              Grouped result PDF for the finalized request. Generate once and re-download as needed.
            </CardDescription>
          </div>
          {hasReport && (
            <Badge variant="outline" className="text-xs">Ready</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isValidated ? (
          <p className="text-sm text-muted-foreground">
            The final report can be generated once the request has been validated.
          </p>
        ) : hasReport && reportMeta ? (
          <>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <MetadataRow label="Generated" value={formatDateTime(reportMeta.generated_at)} />
              <MetadataRow label="By" value={reportMeta.generated_by_email ?? '—'} />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                The PDF is streamed securely through the backend — no public link is ever created.
              </p>
              <div className="flex gap-2">
                <Can permission={P.REQUESTS_FINALIZE}>
                  <Button
                    type="button" variant="outline" className="gap-2"
                    onClick={handleGenerate} disabled={generate.isPending}
                  >
                    {generate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                    Regenerate
                  </Button>
                </Can>
                <Button
                  type="button" className="gap-2"
                  onClick={handleDownload} disabled={isDownloading}
                >
                  {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
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
                {generate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                Generate Report
              </Button>
            </Can>
          </div>
        )}
      </CardContent>
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
