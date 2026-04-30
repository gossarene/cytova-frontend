import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/shared/PageHeader'
import { FormField } from '@/components/shared/FormField'
import { useCreateSupplier } from '../api'
import { ROUTES } from '@/config/routes'

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  contact_name: z.string().optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

type FormData = z.infer<typeof schema>

export function SupplierCreatePage() {
  const navigate = useNavigate()
  const mutation = useCreateSupplier()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '', contact_name: '', email: '',
      phone: '', address: '', notes: '',
    },
  })

  async function onSubmit(data: FormData) {
    try {
      const supplier = await mutation.mutateAsync(data)
      toast.success(`Supplier "${supplier.name}" created.`)
      navigate(`/suppliers/${supplier.id}`)
    } catch {
      toast.error('Failed to create supplier.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Supplier"
        breadcrumbs={[{ label: 'Suppliers', href: ROUTES.SUPPLIERS }, { label: 'New' }]}
      />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-lg">New Supplier</CardTitle>
          <CardDescription>Register a reagent or consumable supplier.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField label="Name" htmlFor="supplier-name" required error={errors.name?.message}>
                <Input id="supplier-name" placeholder="ACME Labs" autoFocus {...register('name')} />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Contact person" htmlFor="supplier-contact" error={errors.contact_name?.message}>
                  <Input id="supplier-contact" placeholder="Jane Doe" {...register('contact_name')} />
                </FormField>
                <FormField label="Phone" htmlFor="supplier-phone" error={errors.phone?.message}>
                  <Input id="supplier-phone" type="tel" placeholder="+33 6 12 34 56 78" {...register('phone')} />
                </FormField>
              </div>

              <FormField label="Email" htmlFor="supplier-email" error={errors.email?.message}>
                <Input id="supplier-email" type="email" placeholder="contact@supplier.com" {...register('email')} />
              </FormField>

              <FormField label="Address" htmlFor="supplier-address" error={errors.address?.message}>
                <Textarea id="supplier-address" rows={2} placeholder="Street, city" {...register('address')} />
              </FormField>
            </div>

            <Separator />

            <FormField label="Notes" htmlFor="supplier-notes" error={errors.notes?.message}>
              <Textarea id="supplier-notes" rows={3} placeholder="Internal notes" {...register('notes')} />
            </FormField>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate(ROUTES.SUPPLIERS)} disabled={mutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Supplier
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
