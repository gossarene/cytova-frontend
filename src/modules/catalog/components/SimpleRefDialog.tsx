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

/**
 * Shared create/edit dialog for reference entities that have the same
 * ``{name, description}`` shape — currently tube types and techniques.
 *
 * The parent owns the mutation hooks (so React Query cache keys stay
 * entity-specific) and passes them in as callbacks. This keeps the dialog
 * stateless with respect to its target endpoint.
 */

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(150),
  description: z.string().optional().or(z.literal('')),
})

type FormData = z.infer<typeof schema>

export interface SimpleRefRecord {
  id: string
  name: string
  description: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Shown in the title. e.g. "Tube type". */
  entityLabel: string
  editRecord?: SimpleRefRecord | null
  onCreate: (payload: { name: string; description: string }) => Promise<unknown>
  onUpdate: (id: string, payload: { name?: string; description?: string }) => Promise<unknown>
  isPending?: boolean
}

export function SimpleRefDialog({
  open, onOpenChange, entityLabel, editRecord,
  onCreate, onUpdate, isPending = false,
}: Props) {
  const isEdit = !!editRecord

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: {
      name: editRecord?.name ?? '',
      description: editRecord?.description ?? '',
    },
  })

  async function onSubmit(data: FormData) {
    const payload = { name: data.name, description: data.description || '' }
    try {
      if (isEdit && editRecord) {
        await onUpdate(editRecord.id, payload)
        toast.success(`${entityLabel} updated.`)
      } else {
        await onCreate(payload)
        toast.success(`${entityLabel} created.`)
      }
      reset()
      onOpenChange(false)
    } catch {
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} ${entityLabel.toLowerCase()}.`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${entityLabel}` : `New ${entityLabel}`}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Update ${entityLabel.toLowerCase()} details.`
              : `Add a new ${entityLabel.toLowerCase()} to the catalog.`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Name" htmlFor="ref-name" required error={errors.name?.message}>
            <Input id="ref-name" autoFocus {...register('name')} />
          </FormField>
          <FormField label="Description" htmlFor="ref-desc" error={errors.description?.message}>
            <Textarea id="ref-desc" rows={2} placeholder="Optional description" {...register('description')} />
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
