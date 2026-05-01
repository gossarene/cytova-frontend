import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowLeft, Building2, Calendar, Download, FileText, History, LogOut,
  Loader2, MoreVertical, Trash2,
} from 'lucide-react'
import cytovaLogo from '@/assets/images/branding/cytova-logo.png'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { ROUTES } from '@/config/routes'
import {
  downloadPatientResultFile, logoutPatient,
  useHidePatientResult, usePatientResults,
  type PatientSharedResultRow,
} from '@/modules/patient_portal/api'
import { ResultStatusBadges } from '@/modules/patient_portal/ResultStatusBadges'
import { PatientResultVersionsDialog } from '@/modules/patient_portal/PatientResultVersionsDialog'
import { formatDate } from '@/lib/utils/date'

/**
 * ``/patient/results`` — full list of shared results.
 *
 * Mobile-first card layout (no horizontal scroll on a phone), with a
 * simple download button + "Remove from my space" action per card.
 * Empty state mirrors the dashboard copy so a patient who lands here
 * directly still sees the same reassuring guidance.
 */
export function PatientResultsPage() {
  const { data: results, isLoading, error, refetch } = usePatientResults()

  const hideMut = useHidePatientResult()
  const [pendingHide, setPendingHide] = useState<PatientSharedResultRow | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  // Version-history dialog: ``null`` keeps it closed without unmounting,
  // so the underlying React Query cache survives reopen for a recently
  // viewed result.
  const [versionsForId, setVersionsForId] = useState<string | null>(null)

  async function handleDownload(file: PatientSharedResultRow['files'][number]) {
    setDownloadingId(file.id)
    try {
      await downloadPatientResultFile(file.download_url, file.filename)
    } catch {
      toast.error('Could not download the file. Please try again.')
    } finally {
      setDownloadingId(null)
    }
  }

  async function handleConfirmHide() {
    if (!pendingHide) return
    try {
      await hideMut.mutateAsync(pendingHide.id)
      toast.success('Result removed from your Cytova space.')
      setPendingHide(null)
    } catch {
      toast.error('Could not remove the result. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/60">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to={ROUTES.PATIENT_DASHBOARD} className="inline-flex items-center gap-2">
            <img src={cytovaLogo} alt="Cytova" className="h-7" />
          </Link>
          <Button
            variant="ghost" size="sm" className="gap-2"
            onClick={() => { void logoutPatient() }}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-6 flex items-center gap-3">
          <Link
            to={ROUTES.PATIENT_DASHBOARD}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
        </div>

        <div className="mb-7">
          <h1 className="text-3xl font-semibold tracking-tight">My results</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Lab results shared with your Cytova account.
          </p>
        </div>

        {isLoading && <ResultsSkeleton />}

        {error && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-6">
              <p className="text-sm text-destructive">
                We couldn't load your results. Please try again.
              </p>
              <Button
                variant="outline" size="sm" className="mt-4"
                onClick={() => refetch()}
              >
                Try again
              </Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && (results ?? []).length === 0 && (
          <EmptyResultsCard />
        )}

        {!isLoading && !error && (results ?? []).length > 0 && (
          <div className="space-y-4">
            {results!.map((r) => (
              <ResultCard
                key={r.id}
                result={r}
                onDownload={handleDownload}
                onRequestHide={() => setPendingHide(r)}
                onViewVersions={() => setVersionsForId(r.id)}
                downloadingId={downloadingId}
              />
            ))}
          </div>
        )}
      </main>

      <PatientResultVersionsDialog
        resultId={versionsForId}
        open={versionsForId !== null}
        onOpenChange={(open) => { if (!open) setVersionsForId(null) }}
      />

      <Dialog
        open={pendingHide !== null}
        onOpenChange={(open) => { if (!open) setPendingHide(null) }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove from my space?</DialogTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              This will remove the result from your Cytova space. It will not
              delete the laboratory's original records.
            </p>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingHide(null)}
              disabled={hideMut.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive" className="gap-2"
              onClick={handleConfirmHide}
              disabled={hideMut.isPending}
            >
              {hideMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Remove from my space
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

export function EmptyResultsCard() {
  return (
    <Card className="border-slate-200/70 shadow-sm">
      <CardContent className="flex flex-col items-center px-6 py-12 text-center sm:py-16">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-muted-foreground">
          <FileText className="h-6 w-6" />
        </div>
        <p className="mt-4 text-base font-medium">You don't have any results yet.</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Share your Cytova ID with a laboratory to receive your results
          here.
        </p>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Result card (mobile-first, no horizontal scroll on a phone)
// ---------------------------------------------------------------------------

interface ResultCardProps {
  result: PatientSharedResultRow
  onDownload: (file: PatientSharedResultRow['files'][number]) => Promise<void>
  onRequestHide: () => void
  onViewVersions: () => void
  downloadingId: string | null
}

function ResultCard({
  result, onDownload, onRequestHide, onViewVersions, downloadingId,
}: ResultCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  // The "View versions" affordance is conditional: a row with no
  // version_number (legacy / pre-Phase-1) has no concept of history,
  // and a row with version 1 has nothing older to show. ``> 1`` is
  // sufficient because version_number is monotonically incremented
  // by the share service — version 2 means at least one earlier
  // version was also shared.
  const versionNumber = result.report_version_number
  const hasVersionBadge = versionNumber !== null && versionNumber !== undefined
  const hasOlderVersions =
    versionNumber !== null && versionNumber !== undefined && versionNumber > 1

  return (
    <Card className="border-slate-200/70 shadow-sm">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                {result.source_name || '—'}
              </span>
              <ResultStatusBadges row={result} />
              {hasVersionBadge && (
                <Badge
                  variant="outline"
                  className="border-indigo-200 bg-indigo-50 text-indigo-700"
                >
                  Version {versionNumber}
                </Badge>
              )}
            </div>
            <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
              {result.request_reference || '—'}
            </p>
          </div>

          <div className="relative">
            <Button
              variant="ghost" size="icon-sm" aria-label="More actions"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
            {menuOpen && (
              <>
                <button
                  type="button" aria-hidden
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-md border border-slate-200 bg-white p-1 shadow-lg">
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onRequestHide() }}
                    className="flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left text-sm text-destructive hover:bg-destructive/5"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove from my space
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <Separator className="my-4" />

        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <Field
            icon={Calendar} label="Result available"
            value={result.result_available_date ? formatDate(result.result_available_date) : '—'}
          />
          <Field
            icon={Calendar} label="Request date"
            value={result.request_date ? formatDate(result.request_date) : '—'}
          />
        </div>

        {result.files.length > 0 && (
          <div className="mt-5 space-y-2">
            {result.files.map((file) => {
              const busy = downloadingId === file.id
              return (
                <div
                  key={file.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50/60 px-3 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate text-sm">{file.filename}</span>
                  </div>
                  <Button
                    type="button" size="sm" className="gap-2 shrink-0"
                    onClick={() => onDownload(file)}
                    disabled={busy}
                  >
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                    Download
                  </Button>
                </div>
              )
            })}
          </div>
        )}

        {hasOlderVersions && (
          <div className="mt-3">
            <Button
              type="button" variant="ghost" size="sm" className="gap-2"
              onClick={onViewVersions}
            >
              <History className="h-3.5 w-3.5" />
              View versions
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Field({
  icon: Icon, label, value,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 truncate text-sm">{value}</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function ResultsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="border-slate-200/70 shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <div className="h-4 w-2/5 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-slate-100" />
            <div className="mt-5 h-9 animate-pulse rounded bg-slate-100" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
