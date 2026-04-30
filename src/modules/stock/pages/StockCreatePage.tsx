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
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/shared/PageHeader'
import { FormField } from '@/components/shared/FormField'
import { ErrorState } from '@/components/shared/ErrorState'
import { CardSkeleton } from '@/components/shared/LoadingSkeleton'
import { useStockCategories, useCreateStockItem } from '../api'
import { ROUTES } from '@/config/routes'

const schema = z.object({
  category_id: z.string().uuid('Select a category'),
  code: z.string().min(1, 'Code is required').max(50),
  name: z.string().min(1, 'Name is required').max(255),
  unit: z.string().min(1, 'Unit is required').max(50),
  description: z.string().optional().or(z.literal('')),
  minimum_threshold: z.string().optional().or(z.literal('')),
  reorder_quantity: z.string().optional().or(z.literal('')),
  main_supplier_name: z.string().optional().or(z.literal('')),
})

type FormData = z.infer<typeof schema>

export function StockCreatePage() {
  const navigate = useNavigate()
  const mutation = useCreateStockItem()

  // Categories are required to fill the Category dropdown — render a
  // specific message rather than a generic crash if the lookup fails.
  const { data: catData, isLoading: catsLoading, error: catsError, refetch: refetchCats } =
    useStockCategories({ is_active: 'true' })
  const categories = catData?.data ?? []

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      category_id: '', code: '', name: '', unit: '',
      description: '', minimum_threshold: '0',
      reorder_quantity: '', main_supplier_name: '',
    },
  })

  async function onSubmit(data: FormData) {
    const payload: Record<string, unknown> = {
      category_id: data.category_id,
      code: data.code.trim().toUpperCase(),
      name: data.name.trim(),
      unit: data.unit.trim(),
      description: data.description ?? '',
      main_supplier_name: data.main_supplier_name ?? '',
    }
    if (data.minimum_threshold) payload.minimum_threshold = data.minimum_threshold
    if (data.reorder_quantity) payload.reorder_quantity = data.reorder_quantity

    try {
      const item = await mutation.mutateAsync(payload)
      toast.success(`Stock item "${item.name}" created.`)
      navigate(`/stock/${item.id}`)
    } catch {
      toast.error('Failed to create stock item.')
    }
  }

  if (catsError) {
    return (
      <ErrorState
        title="Could not load form data."
        message="The list of stock categories could not be loaded. Try again."
        onRetry={refetchCats}
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Stock Item"
        breadcrumbs={[{ label: 'Stock', href: ROUTES.STOCK }, { label: 'New' }]}
      />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-lg">New Stock Item</CardTitle>
          <CardDescription>Define a reagent, consumable, or other inventory line.</CardDescription>
        </CardHeader>
        <CardContent>
          {catsLoading ? (
            <CardSkeleton />
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Code" htmlFor="stock-code" required error={errors.code?.message}
                    hint="Unique uppercase code. Auto-uppercased on save.">
                    <Input id="stock-code" placeholder="REAG-001" className="uppercase" {...register('code')} />
                  </FormField>
                  <FormField label="Category" htmlFor="stock-category" required error={errors.category_id?.message}>
                    <Select
                      value={watch('category_id')}
                      onValueChange={(v) => { if (v) setValue('category_id', v, { shouldValidate: true }) }}
                    >
                      <SelectTrigger id="stock-category">
                        <SelectValue placeholder={categories.length === 0 ? 'No active categories' : 'Select a category'} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>

                <FormField label="Name" htmlFor="stock-name" required error={errors.name?.message}>
                  <Input id="stock-name" placeholder="Reagent X" {...register('name')} />
                </FormField>

                <FormField label="Unit" htmlFor="stock-unit" required error={errors.unit?.message}
                  hint="Unit of measure (e.g. mL, box, vial).">
                  <Input id="stock-unit" placeholder="mL" {...register('unit')} />
                </FormField>

                <FormField label="Description" htmlFor="stock-description" error={errors.description?.message}>
                  <Textarea id="stock-description" rows={2} {...register('description')} />
                </FormField>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Inventory thresholds</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Minimum threshold" htmlFor="stock-min" error={errors.minimum_threshold?.message}
                    hint="Below this level the item is flagged as low.">
                    <Input id="stock-min" type="number" min="0" step="0.0001" placeholder="0" {...register('minimum_threshold')} />
                  </FormField>
                  <FormField label="Reorder quantity" htmlFor="stock-reorder" error={errors.reorder_quantity?.message}
                    hint="Suggested quantity to reorder. Optional.">
                    <Input id="stock-reorder" type="number" min="0.0001" step="0.0001" placeholder="—" {...register('reorder_quantity')} />
                  </FormField>
                </div>
                <FormField label="Main supplier" htmlFor="stock-supplier" error={errors.main_supplier_name?.message}
                  hint="Free-text label. Used for hints only — purchase orders use the Suppliers list.">
                  <Input id="stock-supplier" placeholder="e.g. ACME Labs" {...register('main_supplier_name')} />
                </FormField>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => navigate(ROUTES.STOCK)} disabled={mutation.isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Item
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
