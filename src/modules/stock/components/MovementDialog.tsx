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
import { useRecordMovement } from '../api'
import { MOVEMENT_TYPE_OPTIONS, REQUIRES_REASON } from '../types'
import type { MovementType } from '../types'

const schema = z.object({
  movement_type: z.string().min(1, 'Required'),
  quantity: z.string().min(1, 'Required'),
  reason: z.string().optional().or(z.literal('')),
  reference: z.string().optional().or(z.literal('')),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  lotId: string
  currentQuantity: number
}

export function MovementDialog({ open, onOpenChange, lotId, currentQuantity }: Props) {
  const mutation = useRecordMovement(lotId)

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { movement_type: '', quantity: '', reason: '', reference: '' },
  })

  const type = watch('movement_type') as MovementType
  const needsReason = REQUIRES_REASON.includes(type)
  const isDecrease = ['OUT', 'ADJUSTMENT_OUT', 'LOSS'].includes(type)

  async function onSubmit(data: FormData) {
    if (needsReason && !data.reason?.trim()) {
      toast.error('Reason is required for this movement type.')
      return
    }
    try {
      await mutation.mutateAsync({
        movement_type: data.movement_type,
        quantity: data.quantity,
        reason: data.reason,
        reference: data.reference,
      })
      toast.success('Movement recorded.')
      reset()
      onOpenChange(false)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { errors?: Array<{ message: string }> } } })
        ?.response?.data?.errors?.[0]?.message
      toast.error(msg || 'Failed to record movement.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Stock Movement</DialogTitle>
          <DialogDescription>
            Current quantity: <span className="font-semibold tabular-nums">{currentQuantity}</span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Movement type" htmlFor="mv-type" required error={errors.movement_type?.message}>
            <Select value={watch('movement_type')} onValueChange={(v) => { if (v) setValue('movement_type', v, { shouldValidate: true }) }}>
              <SelectTrigger id="mv-type"><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                {MOVEMENT_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.direction === 'in' ? '+ ' : '- '}{o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Quantity" htmlFor="mv-qty" required error={errors.quantity?.message}
            hint={isDecrease ? `Max: ${currentQuantity}` : undefined}>
            <Input id="mv-qty" type="number" step="0.0001" min="0.0001"
              max={isDecrease ? currentQuantity : undefined}
              placeholder="0" className="font-mono" {...register('quantity')} />
          </FormField>

          <FormField label="Reason" htmlFor="mv-reason" required={needsReason} error={errors.reason?.message}
            hint={needsReason ? 'Required for adjustments and losses.' : 'Optional context.'}>
            <Textarea id="mv-reason" rows={2} placeholder="Explain the reason..." {...register('reason')} />
          </FormField>

          <FormField label="Reference" htmlFor="mv-ref" error={errors.reference?.message}
            hint="Optional link to a request or PO number.">
            <Input id="mv-ref" placeholder="e.g. REQ-2026-ABCD" {...register('reference')} />
          </FormField>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Movement
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
