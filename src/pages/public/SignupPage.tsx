import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Loader2, Microscope, Eye, EyeOff } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { FormField } from '@/components/shared/FormField'
import { SlugInput } from './signup/SlugInput'
import { PasswordStrength } from './signup/PasswordStrength'
import { SignupSuccess } from './signup/SignupSuccess'
import { signup, type SignupResponse } from './signup/api'
import { ROUTES } from '@/config/routes'
import type { ApiError } from '@/lib/api/types'

// -- Validation schema matching backend rules --

const signupSchema = z.object({
  laboratory_name: z
    .string()
    .min(2, 'Laboratory name must be at least 2 characters')
    .max(255, 'Laboratory name must be at most 255 characters'),
  slug: z
    .string()
    .min(3, 'Identifier must be at least 3 characters')
    .max(63, 'Identifier must be at most 63 characters')
    .regex(
      /^[a-z][a-z0-9-]*[a-z0-9]$/,
      'Must start with a letter, contain only lowercase letters, digits, and hyphens, and not end with a hyphen',
    )
    .optional()
    .or(z.literal('')),
  admin_email: z
    .string()
    .email('Please enter a valid email address'),
  admin_first_name: z
    .string()
    .min(1, 'First name is required')
    .max(100),
  admin_last_name: z
    .string()
    .min(1, 'Last name is required')
    .max(100),
  admin_password: z
    .string()
    .min(12, 'Password must be at least 12 characters'),
  confirm_password: z
    .string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.admin_password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

type SignupForm = z.infer<typeof signupSchema>

export function SignupPage() {
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<SignupResponse | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      laboratory_name: '',
      slug: '',
      admin_email: '',
      admin_first_name: '',
      admin_last_name: '',
      admin_password: '',
      confirm_password: '',
    },
  })

  const password = watch('admin_password')
  const slug = watch('slug')

  async function onSubmit(data: SignupForm) {
    if (slug && slugAvailable === false) {
      setError('slug', { message: 'This identifier is not available' })
      return
    }

    setServerError(null)
    try {
      const result = await signup({
        laboratory_name: data.laboratory_name,
        slug: data.slug || undefined,
        admin_email: data.admin_email,
        admin_first_name: data.admin_first_name,
        admin_last_name: data.admin_last_name,
        admin_password: data.admin_password,
      })
      setSuccessData(result)
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { errors?: ApiError[] }; status?: number }
      }
      const apiErrors = axiosErr.response?.data?.errors
      if (apiErrors?.length) {
        // Map field-level errors to form fields
        let hasFieldError = false
        for (const apiError of apiErrors) {
          if (apiError.field) {
            const fieldName = apiError.field as keyof SignupForm
            setError(fieldName, { message: apiError.message })
            hasFieldError = true
          }
        }
        if (!hasFieldError) {
          setServerError(apiErrors[0].message)
        }
      } else if (axiosErr.response?.status === 429) {
        setServerError('Too many signup attempts. Please wait a moment and try again.')
      } else {
        setServerError('An error occurred during signup. Please try again.')
      }
    }
  }

  // -- Success state --
  if (successData) {
    return (
      <div className="bg-gradient-to-b from-primary/5 to-background py-16">
        <div className="mx-auto max-w-7xl px-6">
          <SignupSuccess data={successData} />
        </div>
      </div>
    )
  }

  // -- Signup form --
  return (
    <div className="bg-gradient-to-b from-primary/5 to-background py-16">
      <div className="mx-auto max-w-xl px-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Microscope className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Create your laboratory</h1>
          <p className="mt-2 text-muted-foreground">
            Set up your workspace in minutes. Free trial, no credit card required.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Laboratory Information</CardTitle>
            <CardDescription>
              This will configure your dedicated workspace on Cytova.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {serverError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {serverError}
                </div>
              )}

              {/* Lab details */}
              <FormField
                label="Laboratory name"
                htmlFor="laboratory_name"
                required
                error={errors.laboratory_name?.message}
                hint="The display name for your laboratory (e.g., City Hospital Labs)."
              >
                <Input
                  id="laboratory_name"
                  placeholder="City Hospital Labs"
                  autoFocus
                  {...register('laboratory_name')}
                />
              </FormField>

              <FormField
                label="Workspace identifier"
                htmlFor="slug"
                error={errors.slug?.message}
                hint="Choose a URL-friendly identifier. Leave blank to auto-generate from your lab name."
              >
                <SlugInput
                  value={slug || ''}
                  onChange={(v) => setValue('slug', v, { shouldValidate: v.length >= 3 })}
                  onAvailabilityChange={setSlugAvailable}
                  error={errors.slug?.message}
                />
              </FormField>

              <Separator />

              {/* Admin account */}
              <div>
                <h3 className="text-sm font-semibold mb-1">Administrator Account</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  This will be the first Lab Admin user with full access to your workspace.
                </p>

                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      label="First name"
                      htmlFor="admin_first_name"
                      required
                      error={errors.admin_first_name?.message}
                    >
                      <Input
                        id="admin_first_name"
                        placeholder="Alice"
                        {...register('admin_first_name')}
                      />
                    </FormField>

                    <FormField
                      label="Last name"
                      htmlFor="admin_last_name"
                      required
                      error={errors.admin_last_name?.message}
                    >
                      <Input
                        id="admin_last_name"
                        placeholder="Dupont"
                        {...register('admin_last_name')}
                      />
                    </FormField>
                  </div>

                  <FormField
                    label="Admin email"
                    htmlFor="admin_email"
                    required
                    error={errors.admin_email?.message}
                    hint="You'll use this email to sign in to your laboratory."
                  >
                    <Input
                      id="admin_email"
                      type="email"
                      placeholder="admin@yourlaboratory.com"
                      autoComplete="email"
                      {...register('admin_email')}
                    />
                  </FormField>

                  <FormField
                    label="Password"
                    htmlFor="admin_password"
                    required
                    error={errors.admin_password?.message}
                    hint="Minimum 12 characters. Use a mix of letters, numbers, and symbols."
                  >
                    <div className="relative">
                      <Input
                        id="admin_password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Choose a strong password"
                        autoComplete="new-password"
                        className="pr-10"
                        {...register('admin_password')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <PasswordStrength password={password} />
                  </FormField>

                  <FormField
                    label="Confirm password"
                    htmlFor="confirm_password"
                    required
                    error={errors.confirm_password?.message}
                  >
                    <Input
                      id="confirm_password"
                      type="password"
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                      {...register('confirm_password')}
                    />
                  </FormField>
                </div>
              </div>

              <Separator />

              {/* Terms */}
              <p className="text-xs text-muted-foreground">
                By creating an account, you agree to our{' '}
                <a href="#" className="text-primary hover:underline">Terms of Service</a>{' '}
                and{' '}
                <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
              </p>

              {/* Submit */}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Laboratory
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to={ROUTES.LOGIN} className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
