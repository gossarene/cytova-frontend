import { useState } from 'react'
import { toast } from 'sonner'
import { Download, Loader2, FileText } from 'lucide-react'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ErrorState } from '@/components/shared/ErrorState'
import { api } from '@/lib/api/client'
import { formatDateTime } from '@/lib/utils/date'
import { useReportVersions } from '../api'
import type { ReportVersionListItem } from '../api'


interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  requestId: string
  publicReference: string
}

/**
 * Report history modal.
 *
 * Lists every generated report version for a request, newest first,
 * and lets operators stream any of them through the protected backend
 * download endpoint. Kept isolated from the main request detail so
 * the primary actions (Download / Regenerate) stay uncluttered.
 *
 * The query is only fired while the dialog is open (``enabled``), so
 * no history request is sent on pages where the history is never
 * viewed.
 */
export function ReportHistoryDialog({
  open, onOpenChange, requestId, publicReference,
}: Props) {
  const { data, isLoading, isError, refetch } = useReportVersions(requestId, open)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Report history
          </DialogTitle>
          <DialogDescription>
            All generated versions of the final report for request {publicReference}.
            Older versions remain stored for traceability and can be downloaded anytime.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading history…
            </div>
          ) : isError ? (
            <ErrorState onRetry={refetch} />
          ) : !data || data.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No report versions have been generated yet.
            </p>
          ) : (
            <ul className="divide-y rounded-md border">
              {data.map((v) => (
                <VersionRow key={v.id} version={v} publicReference={publicReference} />
              ))}
            </ul>
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


function VersionRow({
  version, publicReference,
}: {
  version: ReportVersionListItem
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

  return (
    <li className="flex items-center justify-between gap-3 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">v{version.version_number}</span>
          {version.is_current && (
            <Badge variant="outline" className="text-xs">Current</Badge>
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
        type="button" size="sm" variant="outline" className="gap-1.5"
        onClick={handleDownload}
        disabled={isDownloading || !version.downloadable}
      >
        {isDownloading
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
          : <Download className="h-3.5 w-3.5" />}
        Download
      </Button>
    </li>
  )
}
