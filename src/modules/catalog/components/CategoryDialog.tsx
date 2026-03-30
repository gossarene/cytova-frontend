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
import { useCreateCategory, useUpdateCategory } from '../api'
import type { ExamCategoryListItem } from '../types'

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(150),
  description: z.string().optional().or(z.literal('')),
  display_order: z.string().optional().or(z.literal('')),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editCategory?: ExamCategoryListItem | null
}

export function CategoryDialog({ open, onOpenChange, editCategory }: Props) {
  const isEdit = !!editCategory
  const createMut = useCreateCategory()
  const updateMut = useUpdateCategory(editCategory?.id ?? '')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: editCategory?.name ?? '',
      description: editCategory?.description ?? '',
      display_order: String(editCategory?.display_order ?? 0),
    },
  })

  async function onSubmit(data: FormData) {
    const payload = { ...data, display_order: parseInt(data.display_order || '0', 10) }
    try {
      if (isEdit) {
        await updateMut.mutateAsync(payload)
        toast.success('Category updated.')
      } else {
        await createMut.mutateAsync(payload)
        toast.success('Category created.')
      }
      reset()
      onOpenChange(false)
    } catch {
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} category.`)
    }
  }

  const isPending = createMut.isPending || updateMut.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Category' : 'New Category'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update category details.' : 'Create a new exam category for your catalog.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Name" htmlFor="cat-name" required error={errors.name?.message}>
            <Input id="cat-name" placeholder="e.g. Hematology" autoFocus {...register('name')} />
          </FormField>
          <FormField label="Description" htmlFor="cat-desc" error={errors.description?.message}>
            <Textarea id="cat-desc" rows={2} placeholder="Optional description" {...register('description')} />
          </FormField>
          <FormField label="Display order" htmlFor="cat-order" error={errors.display_order?.message} hint="Lower numbers appear first.">
            <Input id="cat-order" type="number" {...register('display_order')} />
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
