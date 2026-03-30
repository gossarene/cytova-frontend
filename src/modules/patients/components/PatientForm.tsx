import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { FormField } from '@/components/shared/FormField'
import { GENDER_OPTIONS } from '../types'
import type { ApiError } from '@/lib/api/types'

const formSchema = z.object({
  national_id: z.string().max(100).optional().or(z.literal('')),
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], { message: 'Gender is required' }),
  phone: z.string().max(30).optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  insurance_number: z.string().max(100).optional().or(z.literal('')),
})

export type PatientFormData = z.infer<typeof formSchema>

interface PatientFormProps {
  mode: 'create' | 'edit'
  defaultValues?: Partial<PatientFormData>
  onSubmit: (data: PatientFormData) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
}

export function PatientForm({
  mode,
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
}: PatientFormProps) {
  // For create mode, national_id is required via custom validation
  const schema = mode === 'create'
    ? formSchema.refine((d) => !!d.national_id, { message: 'National ID is required', path: ['national_id'] })
    : formSchema

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<PatientFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      national_id: '',
      first_name: '',
      last_name: '',
      date_of_birth: '',
      gender: undefined,
      phone: '',
      email: '',
      address: '',
      insurance_number: '',
      ...defaultValues,
    },
  })

  async function handleFormSubmit(data: PatientFormData) {
    try {
      await onSubmit(data)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { errors?: ApiError[] } } }
      const apiErrors = axiosErr.response?.data?.errors
      if (apiErrors) {
        for (const e of apiErrors) {
          if (e.field) {
            setError(e.field as keyof PatientFormData, { message: e.message })
          }
        }
      }
      throw err // Re-throw so the caller knows it failed
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Identity section */}
      <div>
        <h3 className="text-sm font-semibold mb-1">Identity</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Core identification fields.{mode === 'create' && ' National ID cannot be changed after creation.'}
        </p>

        <div className="space-y-4">
          {mode === 'create' && (
            <FormField
              label="National ID"
              htmlFor="national_id"
              required
              error={errors.national_id?.message}
              hint="Government-issued identifier. Must be unique within this laboratory."
            >
              <Input id="national_id" placeholder="e.g. FR123456" autoFocus {...register('national_id')} />
            </FormField>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="First name" htmlFor="first_name" required error={errors.first_name?.message}>
              <Input id="first_name" placeholder="Claire" autoFocus={mode === 'edit'} {...register('first_name')} />
            </FormField>
            <FormField label="Last name" htmlFor="last_name" required error={errors.last_name?.message}>
              <Input id="last_name" placeholder="Moreau" {...register('last_name')} />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Date of birth" htmlFor="date_of_birth" required error={errors.date_of_birth?.message}>
              <Input id="date_of_birth" type="date" {...register('date_of_birth')} />
            </FormField>
            <FormField label="Gender" htmlFor="gender" required error={errors.gender?.message}>
              <Select
                value={watch('gender') ?? ''}
                onValueChange={(v) => {
                  if (v) setValue('gender', v as 'MALE' | 'FEMALE' | 'OTHER', { shouldValidate: true })
                }}
              >
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
        </div>
      </div>

      <Separator />

      {/* Contact section */}
      <div>
        <h3 className="text-sm font-semibold mb-1">Contact Information</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Optional. Used for appointment reminders and portal account creation.
        </p>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Phone" htmlFor="phone" error={errors.phone?.message}>
              <Input id="phone" type="tel" placeholder="+33 6 12 34 56 78" {...register('phone')} />
            </FormField>
            <FormField label="Email" htmlFor="email" error={errors.email?.message}>
              <Input id="email" type="email" placeholder="patient@email.com" {...register('email')} />
            </FormField>
          </div>
          <FormField label="Address" htmlFor="address" error={errors.address?.message}>
            <Textarea id="address" rows={2} placeholder="Street, city, postal code" {...register('address')} />
          </FormField>
        </div>
      </div>

      <Separator />

      {/* Insurance section */}
      <div>
        <h3 className="text-sm font-semibold mb-1">Insurance</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Health insurance reference for billing purposes.
        </p>
        <FormField label="Insurance number" htmlFor="insurance_number" error={errors.insurance_number?.message}>
          <Input id="insurance_number" placeholder="INS-789" {...register('insurance_number')} />
        </FormField>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'create' ? 'Register Patient' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
