import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import cytovaLogo from '@/assets/images/branding/cytova-logo.png'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'
import { verifyPatientEmail } from './patient/api'
import type { ApiError } from '@/lib/api/types'

type Status = 'verifying' | 'success' | 'error'

export function VerifyEmailPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [status, setStatus] = useState<Status>(token ? 'verifying' : 'error')
  const [message, setMessage] = useState<string | null>(
    token ? null : 'No verification token in the link.',
  )
  // Strict-mode + token-in-URL = the verify call runs twice unless we
  // gate it. The endpoint marks the token as used on first call, so the
  // second call would surface a misleading "invalid" error.
  const fired = useRef(false)

  useEffect(() => {
    if (!token || fired.current) return
    fired.current = true

    verifyPatientEmail(token)
      .then(() => setStatus('success'))
      .catch((err: unknown) => {
        const axiosErr = err as { response?: { data?: { errors?: ApiError[] } } }
        const apiMsg = axiosErr.response?.data?.errors?.[0]?.message
        setMessage(apiMsg ?? 'This verification link is invalid or has expired.')
        setStatus('error')
      })
  }, [token])

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-50/80 via-white to-white"
      />
      <div className="relative mx-auto max-w-md px-6 py-16 sm:py-24">
        <div className="mb-8 text-center">
          <Link to={ROUTES.HOME} className="inline-flex items-center justify-center">
            <img src={cytovaLogo} alt="Cytova" className="h-8" />
          </Link>
        </div>

        <Card className="border-slate-200/70 shadow-xl shadow-slate-900/[0.04]">
          <CardContent className="p-8">
            {status === 'verifying' && (
              <div className="flex flex-col items-center text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <h1 className="mt-4 text-lg font-semibold">Verifying your email…</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  This usually takes a moment.
                </p>
              </div>
            )}

            {status === 'success' && (
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h1 className="mt-4 text-xl font-semibold tracking-tight">
                  Your email has been verified
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  You can now sign in to your Cytova patient account.
                </p>
                <Link to={ROUTES.LOGIN_PATIENT} className="mt-6 block w-full">
                  <Button type="button" className="w-full">Go to sign in</Button>
                </Link>
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <h1 className="mt-4 text-xl font-semibold tracking-tight">
                  Invalid or expired link
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {message}
                </p>
                <Link to={ROUTES.LOGIN_PATIENT} className="mt-6 block w-full">
                  <Button type="button" variant="outline" className="w-full">
                    Go to sign in
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
