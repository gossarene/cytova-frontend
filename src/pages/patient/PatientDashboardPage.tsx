import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowRight, Building2, Calendar, Check, Copy, Download, FileText,
  Loader2, LogOut, Sparkles, User,
} from 'lucide-react'
import cytovaLogo from '@/assets/images/branding/cytova-logo.png'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ROUTES } from '@/config/routes'
import { usePatientAuthStore } from '@/lib/auth/patient-store'
import {
  downloadPatientResultFile, logoutPatient,
  usePatientMe, usePatientResults,
  type PatientSharedResultRow,
} from '@/modules/patient_portal/api'
import { ResultStatusBadges } from '@/modules/patient_portal/ResultStatusBadges'
import { formatDate } from '@/lib/utils/date'

/**
 * Initial patient dashboard. Loads ``GET /me/`` on mount to populate
 * the welcome header + Cytova ID card. The store carries the patient
 * profile after login, but ``/me`` is the canonical source — we
 * always defer to it so a follow-up profile change shows up without
 * a re-login.
 */
export function PatientDashboardPage() {
  const cachedPatient = usePatientAuthStore((s) => s.patient)
  const { data: me, isLoading } = usePatientMe()

  // Prefer the freshly-fetched /me payload; fall back to the
  // login-time cache so the first paint isn't a skeleton.
  const firstName = me?.first_name ?? cachedPatient?.firstName ?? ''
  const lastName = me?.last_name ?? cachedPatient?.lastName ?? ''
  const email = me?.email ?? cachedPatient?.email ?? ''
  const cytovaId = me?.cytova_patient_id ?? cachedPatient?.cytovaPatientId ?? ''

  return (
    <div className="min-h-screen bg-slate-50/60">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
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

      <main className="mx-auto max-w-5xl px-6 py-10 sm:py-14">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Welcome{firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your Cytova patient space — one place for all your lab results.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <CytovaCard
            firstName={firstName}
            lastName={lastName}
            email={email}
            cytovaId={cytovaId}
            isLoading={isLoading}
          />

          <ResultsCard />

          <ComingSoonCard />
        </div>
      </main>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Cytova ID card
// ---------------------------------------------------------------------------

interface CytovaCardProps {
  firstName: string
  lastName: string
  email: string
  cytovaId: string
  isLoading: boolean
}

function CytovaCard({ firstName, lastName, email, cytovaId, isLoading }: CytovaCardProps) {
  const [copied, setCopied] = useState(false)

  function copyId() {
    if (!cytovaId) return
    navigator.clipboard.writeText(cytovaId).then(
      () => {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2000)
      },
      () => { /* clipboard blocked — silent */ },
    )
  }

  return (
    <Card className="lg:col-span-2 border-slate-200/70 shadow-sm">
      <CardContent className="p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <User className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Patient identity
            </p>
            <h2 className="mt-1 truncate text-lg font-semibold">
              {firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Loading…'}
            </h2>
            {email && (
              <p className="truncate text-sm text-muted-foreground">{email}</p>
            )}
          </div>
        </div>

        <Separator className="my-5" />

        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Your Cytova ID
        </p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="font-mono text-2xl font-semibold tracking-tight">
            {cytovaId || (isLoading ? '…' : '—')}
          </span>
          <Button
            type="button" variant="outline" size="sm"
            onClick={copyId} disabled={!cytovaId} className="gap-1.5"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Share this ID with your lab to receive results in your Cytova
          patient space.
        </p>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Results section — empty state for now
// ---------------------------------------------------------------------------

function ResultsCard() {
  return (
    <Card className="lg:col-span-3 border-slate-200/70 shadow-sm">
      <CardContent className="p-6 sm:p-8">
        <ResultsCardBody />
      </CardContent>
    </Card>
  )
}

function ResultsCardBody() {
  const { data, isLoading, error } = usePatientResults()
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const total = data?.length ?? 0
  // Surface the three most recent rows on the dashboard. The full
  // list lives at /patient/results; the CTA below points there.
  const preview = (data ?? []).slice(0, 3)

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

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">My results</h2>
        {total > 0 && (
          <Link
            to={ROUTES.PATIENT_RESULTS}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      <Separator className="my-5" />

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-md bg-slate-100" />
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">
          We couldn't load your results.
        </p>
      )}

      {!isLoading && !error && preview.length === 0 && (
        <div className="flex flex-col items-center py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-muted-foreground">
            <FileText className="h-6 w-6" />
          </div>
          <p className="mt-4 text-base font-medium">You don't have any results yet.</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Share your Cytova ID with a laboratory to receive your results
            here.
          </p>
        </div>
      )}

      {!isLoading && preview.length > 0 && (
        <div className="space-y-3">
          {preview.map((row) => (
            <DashboardResultRow
              key={row.id} row={row}
              downloadingId={downloadingId}
              onDownload={handleDownload}
            />
          ))}
          {total > preview.length && (
            <Link
              to={ROUTES.PATIENT_RESULTS}
              className="block pt-2 text-center text-sm text-muted-foreground hover:text-foreground"
            >
              View all {total} results
            </Link>
          )}
        </div>
      )}
    </>
  )
}

interface DashboardResultRowProps {
  row: PatientSharedResultRow
  downloadingId: string | null
  onDownload: (file: PatientSharedResultRow['files'][number]) => Promise<void>
}

function DashboardResultRow({ row, downloadingId, onDownload }: DashboardResultRowProps) {
  const file = row.files[0]
  const busy = file ? downloadingId === file.id : false
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-sm font-medium">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            {row.source_name || '—'}
          </p>
          <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {row.result_available_date ? formatDate(row.result_available_date) : '—'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ResultStatusBadges row={row} />
          {file && (
            <Button
              type="button" size="sm" variant="outline" className="gap-1.5"
              onClick={() => onDownload(file)}
              disabled={busy}
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Download
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Coming soon
// ---------------------------------------------------------------------------

function ComingSoonCard() {
  return (
    <Card className="lg:col-span-3 border-dashed border-slate-300 bg-slate-50/30 shadow-none">
      <CardContent className="flex items-center gap-4 p-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="text-sm">
          <p className="font-medium">More features coming soon</p>
          <p className="text-muted-foreground">
            Sharing controls, secure messaging with your lab, and downloadable
            reports.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
