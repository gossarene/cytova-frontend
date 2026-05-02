import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/shared/FormField'
import { useLinkCytovaIdentity } from '../api'
import type { PatientDetail } from '../types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The local patient whose identity we're linking. ``first_name``,
   *  ``last_name``, ``date_of_birth`` are pre-filled from this row so
   *  the operator typically only types the Cytova ID. */
  patient: PatientDetail
}

/**
 * "Add Cytova identity" modal.
 *
 * Pre-fill rule
 * -------------
 * The form pre-fills three identity fields from the local patient
 * record. The operator can adjust them — useful when the patient
 * registered on Cytova under a slightly different spelling — but the
 * backend re-runs the full identity check against the global
 * ``PatientAccount``. Pre-fill is convenience only, not a security
 * trust boundary.
 *
 * Failure surface
 * ---------------
 * On 400 ``IDENTITY_VERIFICATION_FAILED`` we surface a single
 * non-distinguishing toast. Telling the operator *which* field failed
 * would turn this dialog into an enumeration oracle against global
 * patient identity — same policy as Notify-Cytova's existing flow.
 */

const _schema = z.object({
  cytova_patient_id: z.string()
    .trim()
    .min(4, 'Cytova ID is too short.')
    .max(32),
  first_name: z.string().trim().min(1, 'First name is required.'),
  last_name: z.string().trim().min(1, 'Last name is required.'),
  date_of_birth: z.string()
    .min(1, 'Date of birth is required.')
    // ISO date string from <input type="date"> — backend re-validates.
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the date picker.'),
})

type FormValues = z.infer<typeof _schema>

export function LinkCytovaIdentityDialog({
  open, onOpenChange, patient,
}: Props) {
  const linkMut = useLinkCytovaIdentity(patient.id)

  const form = useForm<FormValues>({
    resolver: zodResolver(_schema),
    defaultValues: {
      cytova_patient_id: '',
      first_name: patient.first_name,
      last_name: patient.last_name,
      date_of_birth: patient.date_of_birth,
    },
  })
  const { register, handleSubmit, reset, formState } = form

  // Re-prime the prefill when the dialog opens or the patient
  // changes. Without this, a closed-then-reopened dialog would still
  // hold whatever the operator last typed — which is fine for a
  // failed attempt (they want to fix the typo) but stale for the
  // typical "open dialog → submit → success → close → next patient"
  // flow. Resetting on open guarantees the operator always starts
  // from the prefill baseline.
  useEffect(() => {
    if (open) {
      reset({
        cytova_patient_id: '',
        first_name: patient.first_name,
        last_name: patient.last_name,
        date_of_birth: patient.date_of_birth,
      })
    }
  }, [open, patient.id, patient.first_name, patient.last_name, patient.date_of_birth, reset])

  async function onSubmit(values: FormValues) {
    try {
      await linkMut.mutateAsync(values)
      toast.success('Cytova identity linked.')
      onOpenChange(false)
    } catch (err: unknown) {
      const apiErr = err as {
        response?: { data?: { errors?: { code?: string; message?: string }[] } }
      }
      const first = apiErr.response?.data?.errors?.[0]
      if (first?.code === 'IDENTITY_VERIFICATION_FAILED') {
        // Generic message — no info about which field failed. Same
        // policy as Notify-Cytova: never let this flow become an
        // enumeration oracle for global patient identity.
        toast.error(
          'Identity verification failed. Please check the Cytova ID or '
          + 'patient information.',
        )
      } else if (first?.code === 'ALREADY_LINKED') {
        // Defensive — the unlinked-state UI hides this dialog when
        // already linked, so this only fires on a stale page where
        // someone else just linked the same patient.
        toast.error(
          'This patient is already linked to a Cytova account. '
          + 'Refresh the page to see the current state.',
        )
        onOpenChange(false)
      } else {
        toast.error(first?.message || 'Could not link the Cytova identity.')
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Cytova identity</DialogTitle>
          <DialogDescription>
            Enter the patient's Cytova Patient ID. Their first name,
            last name, and date of birth are pre-filled from the
            patient record — adjust them only if they differ from how
            the patient registered on Cytova.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <FormField
            label="Cytova Patient ID"
            htmlFor="cytova_patient_id"
            required
            hint="Format: CV-XXXX-XXXX"
            error={formState.errors.cytova_patient_id?.message}
          >
            <Input
              id="cytova_patient_id"
              autoFocus
              autoComplete="off"
              placeholder="CV-XXXX-XXXX"
              {...register('cytova_patient_id')}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="First name"
              htmlFor="link_first_name"
              required
              error={formState.errors.first_name?.message}
            >
              <Input
                id="link_first_name"
                autoComplete="off"
                {...register('first_name')}
              />
            </FormField>
            <FormField
              label="Last name"
              htmlFor="link_last_name"
              required
              error={formState.errors.last_name?.message}
            >
              <Input
                id="link_last_name"
                autoComplete="off"
                {...register('last_name')}
              />
            </FormField>
          </div>

          <FormField
            label="Date of birth"
            htmlFor="link_date_of_birth"
            required
            error={formState.errors.date_of_birth?.message}
          >
            <Input
              id="link_date_of_birth"
              type="date"
              {...register('date_of_birth')}
            />
          </FormField>

          <DialogFooter>
            <Button
              type="button" variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={linkMut.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={linkMut.isPending}>
              {linkMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Link identity
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
