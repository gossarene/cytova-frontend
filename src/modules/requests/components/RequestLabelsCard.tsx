import { useState } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Download, Loader2, Printer, Tag } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Can } from '@/lib/permissions/Can'
import { P } from '@/lib/permissions/constants'
import { api } from '@/lib/api/client'
import { formatDateTime } from '@/lib/utils/date'
import { useGenerateRequestLabels, useRequestLabels } from '../api'
import type { RequestStatus, RequestItemBrief } from '../types'

interface Props {
  requestId: string
  requestNumber: string
  requestStatus: RequestStatus
  items: RequestItemBrief[]
}

/**
 * Label generation / download panel for an analysis request.
 *
 * Reflects three possible states:
 *   - Request is still DRAFT         → action disabled, hint explaining why
 *   - Confirmed, no batch yet        → "Generate Labels" button
 *   - Confirmed, batch exists        → "Download Labels" button + metadata
 *
 * Keeps the UI flat and operational: one card, one primary action at a
 * time, with the permission gate applied to the write action only.
 */
export function RequestLabelsCard({ requestId, requestNumber, requestStatus, items }: Props) {
  const qc = useQueryClient()
  const { data: batch, isLoading } = useRequestLabels(requestId)
  const generate = useGenerateRequestLabels(requestId)
  const [isDownloading, setIsDownloading] = useState(false)

  const isDraft = requestStatus === 'DRAFT'
  const hasBatch = !!batch

  const activeItems = items.filter((i) => i.status !== 'REJECTED')
  const allCollected = activeItems.length > 0 && activeItems.every((i) => i.status !== 'PENDING')

  async function handleGenerate() {
    try {
      const result = await generate.mutateAsync()
      toast.success(`${result.label_count} labels generated for ${requestNumber}.`)
    } catch {
      toast.error('Failed to generate labels.')
    }
  }

  async function handleDownload() {
    // ``batch.pdf_url`` is now the API-relative path of the protected
    // backend download endpoint (e.g. ``/requests/<id>/labels/download/``).
    // Fetching it through the shared axios client automatically attaches
    // the JWT Authorization header and enforces tenant isolation via the
    // same interceptors that every other request uses. The backend
    // streams the PDF bytes; we turn them into a local blob URL and
    // trigger a browser download — the raw ``/media/`` path is never
    // exposed to the client and no public link is ever created.
    if (!batch?.pdf_url) {
      toast.error('Label PDF is not available.')
      return
    }
    setIsDownloading(true)
    try {
      const response = await api.get<Blob>(batch.pdf_url, {
        responseType: 'blob',
      })
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const blobUrl = URL.createObjectURL(blob)
      try {
        // Dynamically-created anchor with ``download`` attribute: the
        // most compatible pattern for triggering a save-as dialog from
        // a blob. ``target=_blank`` is intentionally NOT used — we
        // want the PDF to download, not to open in a new tab.
        const anchor = document.createElement('a')
        anchor.href = blobUrl
        anchor.download = `labels_${requestNumber}.pdf`
        document.body.appendChild(anchor)
        anchor.click()
        document.body.removeChild(anchor)
      } finally {
        // Always free the blob URL, even if the anchor click throws.
        URL.revokeObjectURL(blobUrl)
      }
      // The download endpoint stamps ``has_been_downloaded`` /
      // ``download_count`` server-side. Refetch the batch so the
      // Mark Collected gate flips from "labels not downloaded
      // yet" to enabled without requiring a manual page reload.
      qc.invalidateQueries({ queryKey: ['requests', requestId, 'labels'] })
    } catch {
      toast.error('Failed to download labels PDF.')
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
              <Tag className="h-4 w-4 text-muted-foreground" />
              Specimen Labels
            </CardTitle>
            <CardDescription>
              Printable tube labels for this request. Each label carries a
              unique barcode used throughout the lab workflow.
            </CardDescription>
          </div>
          {hasBatch && (
            <Badge variant="outline" className="text-xs">
              {batch.label_count} label{batch.label_count !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading labels…
          </div>
        ) : hasBatch ? (
          <>
            {/*
              Compact metadata row — visible to everyone, tells the user
              labels already exist before they consider re-generating.
            */}
            <div className="grid gap-2 text-sm sm:grid-cols-3">
              <MetadataRow label="Generated" value={formatDateTime(batch.generated_at)} />
              <MetadataRow label="By" value={batch.generated_by_email ?? '\u2014'} />
              <MetadataRow
                label="Distinct families"
                value={String(batch.family_count)}
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Labels were generated once and are reused — re-downloading
                preserves barcode traceability with the physical tubes.
              </p>
              <Button
                type="button"
                className="gap-2"
                onClick={handleDownload}
                disabled={!batch.pdf_url || isDownloading || allCollected}
                title={allCollected ? 'Labels cannot be downloaded after all specimens are collected.' : undefined}
              >
                {isDownloading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Download className="h-4 w-4" />}
                Download Labels PDF
              </Button>
              {allCollected && (
                <p className="text-xs text-muted-foreground">
                  All specimens have been collected — labels are no longer needed.
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {isDraft
                ? 'Labels can be generated after the request is confirmed.'
                : 'No labels have been generated yet for this request.'}
            </p>
            <Can permission={P.REQUESTS_CONFIRM}>
              <Button
                type="button"
                className="gap-2"
                onClick={handleGenerate}
                disabled={isDraft || generate.isPending}
                // ``title`` is a native tooltip affordance — extra
                // context for the disabled state without adding a
                // dedicated popover.
                title={isDraft ? 'Confirm the request first' : undefined}
              >
                {generate.isPending
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Printer className="h-4 w-4" />}
                Generate Labels
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
