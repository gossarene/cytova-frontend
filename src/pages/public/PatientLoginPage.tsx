import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import cytovaLogo from '@/assets/images/branding/cytova-logo.png'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/shared/FormField'
import { ROUTES } from '@/config/routes'
import { loginPatient } from './patient/api'
import { usePatientAuthStore } from '@/lib/auth/patient-store'
import type { ApiError } from '@/lib/api/types'

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = z.infer<typeof schema>

interface ApiErrorShape {
  response?: { data?: { errors?: ApiError[] }; status?: number }
}

function extractError(err: unknown): { message: string; code?: string } {
  const axiosErr = err as ApiErrorShape
  const apiErrors = axiosErr.response?.data?.errors
  if (apiErrors?.length) {
    const first = apiErrors[0]
    return { message: first.message, code: first.code }
  }
  if (axiosErr.response?.status === 429) {
    return { message: 'Too many attempts. Please wait a moment and try again.' }
  }
  return { message: 'An unexpected error occurred. Please try again.' }
}

export function PatientLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setSession = usePatientAuthStore((s) => s.login)

  const [serverError, setServerError] = useState<string | null>(null)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register, handleSubmit, formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    setNeedsVerification(false)
    try {
      const session = await loginPatient(values)
      setSession(session)
      // Honour ?from redirect (set by PatientAuthGuard) when present.
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname
      navigate(from || ROUTES.PATIENT_DASHBOARD, { replace: true })
    } catch (err) {
      const { message, code } = extractError(err)
      if (code === 'EMAIL_NOT_VERIFIED') {
        setNeedsVerification(true)
        setServerError(null)
      } else {
        setServerError(message)
      }
    }
  }

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
          <h1 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">
            Sign in to your patient account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Access your lab results securely from one patient space.
          </p>
        </div>

        <Card className="border-slate-200/70 shadow-xl shadow-slate-900/[0.04]">
          <CardContent className="p-7 sm:p-8">
            {serverError && (
              <div
                role="alert"
                className="mb-5 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
              >
                {serverError}
              </div>
            )}
            {needsVerification && (
              <div
                role="alert"
                className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
              >
                Your email isn't verified yet. Please open the link we sent to
                your inbox to activate your account.
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
              <FormField label="Email" htmlFor="email" required error={errors.email?.message}>
                <Input
                  id="email" type="email" autoComplete="email" autoFocus
                  placeholder="you@example.com"
                  {...register('email')}
                />
              </FormField>

              <FormField label="Password" htmlFor="password" required error={errors.password?.message}>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="pr-10"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormField>

              <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Sign in
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 flex flex-col items-center gap-2 text-sm text-muted-foreground">
          <p>
            New to Cytova?{' '}
            <Link to={ROUTES.SIGNUP_PATIENT} className="font-medium text-primary hover:underline">
              Create a personal account
            </Link>
          </p>
          <p>
            <Link to={ROUTES.SIGNUP} className="hover:text-foreground">
              Looking for a laboratory account?
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
