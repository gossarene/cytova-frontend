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
import { ORG_TYPE_OPTIONS, BILLING_MODE_OPTIONS } from '../types'

const schema = z.object({
  code: z.string().max(50).optional().or(z.literal('')),
  name: z.string().min(1, 'Name is required').max(255),
  organization_type: z.string().min(1, 'Type is required'),
  contact_person: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  default_billing_mode: z.string().optional().or(z.literal('')),
  payment_terms_days: z.string().optional().or(z.literal('')),
  billing_notes: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

type FormData = z.infer<typeof schema>

interface Props {
  mode: 'create' | 'edit'
  defaultValues?: Partial<FormData>
  onSubmit: (data: Record<string, unknown>) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
}

export function PartnerForm({ mode, defaultValues, onSubmit, onCancel, isSubmitting }: Props) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: '', name: '', organization_type: '', contact_person: '',
      phone: '', email: '', address: '', default_billing_mode: '',
      payment_terms_days: '', billing_notes: '', notes: '', ...defaultValues,
    },
  })

  async function handleFormSubmit(data: FormData) {
    const payload: Record<string, unknown> = { ...data }
    if (data.payment_terms_days) payload.payment_terms_days = parseInt(data.payment_terms_days, 10)
    else delete payload.payment_terms_days
    if (!data.default_billing_mode) delete payload.default_billing_mode
    if (mode === 'edit') delete payload.code
    await onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-1">Organization</h3>
        <p className="text-xs text-muted-foreground mb-4">Partner identification and type.</p>
        <div className="space-y-4">
          {mode === 'create' && (
            <FormField label="Code" htmlFor="partner-code" required error={errors.code?.message}
              hint="Unique uppercase code for billing and reports. Auto-uppercased.">
              <Input id="partner-code" placeholder="CLINIC-NORTH-01" className="uppercase" {...register('code')} />
            </FormField>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Name" htmlFor="partner-name" required error={errors.name?.message}>
              <Input id="partner-name" placeholder="Clinique du Nord" autoFocus={mode === 'edit'} {...register('name')} />
            </FormField>
            <FormField label="Type" htmlFor="partner-type" required error={errors.organization_type?.message}>
              <Select value={watch('organization_type')} onValueChange={(v) => { if (v) setValue('organization_type', v, { shouldValidate: true }) }}>
                <SelectTrigger id="partner-type"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {ORG_TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-sm font-semibold mb-1">Contact</h3>
        <div className="space-y-4">
          <FormField label="Contact person" htmlFor="partner-contact" error={errors.contact_person?.message}>
            <Input id="partner-contact" placeholder="Dr. Martin" {...register('contact_person')} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Phone" htmlFor="partner-phone" error={errors.phone?.message}>
              <Input id="partner-phone" type="tel" placeholder="+33 6 12 34 56 78" {...register('phone')} />
            </FormField>
            <FormField label="Email" htmlFor="partner-email" error={errors.email?.message}>
              <Input id="partner-email" type="email" placeholder="contact@partner.fr" {...register('email')} />
            </FormField>
          </div>
          <FormField label="Address" htmlFor="partner-address" error={errors.address?.message}>
            <Textarea id="partner-address" rows={2} placeholder="Street, city" {...register('address')} />
          </FormField>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-sm font-semibold mb-1">Billing</h3>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Default billing mode" htmlFor="partner-billing" error={errors.default_billing_mode?.message}>
              <Select value={watch('default_billing_mode') ?? ''} onValueChange={(v) => setValue('default_billing_mode', v ?? '')}>
                <SelectTrigger id="partner-billing"><SelectValue placeholder="Select mode" /></SelectTrigger>
                <SelectContent>
                  {BILLING_MODE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Payment terms (days)" htmlFor="partner-terms" error={errors.payment_terms_days?.message}>
              <Input id="partner-terms" type="number" min="0" placeholder="30" {...register('payment_terms_days')} />
            </FormField>
          </div>
          <FormField label="Billing notes" htmlFor="partner-billing-notes" error={errors.billing_notes?.message}>
            <Textarea id="partner-billing-notes" rows={2} placeholder="Invoice terms, notes..." {...register('billing_notes')} />
          </FormField>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'create' ? 'Create Partner' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
