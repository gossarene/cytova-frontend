import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Send } from 'lucide-react'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/shared/FormField'
import { useNotifyCytova } from '../api'
import type { ApiError } from '@/lib/api/types'

const schema = z.object({
  cytova_patient_id: z
    .string()
    .min(8, 'Cytova ID looks too short')
    .max(32),
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  date_of_birth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine((v) => !Number.isNaN(Date.parse(v)) && new Date(v) <= new Date(), {
      message: 'Date of birth cannot be in the future',
    }),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  requestId: string
}

interface ApiErrorShape {
  response?: { data?: { errors?: ApiError[] }; status?: number }
}

function extractError(err: unknown): { code?: string; message: string } {
  const axiosErr = err as ApiErrorShape
  const apiErrors = axiosErr.response?.data?.errors
  if (apiErrors?.length) {
    const first = apiErrors[0]
    return { code: first.code, message: first.message }
  }
  if (axiosErr.response?.status === 429) {
    return { message: 'Too many attempts. Please wait a moment and try again.' }
  }
  return { message: 'Could not share result. Please try again.' }
}

export function NotifyCytovaDialog({ open, onOpenChange, requestId }: Props) {
  const mutation = useNotifyCytova(requestId)

  const {
    register, handleSubmit, reset, formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      cytova_patient_id: '',
      first_name: '',
      last_name: '',
      date_of_birth: '',
    },
  })

  // Reset on open so a previous attempt doesn't leak across modals.
  useEffect(() => {
    if (open) reset()
  }, [open, reset])

  const [serverError, setServerError] = useState<string | null>(null)

  async function onSubmit(values: FormValues) {
    setServerError(null)
    try {
      const res = await mutation.mutateAsync({
        cytova_patient_id: values.cytova_patient_id.trim().toUpperCase(),
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        date_of_birth: values.date_of_birth,
      })
      // The share itself succeeded either way; only the patient
      // notification email may have failed. Surface the difference so
      // the lab user knows whether to follow up out-of-band.
      if (res.email_notification === 'FAILED') {
        toast.warning(
          "Result shared with patient — but we couldn't send the email notification.",
        )
      } else {
        toast.success("Result sent to patient's Cytova account.")
      }
      onOpenChange(false)
    } catch (err) {
      const { code, message } = extractError(err)
      // Per spec: never tell the lab user which field failed. Use the
      // generic copy regardless of which sub-cause the backend cited.
      // Distinct-but-still-useful messages for non-verification gates
      // (request not validated, no report) keep the UX honest about
      // why the share didn't proceed.
      if (code === 'IDENTITY_VERIFICATION_FAILED') {
        setServerError('Identity verification failed.')
      } else {
        setServerError(message)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Notify Cytova</DialogTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask the patient for their Cytova ID or digital card.
          </p>
        </DialogHeader>

        {serverError && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
          >
            {serverError}
          </div>
        )}

        <form id="notify-cytova-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FormField
            label="Cytova Patient ID" htmlFor="cytova_patient_id" required
            error={errors.cytova_patient_id?.message}
            hint="Format: CV-XXXX-XXXX (case-insensitive)."
          >
            <Input
              id="cytova_patient_id"
              placeholder="CV-XXXX-XXXX"
              autoComplete="off" autoCapitalize="characters"
              className="font-mono uppercase"
              {...register('cytova_patient_id')}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="First name" htmlFor="first_name" required error={errors.first_name?.message}>
              <Input id="first_name" autoComplete="off" {...register('first_name')} />
            </FormField>
            <FormField label="Last name" htmlFor="last_name" required error={errors.last_name?.message}>
              <Input id="last_name" autoComplete="off" {...register('last_name')} />
            </FormField>
          </div>

          <FormField label="Date of birth" htmlFor="date_of_birth" required error={errors.date_of_birth?.message}>
            <Input id="date_of_birth" type="date" {...register('date_of_birth')} />
          </FormField>
        </form>

        <DialogFooter>
          <Button
            type="button" variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting || mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit" form="notify-cytova-form"
            disabled={isSubmitting || mutation.isPending}
            className="gap-2"
          >
            {(isSubmitting || mutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
            <Send className="h-4 w-4" />
            Verify &amp; Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
