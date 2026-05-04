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

/** Fields editable by any user with patients.update.
 *
 *  Flexible-identity rollout: ``date_of_birth`` is optional at the
 *  Zod layer; the cross-field ``superRefine`` below requires it
 *  whenever ``date_of_birth_unknown`` is false. Splitting it that way
 *  means a checked "DOB unknown" checkbox immediately stops yelling
 *  about the empty date input — no flicker, no stale error. */
const editableFields = {
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  date_of_birth: z.string().max(10).optional().or(z.literal('')),
  date_of_birth_unknown: z.boolean().optional(),
  gender: z.enum(['MALE', 'FEMALE'], { message: 'Gender is required' }),
  nationality: z.string().max(100).optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  city_of_residence: z.string().max(150).optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  insurance_number: z.string().max(100).optional().or(z.literal('')),
}

/** Identity fields — required on create, optional on edit (only
 *  included when user has permission). ``document_number`` is
 *  base-optional; the cross-field ``superRefine`` below requires it
 *  for any document type other than UNKNOWN. */
const identityFields = {
  document_type: z.enum(DOCUMENT_TYPES, { message: 'Document type is required' }),
  document_number: z.string().max(100).optional().or(z.literal('')),
}

const identityFieldsOptional = {
  document_type: z.enum(DOCUMENT_TYPES).optional(),
  document_number: z.string().max(100).optional().or(z.literal('')),
}

/** Cross-field rules shared by every schema variant. Mirrors the
 *  backend's ``PatientCreateSerializer.validate`` / Cases A–D so the
 *  client surfaces the same field-level error before the round trip. */
function applyFlexibleIdentityRules(
  data: { document_type?: string; document_number?: string; date_of_birth?: string; date_of_birth_unknown?: boolean },
  ctx: z.RefinementCtx,
) {
  // Case B: real document type → number required.
  if (data.document_type && data.document_type !== 'UNKNOWN' && !data.document_number) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['document_number'],
      message: 'Document number is required for this document type.',
    })
  }
  // Case D: DOB required unless explicitly flagged unknown.
  if (!data.date_of_birth_unknown && !data.date_of_birth) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['date_of_birth'],
      message: 'Date of birth is required.',
    })
  }
}

const createSchema = z
  .object({ ...identityFields, ...editableFields })
  .superRefine(applyFlexibleIdentityRules)
const editSchema = z
  .object(editableFields)
  .superRefine(applyFlexibleIdentityRules)
const editWithIdentitySchema = z
  .object({ ...identityFieldsOptional, ...editableFields })
  .superRefine(applyFlexibleIdentityRules)

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
      date_of_birth_unknown: false,
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

  const docType = watch('document_type')
  const dobUnknown = !!watch('date_of_birth_unknown')
  const isUnknownDocument = docType === 'UNKNOWN'

  async function handleFormSubmit(data: PatientFormData): Promise<boolean> {
    try {
      await onSubmit(data)
      return true
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
      // Don't rethrow — caller already gets the error via the toast/setError
      // path, and rethrowing causes RHF to log an unhandled-rejection.
      return false
    }
  }

  const showIdentityFields = mode === 'create' || true // always show in both modes
  const identityEditable = mode === 'create' || canEditIdentity
  const docTypeLabel = DOCUMENT_TYPE_OPTIONS.find((o) => o.value === docType)?.label

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
                      value={docType ?? ''}
                      onValueChange={(v) => {
                        if (!v) return
                        setValue('document_type', v as DocumentType, { shouldValidate: true })
                        // Switching to UNKNOWN — clear any previously
                        // typed number so the operator's intent is
                        // unambiguous (the backend will auto-generate
                        // an ``AUTO-PT-…`` placeholder). Also clears
                        // any "Document number is required" error
                        // that would otherwise linger when the input
                        // is hidden.
                        if (v === 'UNKNOWN') {
                          setValue('document_number', '', { shouldValidate: true })
                        }
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
                {/* Hide the document number input when type=UNKNOWN.
                    The backend auto-generates an ``AUTO-PT-…``
                    placeholder; surfacing the input would mislead
                    the operator into thinking they need to fill it.
                    The Zod ``superRefine`` already skips the required
                    rule for UNKNOWN, so hiding the field can't trap
                    a stale "required" error. */}
                {!isUnknownDocument && (
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
                )}
              </div>
              {isUnknownDocument && identityEditable && (
                <p className="text-xs text-muted-foreground">
                  No document number needed — a placeholder will be
                  generated automatically.
                </p>
              )}
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
            {/* Hide the date picker when the operator marks DOB as
                unknown. We keep the slot occupied so the layout
                doesn't reflow — the gender field stays in place. */}
            {!dobUnknown ? (
              <FormField label="Date of birth" htmlFor="date_of_birth" required error={errors.date_of_birth?.message}>
                <Input id="date_of_birth" type="date" {...register('date_of_birth')} />
              </FormField>
            ) : (
              <FormField label="Date of birth" htmlFor="date_of_birth">
                <Input
                  id="date_of_birth"
                  value="Not provided"
                  disabled
                  className="bg-muted"
                />
              </FormField>
            )}
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

          {/* DOB-unknown checkbox — sits directly under the date row
              so the relationship between the two is obvious. Toggling
              it on clears any DOB value the operator may have
              entered, so we never round-trip a stale date alongside
              the unknown flag (matches the backend's consistency
              rule). */}
          <label className="flex items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
              checked={dobUnknown}
              onChange={(e) => {
                setValue('date_of_birth_unknown', e.target.checked, {
                  shouldValidate: true,
                })
                if (e.target.checked) {
                  setValue('date_of_birth', '', { shouldValidate: true })
                }
              }}
            />
            <span className="text-muted-foreground">
              Date of birth not available. The patient will be saved
              without a DOB; some flows (e.g. linking a Cytova
              identity) require a DOB and won't be available until
              one is provided.
            </span>
          </label>

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
