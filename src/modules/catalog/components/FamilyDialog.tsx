import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/shared/FormField'
import { useCreateFamily, useUpdateFamily } from '../api'
import type { ExamFamilyItem } from '../types'

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(150),
  description: z.string().optional().or(z.literal('')),
  display_order: z.string().optional().or(z.literal('')),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editFamily?: ExamFamilyItem | null
}

export function FamilyDialog({ open, onOpenChange, editFamily }: Props) {
  const isEdit = !!editFamily
  const createMut = useCreateFamily()
  const updateMut = useUpdateFamily(editFamily?.id ?? '')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: editFamily?.name ?? '',
      description: editFamily?.description ?? '',
      display_order: String(editFamily?.display_order ?? 0),
    },
  })

  async function onSubmit(data: FormData) {
    const payload = {
      name: data.name,
      description: data.description || '',
      display_order: parseInt(data.display_order || '0', 10),
    }
    try {
      if (isEdit) {
        await updateMut.mutateAsync(payload)
        toast.success('Family updated.')
      } else {
        await createMut.mutateAsync(payload)
        toast.success('Family created.')
      }
      reset()
      onOpenChange(false)
    } catch {
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} family.`)
    }
  }

  const isPending = createMut.isPending || updateMut.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Family' : 'New Family'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update family details.'
              : 'Create a new exam family (e.g. Hematology, Biochemistry).'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Name" htmlFor="fam-name" required error={errors.name?.message}>
            <Input id="fam-name" placeholder="e.g. Hematology" autoFocus {...register('name')} />
          </FormField>
          <FormField label="Description" htmlFor="fam-desc" error={errors.description?.message}>
            <Textarea id="fam-desc" rows={2} placeholder="Optional description" {...register('description')} />
          </FormField>
          <FormField label="Display order" htmlFor="fam-order" error={errors.display_order?.message} hint="Lower numbers appear first.">
            <Input id="fam-order" type="number" {...register('display_order')} />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
