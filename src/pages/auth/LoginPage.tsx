import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { FormField } from '@/components/shared/FormField'
import { api } from '@/lib/api/client'
import { useAuthStore } from '@/lib/auth/store'
import type { ApiResponse, ApiError } from '@/lib/api/types'
import type { LoginResponse } from '@/lib/auth/types'
import { ROUTES } from '@/config/routes'

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

// Map backend error codes to user-friendly messages
const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'Invalid email or password. Please try again.',
  ACCOUNT_DISABLED: 'This account has been deactivated. Contact your lab administrator.',
  ACCOUNT_LOCKED: 'Too many failed attempts. Please try again later.',
  SUBSCRIPTION_EXPIRED: 'Your laboratory subscription has expired. Contact support.',
  SUBSCRIPTION_SUSPENDED: 'Your laboratory has been suspended. Contact support.',
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((s) => s.login)
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginForm) {
    setServerError(null)
    try {
      const response = await api.post<ApiResponse<LoginResponse>>('/auth/login/', data)
      login(response.data.data)

      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || ROUTES.DASHBOARD
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { errors?: ApiError[] }; status?: number }
      }

      const status = axiosError.response?.status
      const apiErrors = axiosError.response?.data?.errors

      if (apiErrors?.length) {
        const code = apiErrors[0].code
        setServerError(
          ERROR_MESSAGES[code] || apiErrors[0].message || 'Authentication failed.',
        )
      } else if (status === 401) {
        setServerError('Invalid email or password. Please try again.')
      } else if (status === 429) {
        setServerError('Too many login attempts. Please wait a moment and try again.')
      } else if (status === 403) {
        setServerError('Access to this laboratory has been restricted. Contact support.')
      } else {
        setServerError('Unable to connect to the server. Please check your connection and try again.')
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Enter your credentials to access your laboratory workspace.
        </p>
      </div>

      {/* Error banner */}
      {serverError && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{serverError}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          label="Email address"
          htmlFor="email"
          required
          error={errors.email?.message}
        >
          <Input
            id="email"
            type="email"
            placeholder="you@laboratory.io"
            autoComplete="email"
            autoFocus
            {...register('email')}
          />
        </FormField>

        <FormField
          label="Password"
          htmlFor="password"
          required
          error={errors.password?.message}
        >
          <div className="space-y-1.5">
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="pr-10"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex justify-end">
              <Link
                to={ROUTES.FORGOT_PASSWORD}
                className="text-xs text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </div>
        </FormField>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </Button>
      </form>

      <Separator />

      {/* Footer links */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          Don't have a laboratory yet?{' '}
          <Link to={ROUTES.SIGNUP} className="font-medium text-primary hover:underline">
            Create one for free
          </Link>
        </p>
      </div>
    </div>
  )
}
