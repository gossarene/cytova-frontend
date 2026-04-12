import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { FormField } from '@/components/shared/FormField'
import { CountryCombobox } from '@/components/shared/CountryCombobox'
import { PhoneInput } from '@/components/shared/PhoneInput'
import { GENDER_OPTIONS, DOCUMENT_TYPE_OPTIONS } from '../types'
import type { DocumentType } from '../types'
import type { ApiError } from '@/lib/api/types'

const DOCUMENT_TYPES = DOCUMENT_TYPE_OPTIONS.map((o) => o.value) as [string, ...string[]]

/** Fields editable by any user with patients.update */
const editableFields = {
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['MALE', 'FEMALE'], { message: 'Gender is required' }),
  nationality: z.string().max(100).optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  city_of_residence: z.string().max(150).optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  insurance_number: z.string().max(100).optional().or(z.literal('')),
}

/** Identity fields — required on create, optional on edit (only included when user has permission) */
const identityFields = {
  document_type: z.enum(DOCUMENT_TYPES, { message: 'Document type is required' }),
  document_number: z.string().min(1, 'Document number is required').max(100),
}

const identityFieldsOptional = {
  document_type: z.enum(DOCUMENT_TYPES).optional(),
  document_number: z.string().max(100).optional().or(z.literal('')),
}

const createSchema = z.object({ ...identityFields, ...editableFields })
const editSchema = z.object(editableFields)
const editWithIdentitySchema = z.object({ ...identityFieldsOptional, ...editableFields })

export type PatientFormData = z.infer<typeof createSchema>

interface PatientFormProps {
  mode: 'create' | 'edit'
  /** Whether the user can edit document_type and document_number (patients.update_identity) */
  canEditIdentity?: boolean
  defaultValues?: Partial<PatientFormData>
  onSubmit: (data: PatientFormData) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
}

export function PatientForm({
  mode,
  canEditIdentity = false,
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
}: PatientFormProps) {
  const schema = mode === 'create'
    ? createSchema
    : canEditIdentity
      ? editWithIdentitySchema
      : editSchema

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
      document_type: undefined,
      document_number: '',
      first_name: '',
      last_name: '',
      date_of_birth: '',
      gender: undefined,
      nationality: '',
      phone: '',
      email: '',
      city_of_residence: '',
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
      throw err
    }
  }

  const showIdentityFields = mode === 'create' || true // always show in both modes
  const identityEditable = mode === 'create' || canEditIdentity
  const docTypeLabel = DOCUMENT_TYPE_OPTIONS.find((o) => o.value === watch('document_type'))?.label

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Identification section */}
      <div>
        <h3 className="text-sm font-semibold mb-1">Identification</h3>
        <p className="text-xs text-muted-foreground mb-4">
          {mode === 'create'
            ? 'Official identification document. Document type and number cannot be changed after registration.'
            : 'Official identification document.'}
        </p>

        <div className="space-y-4">
          {showIdentityFields && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Document type" htmlFor="document_type" required={mode === 'create'} error={errors.document_type?.message}>
                  {identityEditable ? (
                    <Select
                      value={watch('document_type') ?? ''}
                      onValueChange={(v) => {
                        if (v) setValue('document_type', v as DocumentType, { shouldValidate: true })
                      }}
                    >
                      <SelectTrigger id="document_type">
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input id="document_type" value={docTypeLabel ?? ''} disabled className="bg-muted" />
                  )}
                </FormField>
                <FormField
                  label="Document number"
                  htmlFor="document_number"
                  required={mode === 'create'}
                  error={errors.document_number?.message}
                  hint={mode === 'create' ? 'Number shown on the selected identification document.' : undefined}
                >
                  <Input
                    id="document_number"
                    placeholder={identityEditable ? 'e.g. CI-001234567' : ''}
                    autoFocus={mode === 'create'}
                    disabled={!identityEditable}
                    className={!identityEditable ? 'bg-muted' : ''}
                    {...register('document_number')}
                  />
                </FormField>
              </div>
              {mode === 'edit' && !canEditIdentity && (
                <div className="flex items-center gap-2 rounded-md border border-muted bg-muted/30 px-3 py-2">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    Identity document fields require special permission to edit.
                  </p>
                </div>
              )}
            </>
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
                  if (v) setValue('gender', v as 'MALE' | 'FEMALE', { shouldValidate: true })
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

          <FormField label="Nationality" htmlFor="nationality" error={errors.nationality?.message}>
            <CountryCombobox
              id="nationality"
              value={watch('nationality') ?? ''}
              onChange={(name) => setValue('nationality', name, { shouldValidate: true })}
              placeholder="Select nationality..."
            />
          </FormField>
        </div>
      </div>

      <Separator />

      {/* Contact & Residence section */}
      <div>
        <h3 className="text-sm font-semibold mb-1">Contact & Residence</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Contact details and place of residence.
        </p>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Phone" htmlFor="phone" error={errors.phone?.message}>
              <PhoneInput
                id="phone"
                value={watch('phone') ?? ''}
                onChange={(v) => setValue('phone', v, { shouldValidate: true })}
                placeholder="07 12 34 56 78"
              />
            </FormField>
            <FormField label="Email" htmlFor="email" error={errors.email?.message}>
              <Input id="email" type="email" placeholder="patient@email.com" {...register('email')} />
            </FormField>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="City of residence" htmlFor="city_of_residence" error={errors.city_of_residence?.message}>
              <Input id="city_of_residence" placeholder="e.g. Abidjan" {...register('city_of_residence')} />
            </FormField>
          </div>
          <FormField label="Address" htmlFor="address" error={errors.address?.message} hint="Full postal address.">
            <Textarea id="address" rows={2} placeholder="Street, neighborhood, postal code" {...register('address')} />
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
