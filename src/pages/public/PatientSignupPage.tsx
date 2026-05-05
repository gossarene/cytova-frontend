import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import {
  Loader2, Eye, EyeOff, ArrowLeft, CheckCircle2, Copy, Check,
} from 'lucide-react'
import cytovaLogo from '@/assets/images/branding/cytova-logo.png'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/shared/FormField'
import { signupPatient, type PatientSignupResponse } from './patient/api'
import { ROUTES } from '@/config/routes'
import type { ApiError } from '@/lib/api/types'

const schema = z
  .object({
    first_name: z.string().min(1, 'First name is required').max(100),
    last_name: z.string().min(1, 'Last name is required').max(100),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(12, 'Password must be at least 12 characters'),
    confirm_password: z.string().min(1, 'Please confirm your password'),
    date_of_birth: z
      .string()
      .min(1, 'Date of birth is required')
      .refine((v) => !Number.isNaN(Date.parse(v)) && new Date(v) <= new Date(), {
        message: 'Date of birth cannot be in the future',
      }),
    phone: z
      .string()
      .max(50)
      .optional()
      .or(z.literal('')),
    accept_terms: z.boolean().refine((v) => v === true, {
      message: 'You must accept the terms to continue',
    }),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

type FormValues = z.infer<typeof schema>

function extractApiError(err: unknown): { message: string; field?: string } {
  const axiosErr = err as {
    response?: { data?: { errors?: ApiError[] }; status?: number }
  }
  const apiErrors = axiosErr.response?.data?.errors
  if (apiErrors?.length) {
    const first = apiErrors[0]
    return { message: first.message, field: first.field ?? undefined }
  }
  if (axiosErr.response?.status === 429) {
    return { message: 'Too many attempts. Please wait a moment and try again.' }
  }
  return { message: 'An unexpected error occurred. Please try again.' }
}

export function PatientSignupPage() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState<PatientSignupResponse | null>(null)

  const {
    register, handleSubmit, setError, formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      first_name: '', last_name: '', email: '',
      password: '', confirm_password: '',
      date_of_birth: '', phone: '',
      // Checkbox starts unchecked; the schema's ``refine(v => v === true)``
      // surfaces the "must accept" error only after the user submits.
      accept_terms: false,
    },
  })

  const [showPassword, setShowPassword] = useState(false)

  async function onSubmit(values: FormValues) {
    setServerError(null)
    try {
      const res = await signupPatient({
        email: values.email.trim(),
        password: values.password,
        confirm_password: values.confirm_password,
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        date_of_birth: values.date_of_birth,
        phone: values.phone || undefined,
        accept_terms: values.accept_terms,
      })
      setSuccess(res)
    } catch (err) {
      const { message, field } = extractApiError(err)
      // If the backend pinned the error to a known form field, route
      // it through react-hook-form so the field-level error renders
      // instead of just a banner.
      if (field && field in values) {
        setError(field as keyof FormValues, { type: 'server', message })
      } else {
        setServerError(message)
      }
    }
  }

  if (success) {
    return (
      <PageShell>
        <SuccessCard data={success} />
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-xl">
        <Header />

        <Card className="mt-6 border-slate-200/70 shadow-xl shadow-slate-900/[0.04]">
          <CardContent className="p-7 sm:p-9">
            {serverError && (
              <div
                role="alert"
                className="mb-5 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
              >
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="First name" htmlFor="first_name" required error={errors.first_name?.message}>
                  <Input id="first_name" placeholder="Ada" autoComplete="given-name" autoFocus {...register('first_name')} />
                </FormField>
                <FormField label="Last name" htmlFor="last_name" required error={errors.last_name?.message}>
                  <Input id="last_name" placeholder="Lovelace" autoComplete="family-name" {...register('last_name')} />
                </FormField>
              </div>

              <FormField label="Email" htmlFor="email" required error={errors.email?.message}
                hint="You'll use this email to sign in.">
                <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...register('email')} />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Date of birth" htmlFor="date_of_birth" required error={errors.date_of_birth?.message}>
                  <Input id="date_of_birth" type="date" {...register('date_of_birth')} />
                </FormField>
                <FormField label="Phone" htmlFor="phone" error={errors.phone?.message}
                  hint="Optional.">
                  <Input id="phone" type="tel" placeholder="+33 6 12 34 56 78" autoComplete="tel" {...register('phone')} />
                </FormField>
              </div>

              <FormField label="Password" htmlFor="password" required error={errors.password?.message}
                hint="Minimum 12 characters. Mix letters, numbers, and symbols.">
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Choose a strong password"
                    autoComplete="new-password"
                    className="pr-10"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormField>

              <FormField label="Confirm password" htmlFor="confirm_password" required error={errors.confirm_password?.message}>
                <Input
                  id="confirm_password"
                  type="password"
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  {...register('confirm_password')}
                />
              </FormField>

              <div className="space-y-1">
                <label className="flex items-start gap-2.5 text-sm">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                    {...register('accept_terms')}
                  />
                  <span className="text-muted-foreground">
                    I accept the{' '}
                    <a href="#" className="text-primary hover:underline">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
                  </span>
                </label>
                {errors.accept_terms?.message && (
                  <p className="pl-6 text-xs text-destructive">{errors.accept_terms.message as string}</p>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
                <Link
                  to={ROUTES.SIGNUP}
                  className="inline-flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to account choice
                </Link>
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create personal account
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to={ROUTES.LOGIN} className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </PageShell>
  )
}

// ============================================================================
// Layout + success card
// ============================================================================

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-50/80 via-white to-white"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-[28rem] w-[40rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
      />
      <div className="relative mx-auto max-w-7xl px-6 py-16 sm:py-20">
        {children}
      </div>
    </div>
  )
}

function Header() {
  return (
    <div className="mb-10 text-center">
      <Link to={ROUTES.HOME} className="inline-flex items-center justify-center">
        <img src={cytovaLogo} alt="Cytova" className="h-8" />
      </Link>
      <h1 className="mt-8 text-3xl font-semibold tracking-tighter sm:text-4xl">
        Create your personal account
      </h1>
      <p className="mt-3 text-base text-muted-foreground">
        Access your lab results securely from one patient space.
      </p>
    </div>
  )
}

function SuccessCard({ data }: { data: PatientSignupResponse }) {
  const [copied, setCopied] = useState(false)

  function copyId() {
    navigator.clipboard.writeText(data.cytova_patient_id).then(
      () => {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2000)
      },
      () => { /* clipboard blocked — silent */ },
    )
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-10 text-center">
        <Link to={ROUTES.HOME} className="inline-flex items-center justify-center">
          <img src={cytovaLogo} alt="Cytova" className="h-8" />
        </Link>
      </div>

      <Card className="border-slate-200/70 shadow-xl shadow-slate-900/[0.04]">
        <CardContent className="p-7 sm:p-9">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold tracking-tight">
              Your patient account has been created.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Welcome to Cytova, {data.email}.
            </p>
          </div>

          <div className="mt-7 rounded-xl border border-slate-200 bg-slate-50/80 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Your Cytova ID
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="font-mono text-2xl font-semibold tracking-tight text-foreground">
                {data.cytova_patient_id}
              </span>
              <Button
                type="button" variant="outline" size="sm" onClick={copyId}
                className="gap-1.5"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Keep this ID. You can share it with a laboratory to receive
              results in your Cytova patient space.
            </p>
          </div>

          <div className="mt-7 space-y-3">
            <p className="text-center text-sm text-muted-foreground">
              We've sent you a verification email. Please open the link in your
              inbox to activate your account before signing in.
            </p>
            <Link to={ROUTES.LOGIN} className="block w-full">
              <Button type="button" className="w-full">Go to sign in</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
