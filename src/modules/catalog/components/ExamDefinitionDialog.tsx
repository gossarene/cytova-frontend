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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormField } from '@/components/shared/FormField'
import { useCreateExamDefinition } from '../api'
import { SAMPLE_TYPE_OPTIONS, type ExamCategoryListItem } from '../types'

const schema = z.object({
  category_id: z.string().min(1, 'Category is required'),
  code: z.string().min(1, 'Code is required').max(50),
  name: z.string().min(1, 'Name is required').max(255),
  sample_type: z.string().min(1, 'Sample type is required'),
  turnaround_hours: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  unit_price: z.string().optional().or(z.literal('')),
})

type FormData = z.input<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: ExamCategoryListItem[]
  preselectedCategoryId?: string | null
}

export function ExamDefinitionDialog({ open, onOpenChange, categories, preselectedCategoryId }: Props) {
  const mutation = useCreateExamDefinition()

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      category_id: preselectedCategoryId ?? '',
      code: '',
      name: '',
      sample_type: '',
      description: '',
      unit_price: '0',
    },
  })

  async function onSubmit(data: FormData) {
    try {
      await mutation.mutateAsync({
        ...data,
        unit_price: data.unit_price || '0',
        turnaround_hours: data.turnaround_hours ? parseInt(data.turnaround_hours, 10) : null,
      })
      toast.success(`Exam "${data.name}" created.`)
      reset()
      onOpenChange(false)
    } catch {
      toast.error('Failed to create exam definition.')
    }
  }

  const activeCategories = categories.filter((c) => c.is_active)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Exam Definition</DialogTitle>
          <DialogDescription>
            Define a new exam in your catalog. Code will be auto-uppercased and cannot be changed after use.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Category" htmlFor="exam-cat" required error={errors.category_id?.message}>
            <Select value={watch('category_id')} onValueChange={(v) => { if (v) setValue('category_id', v, { shouldValidate: true }) }}>
              <SelectTrigger id="exam-cat"><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {activeCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Code" htmlFor="exam-code" required error={errors.code?.message} hint="Unique identifier (e.g. CBC, GLU). Immutable after first use.">
              <Input id="exam-code" placeholder="CBC" className="uppercase" {...register('code')} />
            </FormField>
            <FormField label="Sample type" htmlFor="exam-sample" required error={errors.sample_type?.message}>
              <Select value={watch('sample_type')} onValueChange={(v) => { if (v) setValue('sample_type', v, { shouldValidate: true }) }}>
                <SelectTrigger id="exam-sample"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {SAMPLE_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <FormField label="Name" htmlFor="exam-name" required error={errors.name?.message}>
            <Input id="exam-name" placeholder="Complete Blood Count" {...register('name')} />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Unit price" htmlFor="exam-price" error={errors.unit_price?.message} hint="Reference catalog price.">
              <Input id="exam-price" type="number" step="0.01" min="0" placeholder="0.00" {...register('unit_price')} />
            </FormField>
            <FormField label="Turnaround (hours)" htmlFor="exam-tat" error={errors.turnaround_hours?.message}>
              <Input id="exam-tat" type="number" min="1" placeholder="e.g. 4" {...register('turnaround_hours')} />
            </FormField>
          </div>

          <FormField label="Description" htmlFor="exam-desc" error={errors.description?.message}>
            <Textarea id="exam-desc" rows={2} placeholder="Optional notes about this exam" {...register('description')} />
          </FormField>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Exam
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
