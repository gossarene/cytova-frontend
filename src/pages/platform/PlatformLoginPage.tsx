import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { Loader2, Shield } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/shared/FormField'
import { platformApi } from '@/lib/api/platform-client'
import { usePlatformAuthStore } from '@/lib/auth/platform-store'
import { ROUTES } from '@/config/routes'
import type { ApiResponse, ApiError } from '@/lib/api/types'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof schema>

interface PlatformLoginResponse {
  access_token: string
  token_type: string
  expires_in: number
  admin: { id: string; email: string }
}

export function PlatformLoginPage() {
  const navigate = useNavigate()
  const login = usePlatformAuthStore((s) => s.login)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: LoginForm) {
    setServerError(null)
    try {
      const resp = await platformApi.post<ApiResponse<PlatformLoginResponse>>('/auth/login/', data)
      const { access_token, admin } = resp.data.data
      login({
        access_token,
        refresh_token: '', // Platform uses long-lived tokens
        user: { id: admin.id, email: admin.email, role: 'PLATFORM_OWNER' },
      })
      navigate(ROUTES.PLATFORM_DASHBOARD, { replace: true })
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { errors?: ApiError[] }; status?: number } }
      if (axiosErr.response?.status === 401) {
        setServerError('Invalid credentials.')
      } else {
        setServerError('Unable to connect. Please try again.')
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
            <Shield className="h-6 w-6 text-amber-400" />
          </div>
          <h1 className="text-xl font-semibold text-white">Platform Admin</h1>
          <p className="text-sm text-slate-400">Cytova internal administration</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {serverError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {serverError}
                </div>
              )}

              <FormField label="Email" htmlFor="email" required error={errors.email?.message}>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@cytova.io"
                  autoComplete="email"
                  autoFocus
                  {...register('email')}
                />
              </FormField>

              <FormField label="Password" htmlFor="password" required error={errors.password?.message}>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register('password')}
                />
              </FormField>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign in
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
