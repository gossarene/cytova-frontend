import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Eye, EyeOff, ArrowLeft, ArrowRight, Check } from 'lucide-react'
import cytovaLogo from '@/assets/images/branding/cytova-logo.png'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/shared/FormField'
import { PhoneInput } from '@/components/shared/PhoneInput'
import { SlugInput } from './signup/SlugInput'
import { CountrySelect } from './signup/CountrySelect'
import { PasswordStrength } from './signup/PasswordStrength'
import { SignupSuccess } from './signup/SignupSuccess'
import { VerifyEmailStep } from './signup/VerifyEmailStep'
import {
  startOnboarding, verifyEmail, resendCode, completeOnboarding,
  type SignupResponse, type OnboardingRegistration,
} from './signup/api'
import { ROUTES } from '@/config/routes'
import type { ApiError } from '@/lib/api/types'
import { cn } from '@/lib/utils'

// ============================================================================
// Validation schemas — one per step group
// ============================================================================

const identitySchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Please enter a valid email address'),
  phone: z
    .string()
    .min(5, 'Please enter a valid phone number')
    .max(30, 'Phone must be at most 30 characters')
    .regex(/^\+?[\d\s().\-]{5,30}$/, 'Use digits, spaces, +, -, (), . — 5 to 30 characters'),
})
type IdentityForm = z.infer<typeof identitySchema>

const labSchema = z.object({
  laboratory_name: z
    .string()
    .min(2, 'Laboratory name must be at least 2 characters')
    .max(255),
  country: z.string().length(2, 'Please select a country'),
  city: z.string().min(2, 'City is required').max(120),
  slug: z
    .string()
    .min(3, 'Identifier must be at least 3 characters')
    .max(63)
    .regex(
      /^[a-z][a-z0-9-]*[a-z0-9]$/,
      'Must start with a letter, contain only lowercase letters, digits, and hyphens, and not end with a hyphen',
    )
    .optional()
    .or(z.literal('')),
})
type LabForm = z.infer<typeof labSchema>

const securitySchema = z
  .object({
    password: z.string().min(12, 'Password must be at least 12 characters'),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })
type SecurityForm = z.infer<typeof securitySchema>

// ============================================================================
// Persistence — refresh-safe state in localStorage
// ============================================================================

type StepNumber = 1 | 2 | 3 | 4

const STORAGE_KEY = 'cytova:onboarding:v1'

interface PersistedState {
  registration_id: string
  email: string
  status: OnboardingRegistration['status']
  step: StepNumber
  identity?: IdentityForm
  lab?: LabForm
}

function loadState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.registration_id || typeof parsed.email !== 'string') return null
    return parsed
  } catch {
    return null
  }
}

function saveState(state: PersistedState | null) {
  try {
    if (state) localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Quota or privacy mode — degrade silently. The page still works without
    // resume; the user just has to start over on refresh.
  }
}

// Slugify mirroring the backend `_slugify` for the workspace URL preview.
function slugifyClient(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63)
    .replace(/-+$/, '')
}

function extractFieldError(err: unknown): { message: string; field?: string } {
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

// ============================================================================
// Top-level page
// ============================================================================

export function SignupPage() {
  const navigate = useNavigate()
  const [state, setState] = useState<PersistedState | null>(() => loadState())
  const [step, setStep] = useState<StepNumber>(() => state?.step ?? 1)
  const [serverError, setServerError] = useState<string | null>(null)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<SignupResponse | null>(null)

  // Persist whenever core state changes.
  useEffect(() => {
    if (state) saveState({ ...state, step })
  }, [state, step])

  function patchState(partial: Partial<PersistedState>) {
    setState((prev) => {
      const next: PersistedState = { ...(prev as PersistedState), ...partial }
      return next
    })
  }

  function clearState() {
    saveState(null)
    setState(null)
  }

  // ---- Step transitions ----

  async function submitIdentity(values: IdentityForm) {
    setServerError(null)
    try {
      const reg = await startOnboarding(values)
      const next: PersistedState = {
        registration_id: reg.registration_id,
        email: reg.email,
        status: reg.status,
        step: reg.status === 'EMAIL_VERIFIED' ? 3 : 2,
        identity: values,
        lab: state?.lab,
      }
      setState(next)
      setStep(next.step)
    } catch (err) {
      setServerError(extractFieldError(err).message)
    }
  }

  async function submitVerifyCode(code: string) {
    if (!state) return
    setVerifyError(null)
    try {
      const reg = await verifyEmail({ registration_id: state.registration_id, code })
      patchState({ status: reg.status })
      setStep(3)
    } catch (err) {
      setVerifyError(extractFieldError(err).message)
      throw err
    }
  }

  async function submitResend() {
    if (!state) return
    setVerifyError(null)
    try {
      await resendCode({ registration_id: state.registration_id })
    } catch (err) {
      setVerifyError(extractFieldError(err).message)
      throw err
    }
  }

  function submitLab(values: LabForm) {
    patchState({ lab: values })
    setStep(4)
  }

  async function submitFinal(values: SecurityForm) {
    if (!state || !state.lab) return
    setServerError(null)
    try {
      const result = await completeOnboarding({
        registration_id: state.registration_id,
        laboratory_name: state.lab.laboratory_name,
        country: state.lab.country,
        city: state.lab.city,
        slug: state.lab.slug || undefined,
        password: values.password,
      })
      clearState()
      setSuccessData(result)
    } catch (err) {
      const { message } = extractFieldError(err)
      setServerError(message)
    }
  }

  function goBack() {
    setServerError(null)
    setVerifyError(null)
    if (step > 1) setStep((step - 1) as StepNumber)
  }

  function goToTenant() {
    if (!successData) return
    // Cross-host navigation — full page load to the tenant subdomain.
    window.location.href = `${window.location.protocol}//${successData.domain}`
  }

  // ---- Render ----

  if (successData) {
    return (
      <PageShell>
        <SignupSuccess data={successData} onGoToLab={goToTenant} />
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-xl">
        <Header />
        <StepIndicator step={step} />

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

            {step === 1 && (
              <Step1Identity
                defaultValues={state?.identity}
                onSubmit={submitIdentity}
              />
            )}
            {step === 2 && state && (
              <VerifyEmailStep
                email={state.email}
                onVerify={submitVerifyCode}
                onResend={submitResend}
                error={verifyError}
              />
            )}
            {step === 2 && state && (
              <BackOnly onBack={goBack} />
            )}
            {step === 3 && (
              <Step3Lab
                defaultValues={state?.lab}
                onBack={goBack}
                onSubmit={submitLab}
              />
            )}
            {step === 4 && state && (
              <Step4Security
                email={state.email}
                onBack={goBack}
                onSubmit={submitFinal}
              />
            )}
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to={ROUTES.LOGIN} className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>

        {state && step !== 1 && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => { clearState(); setStep(1); navigate(0) }}
              className="hover:underline"
            >
              Start over with a different email
            </button>
          </p>
        )}
      </div>
    </PageShell>
  )
}

// ============================================================================
// Layout primitives
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
        Create your laboratory
      </h1>
      <p className="mt-3 text-base text-muted-foreground">
        Set up your workspace in minutes. Free trial — no credit card required.
      </p>
    </div>
  )
}

function StepIndicator({ step }: { step: StepNumber }) {
  const steps = [
    { n: 1 as const, label: 'Identity' },
    { n: 2 as const, label: 'Verify' },
    { n: 3 as const, label: 'Laboratory' },
    { n: 4 as const, label: 'Security' },
  ]
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {steps.map((s, i) => {
        const isActive = step === s.n
        const isComplete = step > s.n
        return (
          <div key={s.n} className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all',
                  isComplete && 'bg-primary text-primary-foreground',
                  isActive && 'bg-primary text-primary-foreground ring-4 ring-primary/15',
                  !isActive && !isComplete && 'bg-slate-100 text-muted-foreground',
                )}
              >
                {isComplete ? <Check className="h-4 w-4" /> : s.n}
              </div>
              <span
                className={cn(
                  'hidden text-sm font-medium transition-colors sm:inline',
                  (isActive || isComplete) ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'h-px w-6 transition-colors sm:w-10',
                  isComplete ? 'bg-primary/40' : 'bg-slate-200',
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function BackOnly({ onBack }: { onBack: () => void }) {
  return (
    <div className="mt-6 flex justify-start">
      <Button type="button" variant="outline" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
    </div>
  )
}

// ============================================================================
// Step 1 — Identity
// ============================================================================

function Step1Identity({
  defaultValues,
  onSubmit,
}: {
  defaultValues?: IdentityForm
  onSubmit: (values: IdentityForm) => Promise<void>
}) {
  const {
    register, control, handleSubmit, formState: { errors, isSubmitting },
  } = useForm<IdentityForm>({
    resolver: zodResolver(identitySchema),
    mode: 'onTouched',
    defaultValues: defaultValues ?? {
      first_name: '', last_name: '', email: '', phone: '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Your information</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We'll send a verification code to your email.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="First name" htmlFor="first_name" required error={errors.first_name?.message}>
          <Input id="first_name" placeholder="Alice" autoComplete="given-name" autoFocus {...register('first_name')} />
        </FormField>
        <FormField label="Last name" htmlFor="last_name" required error={errors.last_name?.message}>
          <Input id="last_name" placeholder="Dupont" autoComplete="family-name" {...register('last_name')} />
        </FormField>
      </div>

      <FormField
        label="Admin email"
        htmlFor="email"
        required
        error={errors.email?.message}
        hint="You'll use this email to sign in to your laboratory."
      >
        <Input
          id="email"
          type="email"
          placeholder="admin@yourlaboratory.com"
          autoComplete="email"
          {...register('email')}
        />
      </FormField>

      <FormField
        label="Phone"
        htmlFor="phone"
        required
        error={errors.phone?.message}
      >
        <Controller
          control={control}
          name="phone"
          render={({ field }) => (
            <PhoneInput
              id="phone"
              value={field.value}
              onChange={(v) => {
                field.onChange(v)
                if (v) field.onBlur()
              }}
            />
          )}
        />
      </FormField>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isSubmitting} className="gap-2">
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}

// ============================================================================
// Step 3 — Lab info
// ============================================================================

function Step3Lab({
  defaultValues,
  onBack,
  onSubmit,
}: {
  defaultValues?: LabForm
  onBack: () => void
  onSubmit: (values: LabForm) => void
}) {
  const {
    register, watch, setValue, handleSubmit, formState: { errors },
  } = useForm<LabForm>({
    resolver: zodResolver(labSchema),
    mode: 'onTouched',
    defaultValues: defaultValues ?? {
      laboratory_name: '', country: '', city: '', slug: '',
    },
  })

  const labName = watch('laboratory_name')
  const country = watch('country') ?? ''
  const slug = watch('slug') ?? ''
  const [slugTouched, setSlugTouched] = useState(!!defaultValues?.slug)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)

  // Auto-suggest slug from lab name until user edits it manually.
  useEffect(() => {
    if (slugTouched) return
    const suggested = slugifyClient(labName ?? '')
    if (suggested !== slug) setValue('slug', suggested, { shouldValidate: false })
  }, [labName, slugTouched, setValue, slug])

  function handleSlugChange(next: string) {
    setSlugTouched(true)
    setValue('slug', next, { shouldValidate: next.length >= 3, shouldTouch: true })
  }

  function onValid(values: LabForm) {
    if (values.slug && slugAvailable === false) return
    onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Laboratory information</h2>
        <p className="mt-1 text-sm text-muted-foreground">Tell us a bit about your laboratory.</p>
      </div>

      <FormField label="Laboratory name" htmlFor="laboratory_name" required error={errors.laboratory_name?.message}>
        <Input id="laboratory_name" placeholder="City Hospital Labs" autoFocus {...register('laboratory_name')} />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Country" htmlFor="country" required error={errors.country?.message}>
          <CountrySelect
            id="country"
            value={country}
            onChange={(v) => setValue('country', v, { shouldValidate: true, shouldTouch: true })}
            invalid={!!errors.country}
          />
        </FormField>
        <FormField label="City" htmlFor="city" required error={errors.city?.message}>
          <Input id="city" placeholder="Paris" {...register('city')} />
        </FormField>
      </div>

      <FormField
        label="Workspace identifier"
        htmlFor="slug"
        error={errors.slug?.message}
        hint="We'll suggest one based on your lab name. You can adjust it."
      >
        <SlugInput
          value={slug}
          onChange={handleSlugChange}
          onAvailabilityChange={setSlugAvailable}
          error={errors.slug?.message}
        />
      </FormField>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
        <Button type="button" variant="outline" onClick={onBack} className="gap-2 sm:w-auto">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button type="submit" className="gap-2 sm:w-auto">
          Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}

// ============================================================================
// Step 4 — Security (email read-only)
// ============================================================================

function Step4Security({
  email,
  onBack,
  onSubmit,
}: {
  email: string
  onBack: () => void
  onSubmit: (values: SecurityForm) => Promise<void>
}) {
  const {
    register, watch, handleSubmit, formState: { errors, isSubmitting },
  } = useForm<SecurityForm>({
    resolver: zodResolver(securitySchema),
    mode: 'onTouched',
    defaultValues: { password: '', confirm_password: '' },
  })
  const [showPassword, setShowPassword] = useState(false)
  const password = watch('password')

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Secure your account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a strong password — you can change it any time.
        </p>
      </div>

      <FormField label="Admin email" htmlFor="email_readonly">
        <Input id="email_readonly" value={email} readOnly disabled />
      </FormField>

      <FormField
        label="Password"
        htmlFor="password"
        required
        error={errors.password?.message}
        hint="Minimum 12 characters. Mix letters, numbers, and symbols for best strength."
      >
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Choose a strong password"
            autoComplete="new-password"
            autoFocus
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
        <PasswordStrength password={password} />
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

      <p className="text-xs text-muted-foreground">
        By creating an account, you agree to our{' '}
        <a href="#" className="text-primary hover:underline">Terms of Service</a>{' '}
        and{' '}
        <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
      </p>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
        <Button type="button" variant="outline" onClick={onBack} className="gap-2 sm:w-auto">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button type="submit" disabled={isSubmitting} className="gap-2 sm:w-auto">
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Create laboratory
        </Button>
      </div>
    </form>
  )
}
