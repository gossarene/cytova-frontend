import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  Download, Loader2, ShieldAlert, FileText, Lock, Eye, EyeOff,
  ShieldCheck, Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import cytovaLogo from '@/assets/images/branding/cytova-logo.png'
import { env } from '@/config/env'

// Patient-access endpoints (`/r/<token>/...`) live on the BACKEND, not under
// `/api/v1/`. We derive the API origin from the tenant-aware resolver in
// `config/env.ts` and strip the `/api/v1` suffix:
//
//   dev   → env.apiBaseUrl = "http://golab-medical.cytova.io:8000/api/v1"
//          → ORIGIN         = "http://golab-medical.cytova.io:8000"
//          → fetch("/r/...")→ "http://golab-medical.cytova.io:8000/r/..."  ✓
//
//   prod  → env.apiBaseUrl = "/api/v1"  (same-origin behind reverse proxy)
//          → ORIGIN         = ""        (relative)
//          → fetch("/r/...")→ resolves against window.location.origin,
//                             which IS the backend origin in prod          ✓
//
// Never use window.location.origin directly here — it would point at the
// Vite dev server in dev (port 3000) and 404 every API call.
const ORIGIN = env.apiBaseUrl.replace(/\/api\/v1\/?$/, '')

// Try to parse a Response as JSON; on parse failure (e.g. backend returned
// an HTML error page, or the request was misrouted to the SPA host) return
// ``null`` instead of throwing. Callers map ``null`` to a clean user-facing
// message rather than exposing "Unexpected token '<'..." to patients.
async function safeJson(resp: Response): Promise<any | null> {
  const ct = resp.headers.get('content-type') || ''
  if (!ct.includes('application/json')) {
    if (import.meta.env.DEV) {
      console.warn('[ResultAccess] non-JSON response', resp.status, ct, resp.url)
    }
    return null
  }
  try {
    return await resp.json()
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[ResultAccess] JSON parse failed', err)
    return null
  }
}

const GENERIC_INVALID_LINK = 'This link is invalid or has expired.'

interface AccessMeta {
  expires_at: string
  downloadable: boolean
  password_required: boolean
  password_hint: string
}

interface VerifiedIdentity {
  patient_name: string
  request_reference: string
}

export function ResultAccessPage() {
  const { token } = useParams<{ token: string }>()
  const [meta, setMeta] = useState<AccessMeta | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [downloadGrant, setDownloadGrant] = useState<string | null>(null)
  const [identity, setIdentity] = useState<VerifiedIdentity | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)

  useEffect(() => {
    if (!token) return
    fetch(`${ORIGIN}/r/${token}/`)
      .then(async (resp) => {
        const body = await safeJson(resp)
        if (!resp.ok) {
          throw new Error(body?.error || GENERIC_INVALID_LINK)
        }
        if (body == null) {
          // Successful HTTP but body wasn't JSON — most likely the request
          // was misrouted to the frontend host. Show the generic message
          // and let the dev console hint at the cause.
          throw new Error(GENERIC_INVALID_LINK)
        }
        setMeta(body.data ?? body)
      })
      .catch((e: unknown) => {
        if (import.meta.env.DEV) console.warn('[ResultAccess] meta fetch failed', e)
        setError(e instanceof Error ? e.message : GENERIC_INVALID_LINK)
      })
      .finally(() => setLoading(false))
  }, [token])

  async function handleVerify() {
    if (!token || !password.trim()) return
    setVerifying(true)
    setPwError(null)
    try {
      const resp = await fetch(`${ORIGIN}/r/${token}/verify-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      })
      const body = await safeJson(resp)
      if (!resp.ok) {
        // Body might be null (non-JSON response — e.g. SPA fallback). Fall
        // back to a generic message in that case rather than exposing parse
        // errors. Existing rate-limit / remaining-attempts hints are still
        // surfaced when the server actually returned them.
        let msg = body?.error || 'Verification failed. Please try again.'
        if (body && body.remaining_attempts !== undefined && body.remaining_attempts > 0) {
          msg += ` (${body.remaining_attempts} attempt${body.remaining_attempts === 1 ? '' : 's'} remaining)`
        }
        if (body && body.retry_after !== undefined) {
          const mins = Math.ceil(body.retry_after / 60)
          msg = `Too many failed attempts. Please try again in ${mins} minute${mins === 1 ? '' : 's'}.`
        }
        setPwError(msg)
        return
      }
      if (body == null) {
        setPwError('Verification failed. Please try again.')
        return
      }
      const d = body.data ?? body
      setDownloadGrant(d.download_grant ?? 'none')
      if (d.patient_name) {
        setIdentity({ patient_name: d.patient_name, request_reference: d.request_reference })
      }
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[ResultAccess] verify-password failed', err)
      setPwError('Network error. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  async function handleDownload() {
    if (!token) return
    setDownloading(true)
    try {
      const params = downloadGrant && downloadGrant !== 'none' ? `?grant=${downloadGrant}` : ''
      const resp = await fetch(`${ORIGIN}/r/${token}/download/${params}`)
      if (!resp.ok) {
        const body = await safeJson(resp)
        throw new Error(body?.error || 'Download failed. Please try again.')
      }
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `result_${identity?.request_reference || 'report'}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setDownloaded(true)
    } catch (e) {
      if (import.meta.env.DEV) console.warn('[ResultAccess] download failed', e)
      setError(e instanceof Error ? e.message : 'Download failed.')
    } finally {
      setDownloading(false)
    }
  }

  const verified = !!downloadGrant
  const needsPassword = meta?.password_required && !verified

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/40 p-4">
      {/* Decorative background blurs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in-scale">
        {/* Brand */}
        <div className="mb-6 flex justify-center">
          <img src={cytovaLogo} alt="Cytova" className="h-7" />
        </div>

        <Card className="shadow-xl shadow-primary/5 ring-1 ring-border/60">
          <CardContent className="px-8 py-10 space-y-6">
            {loading ? (
              <div className="flex flex-col items-center gap-4 py-4 animate-pulse-soft">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Verifying access...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-4 py-4 animate-fade-in">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
                  <ShieldAlert className="h-7 w-7 text-destructive" />
                </div>
                <div className="text-center space-y-1">
                  <h2 className="text-lg font-semibold">Access denied</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{error}</p>
                </div>
              </div>
            ) : meta ? (
              <>
                {/* Header */}
                <div className="flex flex-col items-center gap-3 animate-fade-in">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    {verified
                      ? <ShieldCheck className="h-7 w-7 text-primary" />
                      : <FileText className="h-7 w-7 text-primary" />}
                  </div>
                  <h2 className="text-xl font-semibold tracking-tight">
                    {verified ? 'Your result is verified' : 'Your result is ready'}
                  </h2>
                </div>

                {/* Identity — only after verification */}
                {identity && (
                  <div className="animate-fade-in animation-delay-100 rounded-xl bg-muted/50 px-4 py-3 text-center space-y-0.5">
                    <p className="text-sm font-medium">{identity.patient_name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{identity.request_reference}</p>
                  </div>
                )}

                {needsPassword ? (
                  <div className="space-y-4 animate-fade-in animation-delay-100">
                    <div className="flex items-center gap-2.5 text-sm font-medium">
                      <Lock className="h-4 w-4 text-primary" />
                      Enter your password to continue
                    </div>
                    {meta.password_hint && (
                      <p className="text-xs text-muted-foreground leading-relaxed rounded-xl bg-muted/50 px-3 py-2.5">
                        {meta.password_hint}
                      </p>
                    )}
                    <div className="relative">
                      <Input
                        type={showPw ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setPwError(null) }}
                        placeholder="Enter password"
                        className="pr-10 h-11"
                        onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {pwError && (
                      <p className="text-sm text-destructive animate-fade-in">{pwError}</p>
                    )}
                    <Button
                      className="w-full h-11 gap-2 text-sm font-medium"
                      onClick={handleVerify}
                      disabled={verifying || !password.trim()}
                    >
                      {verifying
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Lock className="h-4 w-4" />}
                      Verify
                    </Button>
                  </div>
                ) : (
                  <div className="animate-fade-in animation-delay-200 space-y-3">
                    <Button
                      size="lg"
                      className="w-full h-12 gap-2.5 text-sm font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow"
                      onClick={handleDownload}
                      disabled={downloading || downloaded || !meta.downloadable}
                    >
                      {downloading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : downloaded ? (
                        <ShieldCheck className="h-5 w-5" />
                      ) : (
                        <Download className="h-5 w-5" />
                      )}
                      {downloaded ? 'Downloaded' : 'Download Report PDF'}
                    </Button>
                    {downloaded && (
                      <p className="text-center text-xs text-muted-foreground animate-fade-in">
                        Your file has been downloaded. You can close this page.
                      </p>
                    )}
                  </div>
                )}

                {/* Expiry */}
                <div className="flex items-center justify-center gap-1.5 pt-2">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    Link expires {new Date(meta.expires_at).toLocaleDateString(undefined, {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </p>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground/60">
          Secured by Cytova · Healthcare data protection
        </p>
      </div>
    </div>
  )
}
