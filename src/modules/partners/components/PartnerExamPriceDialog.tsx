import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Lock } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog, DialogContentLarge, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { FormField } from '@/components/shared/FormField'
import {
  useCreatePartnerExamPrice, useUpdatePartnerExamPrice,
} from '../api'
import { useExamDefinitions } from '@/modules/catalog/api'
import type { PartnerExamPriceItem } from '../types'
import type { ApiError } from '@/lib/api/types'

/**
 * Create / edit dialog for a negotiated exam price.
 *
 * Create mode
 *   User picks an active exam, enters an agreed price and optional notes.
 *   The partner id is fixed from the URL of the parent detail page.
 *
 * Edit mode
 *   The exam is locked (the (partner, exam) pair is immutable per the
 *   backend contract — see the ExamDefinition ``code`` immutability rule
 *   which this mirrors). Only agreed price and notes are editable.
 */

const schema = z.object({
  exam_definition_id: z.string().min(1, 'Exam is required'),
  agreed_price: z.string().min(1, 'Agreed price is required'),
  notes: z.string().optional().or(z.literal('')),
})

type FormData = z.input<typeof schema>

const FORM_FIELD_NAMES: readonly (keyof FormData)[] = [
  'exam_definition_id', 'agreed_price', 'notes',
]

function isFormField(name: string): name is keyof FormData {
  return (FORM_FIELD_NAMES as readonly string[]).includes(name)
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  partnerId: string
  /** When set, the dialog opens in edit mode and pre-fills from this row. */
  editPrice?: PartnerExamPriceItem | null
}

export function PartnerExamPriceDialog({
  open, onOpenChange, partnerId, editPrice,
}: Props) {
  const mode: 'create' | 'edit' = editPrice ? 'edit' : 'create'

  // Both mutations are instantiated unconditionally (Rules of Hooks) —
  // only the branch matching the current mode actually fires in onSubmit.
  const createMut = useCreatePartnerExamPrice(partnerId)
  const updateMut = useUpdatePartnerExamPrice(partnerId, editPrice?.id ?? '')

  // Exam catalog for the dropdown. Only active exams are offered in
  // create mode; in edit mode the field is locked so the list does not
  // need to include the frozen exam.
  const { data: examData } = useExamDefinitions({ is_active: 'true' })
  const exams = examData?.data ?? []

  const {
    register, handleSubmit, reset, setError, setValue, watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      exam_definition_id: editPrice?.exam_definition_id ?? '',
      agreed_price: editPrice?.agreed_price ?? '',
      notes: editPrice?.notes ?? '',
    },
  })

  const examId = watch('exam_definition_id')

  // In edit mode the exam cannot change — we already know its label, so
  // the ``items`` array is a single frozen entry. In create mode we
  // pull from the catalog list.
  const examItems = mode === 'edit' && editPrice
    ? [{ value: editPrice.exam_definition_id, label: `${editPrice.exam_code} — ${editPrice.exam_name}` }]
    : exams.map((e) => ({
      value: e.id,
      label: `${e.code} — ${e.name}`,
    }))

  async function onSubmit(data: FormData) {
    try {
      if (mode === 'edit' && editPrice) {
        await updateMut.mutateAsync({
          agreed_price: data.agreed_price,
          notes: data.notes ?? '',
        })
        toast.success('Agreed price updated.')
      } else {
        await createMut.mutateAsync({
          exam_definition_id: data.exam_definition_id,
          agreed_price: data.agreed_price,
          notes: data.notes ?? '',
        })
        toast.success('Agreed price created.')
      }
      reset()
      onOpenChange(false)
    } catch (err: unknown) {
      // Cytova envelope: { data:null, meta:null, errors:[{code,message,field,detail}] }
      // Field-scoped errors land on the matching RHF field; everything
      // else falls back to a toast so the user always gets feedback.
      const axiosErr = err as { response?: { data?: { errors?: ApiError[] } } }
      const apiErrors = axiosErr.response?.data?.errors ?? []
      const genericMsg = mode === 'edit'
        ? 'Failed to update agreed price.'
        : 'Failed to create agreed price.'

      if (apiErrors.length === 0) {
        toast.error(genericMsg)
        return
      }

      let fieldErrorsSet = false
      const nonFieldMessages: string[] = []
      for (const e of apiErrors) {
        if (e.field && isFormField(e.field)) {
          setError(e.field, { type: 'server', message: e.message })
          fieldErrorsSet = true
        } else {
          nonFieldMessages.push(e.message)
        }
      }

      if (nonFieldMessages.length > 0) {
        toast.error(nonFieldMessages.join(' '))
      } else if (!fieldErrorsSet) {
        toast.error(genericMsg)
      }
    }
  }

  const isPending = mode === 'edit' ? updateMut.isPending : createMut.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContentLarge>
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit Agreed Price' : 'New Agreed Price'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? 'Update the negotiated price or notes. The exam cannot be changed — deactivate and recreate to move the agreement.'
              : 'Record a negotiated price for an exam definition under this partner.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label="Exam"
            htmlFor="pep-exam"
            required
            error={errors.exam_definition_id?.message}
            hint={
              mode === 'edit'
                ? 'Immutable — agreements are scoped to a specific (partner, exam) pair.'
                : 'Select an active exam from the catalog.'
            }
            className="min-w-0"
          >
            <div className="relative">
              <Select
                value={examId}
                onValueChange={(v) => {
                  if (v) setValue('exam_definition_id', v, { shouldValidate: true })
                }}
                disabled={mode === 'edit'}
                items={examItems}
              >
                <SelectTrigger
                  id="pep-exam"
                  className={mode === 'edit' ? 'w-full pr-9' : 'w-full'}
                >
                  <SelectValue placeholder="Select exam" />
                </SelectTrigger>
                <SelectContent>
                  {examItems.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {mode === 'edit' && (
                <Lock
                  className="pointer-events-none absolute right-9 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"
                  aria-label="Locked"
                />
              )}
            </div>
          </FormField>

          <FormField
            label="Agreed price"
            htmlFor="pep-price"
            required
            error={errors.agreed_price?.message}
            hint="Negotiated unit price. Existing requests keep their snapshotted value."
          >
            <Input
              id="pep-price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register('agreed_price')}
            />
          </FormField>

          <FormField label="Notes" htmlFor="pep-notes" error={errors.notes?.message}>
            <Textarea
              id="pep-notes"
              rows={3}
              placeholder="Optional — rationale or negotiation context."
              {...register('notes')}
            />
          </FormField>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'edit' ? 'Save changes' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContentLarge>
    </Dialog>
  )
}
