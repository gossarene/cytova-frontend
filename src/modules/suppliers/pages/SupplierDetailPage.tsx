import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Edit, Ban, Truck, Loader2, Mail, Phone, MapPin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/shared/PageHeader'
import { ErrorState } from '@/components/shared/ErrorState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { CardSkeleton } from '@/components/shared/LoadingSkeleton'
import { FormField } from '@/components/shared/FormField'
import { Can } from '@/lib/permissions/Can'
import { P } from '@/lib/permissions/constants'
import { useSupplier, useUpdateSupplier, useDeactivateSupplier } from '../api'
import { formatDateTime } from '@/lib/utils/date'
import { ROUTES } from '@/config/routes'

const editSchema = z.object({
  name: z.string().min(1, 'Required').max(255),
  contact_name: z.string().optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

type EditForm = z.infer<typeof editSchema>

export function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: supplier, isLoading, error, refetch } = useSupplier(id!)
  const updateMut = useUpdateSupplier(id!)
  const deactivateMut = useDeactivateSupplier(id!)
  const [editing, setEditing] = useState(false)
  const [showDeactivate, setShowDeactivate] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    values: supplier ? {
      name: supplier.name, contact_name: supplier.contact_name,
      email: supplier.email, phone: supplier.phone,
      address: supplier.address, notes: supplier.notes,
    } : undefined,
  })

  if (error) return <ErrorState onRetry={refetch} />
  if (isLoading || !supplier) return <div className="space-y-6"><CardSkeleton /><CardSkeleton /></div>

  async function onSave(data: EditForm) {
    try {
      await updateMut.mutateAsync(data)
      toast.success('Supplier updated.')
      setEditing(false)
    } catch { toast.error('Update failed.') }
  }

  async function handleDeactivate() {
    try {
      await deactivateMut.mutateAsync()
      toast.success('Supplier deactivated.')
      setShowDeactivate(false)
    } catch { toast.error('Failed.') }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={supplier.name}
        breadcrumbs={[{ label: 'Suppliers', href: ROUTES.SUPPLIERS }, { label: supplier.name }]}
      >
        {!editing && (
          <Can permission={P.SUPPLIERS_MANAGE}>
            <Button variant="outline" className="gap-2" onClick={() => setEditing(true)}><Edit className="h-4 w-4" /> Edit</Button>
            {supplier.is_active && (
              <Button variant="destructive" className="gap-2" onClick={() => setShowDeactivate(true)}><Ban className="h-4 w-4" /> Deactivate</Button>
            )}
          </Can>
        )}
      </PageHeader>

      {editing ? (
        <Card className="max-w-2xl">
          <CardHeader><CardTitle className="text-lg">Edit Supplier</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSave)} className="space-y-4">
              <FormField label="Name" htmlFor="s-name" required error={errors.name?.message}>
                <Input id="s-name" autoFocus {...register('name')} />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Contact" htmlFor="s-contact" error={errors.contact_name?.message}>
                  <Input id="s-contact" {...register('contact_name')} />
                </FormField>
                <FormField label="Email" htmlFor="s-email" error={errors.email?.message}>
                  <Input id="s-email" type="email" {...register('email')} />
                </FormField>
              </div>
              <FormField label="Phone" htmlFor="s-phone" error={errors.phone?.message}>
                <Input id="s-phone" {...register('phone')} />
              </FormField>
              <FormField label="Address" htmlFor="s-addr" error={errors.address?.message}>
                <Textarea id="s-addr" rows={2} {...register('address')} />
              </FormField>
              <FormField label="Notes" htmlFor="s-notes" error={errors.notes?.message}>
                <Textarea id="s-notes" rows={2} {...register('notes')} />
              </FormField>
              <div className="flex gap-3 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                <Button type="submit" disabled={updateMut.isPending}>
                  {updateMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base"><Truck className="h-4 w-4 text-muted-foreground" /> Supplier Details</CardTitle>
              <Badge variant="outline" className={supplier.is_active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-600'}>
                {supplier.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {supplier.contact_name && <div className="flex items-center gap-2 text-sm"><Truck className="h-3.5 w-3.5 text-muted-foreground" />{supplier.contact_name}</div>}
            {supplier.email && <div className="flex items-center gap-2 text-sm"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{supplier.email}</div>}
            {supplier.phone && <div className="flex items-center gap-2 text-sm"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{supplier.phone}</div>}
            {supplier.address && <div className="flex items-center gap-2 text-sm"><MapPin className="h-3.5 w-3.5 text-muted-foreground" />{supplier.address}</div>}
            {supplier.notes && <><Separator /><p className="text-sm bg-muted p-3 rounded">{supplier.notes}</p></>}
            <div className="text-xs text-muted-foreground pt-2">
              Created {formatDateTime(supplier.created_at)} &middot; Updated {formatDateTime(supplier.updated_at)}
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog open={showDeactivate} onOpenChange={setShowDeactivate}
        title="Deactivate supplier" variant="destructive"
        description={`"${supplier.name}" will be hidden from new purchase orders.`}
        confirmLabel="Deactivate" onConfirm={handleDeactivate} isLoading={deactivateMut.isPending}
      />
    </div>
  )
}
