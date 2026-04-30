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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { PageHeader } from '@/components/shared/PageHeader'
import { FormField } from '@/components/shared/FormField'
import { ErrorState } from '@/components/shared/ErrorState'
import { CardSkeleton } from '@/components/shared/LoadingSkeleton'
import { useActiveSuppliers, useCreatePurchaseOrder } from '../api'
import { ROUTES } from '@/config/routes'

const schema = z.object({
  supplier_id: z.string().uuid('Select a supplier'),
  expected_delivery_date: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

type FormData = z.infer<typeof schema>

export function POCreatePage() {
  const navigate = useNavigate()
  const mutation = useCreatePurchaseOrder()

  // Active suppliers populate the supplier dropdown — without them the
  // form is unusable, so failure gets a specific message rather than the
  // generic crash screen.
  const { data: suppliers, isLoading: supLoading, error: supError, refetch: refetchSuppliers } =
    useActiveSuppliers()

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { supplier_id: '', expected_delivery_date: '', notes: '' },
  })

  async function onSubmit(data: FormData) {
    const payload: Record<string, unknown> = {
      supplier_id: data.supplier_id,
      notes: data.notes ?? '',
      items: [],
    }
    if (data.expected_delivery_date) payload.expected_delivery_date = data.expected_delivery_date

    try {
      const po = await mutation.mutateAsync(payload)
      toast.success(`Order ${po.order_number} created.`)
      navigate(`/procurement/${po.id}`)
    } catch {
      toast.error('Failed to create purchase order.')
    }
  }

  if (supError) {
    return (
      <ErrorState
        title="Could not load form data."
        message="The list of suppliers could not be loaded. Try again."
        onRetry={refetchSuppliers}
      />
    )
  }

  const supplierList = suppliers ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Purchase Order"
        breadcrumbs={[{ label: 'Procurement', href: ROUTES.PROCUREMENT }, { label: 'New' }]}
      />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Draft Purchase Order</CardTitle>
          <CardDescription>
            Pick a supplier and create a draft. Add line items and confirm
            the order from its detail page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {supLoading ? (
            <CardSkeleton />
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <FormField label="Supplier" htmlFor="po-supplier" required error={errors.supplier_id?.message}>
                <Select
                  value={watch('supplier_id')}
                  onValueChange={(v) => { if (v) setValue('supplier_id', v, { shouldValidate: true }) }}
                >
                  <SelectTrigger id="po-supplier">
                    <SelectValue placeholder={supplierList.length === 0 ? 'No active suppliers' : 'Select a supplier'} />
                  </SelectTrigger>
                  <SelectContent>
                    {supplierList.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField
                label="Expected delivery date"
                htmlFor="po-date"
                error={errors.expected_delivery_date?.message}
                hint="Optional — when you expect the supplier to deliver."
              >
                <Input id="po-date" type="date" {...register('expected_delivery_date')} />
              </FormField>

              <FormField label="Notes" htmlFor="po-notes" error={errors.notes?.message}>
                <Textarea id="po-notes" rows={3} placeholder="Internal notes for this order" {...register('notes')} />
              </FormField>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => navigate(ROUTES.PROCUREMENT)} disabled={mutation.isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending || supplierList.length === 0}>
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Order
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
