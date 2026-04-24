import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Download, Loader2, ShieldAlert, FileText, Lock, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

// Public /r/ endpoints live at the server root, not under /api/v1/.
const API_BASE = import.meta.env.VITE_API_BASE_URL || ''
const ORIGIN = API_BASE.replace(/\/api\/v1\/?$/, '')

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

  useEffect(() => {
    if (!token) return
    fetch(`${ORIGIN}/r/${token}/`)
      .then(async (resp) => {
        if (!resp.ok) {
          const body = await resp.json().catch(() => ({}))
          throw new Error(body.error || 'This link is invalid or has expired.')
        }
        const json = await resp.json()
        setMeta(json.data ?? json)
      })
      .catch((e) => setError(e.message))
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
      const body = await resp.json()
      if (!resp.ok) {
        let msg = body.error || 'Verification failed.'
        if (body.remaining_attempts !== undefined && body.remaining_attempts > 0) {
          msg += ` (${body.remaining_attempts} attempt${body.remaining_attempts === 1 ? '' : 's'} remaining)`
        }
        if (body.retry_after !== undefined) {
          const mins = Math.ceil(body.retry_after / 60)
          msg = `Too many failed attempts. Please try again in ${mins} minute${mins === 1 ? '' : 's'}.`
        }
        setPwError(msg)
        return
      }
      const d = body.data ?? body
      setDownloadGrant(d.download_grant ?? 'none')
      if (d.patient_name) {
        setIdentity({
          patient_name: d.patient_name,
          request_reference: d.request_reference,
        })
      }
    } catch {
      setPwError('Network error. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  async function handleDownload() {
    if (!token) return
    setDownloading(true)
    try {
      const params = downloadGrant && downloadGrant !== 'none'
        ? `?grant=${downloadGrant}` : ''
      const resp = await fetch(`${ORIGIN}/r/${token}/download/${params}`)
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}))
        throw new Error(body.error || 'Download failed.')
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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Download failed.')
    } finally {
      setDownloading(false)
    }
  }

  const verified = !!downloadGrant
  const needsPassword = meta?.password_required && !verified

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="py-10 text-center space-y-6">
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Verifying access...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3">
              <ShieldAlert className="h-10 w-10 text-destructive" />
              <h2 className="text-lg font-semibold">Access denied</h2>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ) : meta ? (
            <>
              <FileText className="mx-auto h-12 w-12 text-primary" />
              <h2 className="text-xl font-semibold">Your result is ready</h2>

              {/* Patient identity — only after verification */}
              {identity && (
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>{identity.patient_name}</p>
                  <p>Reference: {identity.request_reference}</p>
                </div>
              )}

              {needsPassword ? (
                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Lock className="h-4 w-4" />
                    Enter your password to access the report
                  </div>
                  {meta.password_hint && (
                    <p className="text-xs text-muted-foreground">{meta.password_hint}</p>
                  )}
                  <div className="relative">
                    <Input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setPwError(null) }}
                      placeholder="Enter password"
                      className="pr-10"
                      onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      tabIndex={-1}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {pwError && (
                    <p className="text-sm text-destructive">{pwError}</p>
                  )}
                  <Button
                    className="w-full gap-2"
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
                <Button
                  size="lg" className="gap-2 w-full"
                  onClick={handleDownload}
                  disabled={downloading || !meta.downloadable}
                >
                  {downloading
                    ? <Loader2 className="h-5 w-5 animate-spin" />
                    : <Download className="h-5 w-5" />}
                  Download Report PDF
                </Button>
              )}

              <p className="text-xs text-muted-foreground">
                This link expires on {new Date(meta.expires_at).toLocaleDateString()}.
              </p>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
