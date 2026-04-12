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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormField } from '@/components/shared/FormField'
import { useCreateSubFamily, useUpdateSubFamily } from '../api'
import type { ExamFamilyItem, ExamSubFamilyItem } from '../types'

const schema = z.object({
  family_id: z.string().min(1, 'Family is required'),
  name: z.string().min(1, 'Name is required').max(150),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  families: ExamFamilyItem[]
  editSubFamily?: ExamSubFamilyItem | null
}

export function SubFamilyDialog({ open, onOpenChange, families, editSubFamily }: Props) {
  const isEdit = !!editSubFamily
  const createMut = useCreateSubFamily()
  const updateMut = useUpdateSubFamily(editSubFamily?.id ?? '')

  const { handleSubmit, register, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: {
      family_id: editSubFamily?.family_id ?? '',
      name: editSubFamily?.name ?? '',
    },
  })

  const familyId = watch('family_id')

  async function onSubmit(data: FormData) {
    try {
      if (isEdit && editSubFamily) {
        // Backend intentionally forbids reparenting (family_id is immutable
        // on update). Only ``name`` is sent, and the UI disables the family
        // select below in edit mode to communicate the constraint.
        await updateMut.mutateAsync({ name: data.name })
        toast.success('Sub-family updated.')
      } else {
        await createMut.mutateAsync({ family_id: data.family_id, name: data.name })
        toast.success('Sub-family created.')
      }
      reset()
      onOpenChange(false)
    } catch {
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} sub-family.`)
    }
  }

  const isPending = createMut.isPending || updateMut.isPending
  const activeFamilies = families.filter((f) => f.is_active)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Sub-family' : 'New Sub-family'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Rename this sub-family. Reassigning it to a different family is not allowed.'
              : 'Create a sub-family scoped to a parent family (e.g. Hematology → Coagulation).'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Family" htmlFor="sf-family" required error={errors.family_id?.message}>
            <Select
              value={familyId}
              onValueChange={(v) => { if (v) setValue('family_id', v, { shouldValidate: true }) }}
              disabled={isEdit}
              // Base UI ``items`` lets <SelectValue> render the selected
              // family's name instead of the raw UUID. Keeps the submitted
              // form value as the UUID — only the *display* is the label.
              items={activeFamilies.map((f) => ({ value: f.id, label: f.name }))}
            >
              <SelectTrigger id="sf-family"><SelectValue placeholder="Select family" /></SelectTrigger>
              <SelectContent>
                {activeFamilies.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Name" htmlFor="sf-name" required error={errors.name?.message}>
            <Input id="sf-name" placeholder="e.g. Coagulation" autoFocus {...register('name')} />
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
