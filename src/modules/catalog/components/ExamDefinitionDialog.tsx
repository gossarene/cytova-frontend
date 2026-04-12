import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Lock } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormField } from '@/components/shared/FormField'
import {
  useCreateExamDefinition, useUpdateExamDefinition, useExamDefinition,
  useSubFamilies, useSampleTypes,
} from '../api'
import type { ExamFamilyItem } from '../types'
import type { ApiError } from '@/lib/api/types'

// Sentinel used to represent "no sub-family" inside the Select, which does
// not allow an empty string as an item value.
const SUB_FAMILY_NONE = '__none__'

const schema = z.object({
  family_id: z.string().min(1, 'Family is required'),
  sub_family_id: z.string().optional().default(''),
  code: z.string().min(1, 'Code is required').max(50),
  name: z.string().min(1, 'Name is required').max(255),
  sample_type: z.string().min(1, 'Sample type is required'),
  fasting_required: z.boolean().default(false),
  turnaround_hours: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  unit_price: z.string().optional().or(z.literal('')),
})

type FormData = z.input<typeof schema>

/**
 * Whitelist of form-field names. Used when mapping backend validation
 * errors onto RHF fields so we never blindly trust a ``field`` path coming
 * from the API — only known keys reach setError.
 */
const FORM_FIELD_NAMES: readonly (keyof FormData)[] = [
  'family_id', 'sub_family_id', 'code', 'name', 'sample_type',
  'fasting_required', 'turnaround_hours', 'description', 'unit_price',
]

function isFormField(name: string): name is keyof FormData {
  return (FORM_FIELD_NAMES as readonly string[]).includes(name)
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  families: ExamFamilyItem[]
  preselectedFamilyId?: string | null
  /**
   * When set, the dialog opens in edit mode for the given exam definition.
   * The detail is fetched lazily via ``useExamDefinition`` and the form
   * repopulates once the fetch resolves. Leave undefined/null for create mode.
   *
   * The parent is expected to pass a React ``key`` of the same id, so each
   * edit session gets a fresh dialog instance with clean form state.
   */
  editExamId?: string | null
}

const isEditMode = (id: string | null | undefined): id is string =>
  typeof id === 'string' && id.length > 0

export function ExamDefinitionDialog({
  open, onOpenChange, families, preselectedFamilyId, editExamId,
}: Props) {
  const createMut = useCreateExamDefinition()
  const updateMut = useUpdateExamDefinition(editExamId ?? '')
  const mode: 'create' | 'edit' = isEditMode(editExamId) ? 'edit' : 'create'

  // Lazy fetch of the exam detail when editing. ``useExamDefinition`` is
  // disabled internally when the id is falsy, so this is a no-op in create mode.
  const { data: editExam, isLoading: editLoading } = useExamDefinition(editExamId ?? '')

  const {
    register, handleSubmit, reset, setError, setValue, watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      family_id: preselectedFamilyId ?? '',
      sub_family_id: '',
      code: '',
      name: '',
      sample_type: '',
      fasting_required: false,
      description: '',
      unit_price: '0',
    },
  })

  const familyId = watch('family_id')
  const subFamilyId = watch('sub_family_id')
  const { data: subFamilies = [], isFetching: subFamiliesLoading } = useSubFamilies(
    familyId || undefined,
  )
  const { data: sampleTypes = [] } = useSampleTypes()

  // Clear sub-family when the user switches to a different family, so the
  // pair sent to the backend is always coherent. Skip the very first render
  // so a preselected family does not wipe an initial (future) value.
  const prevFamilyId = useRef(familyId)
  useEffect(() => {
    if (prevFamilyId.current !== familyId) {
      setValue('sub_family_id', '', { shouldValidate: false })
      prevFamilyId.current = familyId
    }
  }, [familyId, setValue])

  // Edit-mode hydration: once ``editExam`` arrives, splash its values into
  // the form state. A ref guard makes this a strict one-shot per mount — if
  // React Query refetches for any reason, we do NOT clobber in-progress user
  // edits. Combined with the parent's ``key={editExamId ?? 'new'}`` pattern,
  // each edit session gets a clean, stable hydration.
  const didHydrateRef = useRef(false)
  useEffect(() => {
    if (didHydrateRef.current) return
    if (mode !== 'edit' || !editExam) return

    reset({
      family_id: editExam.family?.id ?? '',
      sub_family_id: editExam.sub_family?.id ?? '',
      code: editExam.code,
      name: editExam.name,
      sample_type: editExam.sample_type,
      fasting_required: editExam.fasting_required,
      description: editExam.description ?? '',
      unit_price: editExam.unit_price ?? '0',
      turnaround_hours: editExam.turnaround_hours != null
        ? String(editExam.turnaround_hours)
        : '',
    })
    // Sync the family-change guard so the hydration does not itself
    // trigger the "family changed → clear sub-family" effect.
    prevFamilyId.current = editExam.family?.id ?? ''
    didHydrateRef.current = true
  }, [mode, editExam, reset])

  async function onSubmit(data: FormData) {
    try {
      if (mode === 'edit' && isEditMode(editExamId)) {
        // Code is intentionally NOT sent — the backend rejects any PATCH
        // that includes ``code``, and keeping it out of the payload keeps
        // the intent of the frontend explicit.
        await updateMut.mutateAsync({
          family_id: data.family_id,
          sub_family_id: data.sub_family_id ? data.sub_family_id : null,
          name: data.name,
          sample_type: data.sample_type,
          fasting_required: data.fasting_required,
          unit_price: data.unit_price || '0',
          turnaround_hours: data.turnaround_hours ? parseInt(data.turnaround_hours, 10) : null,
          description: data.description || '',
        })
        toast.success(`Exam "${data.name}" updated.`)
      } else {
        await createMut.mutateAsync({
          family_id: data.family_id,
          sub_family_id: data.sub_family_id ? data.sub_family_id : null,
          code: data.code,
          name: data.name,
          sample_type: data.sample_type,
          fasting_required: data.fasting_required,
          unit_price: data.unit_price || '0',
          turnaround_hours: data.turnaround_hours ? parseInt(data.turnaround_hours, 10) : null,
          description: data.description || '',
        })
        toast.success(`Exam "${data.name}" created.`)
      }
      reset()
      onOpenChange(false)
    } catch (err: unknown) {
      // Cytova backend errors come in the envelope
      //   { data: null, meta: null, errors: [{ code, message, field, detail }] }
      // Entries with a ``field`` path land on the matching RHF field; the
      // rest are surfaced as a toast so the user still gets feedback. Only
      // true non-envelope failures (network, 500) fall through to the
      // generic message.
      const axiosErr = err as { response?: { data?: { errors?: ApiError[] } } }
      const apiErrors = axiosErr.response?.data?.errors ?? []
      const genericMsg = mode === 'edit'
        ? 'Failed to update exam definition.'
        : 'Failed to create exam definition.'

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

  const activeFamilies = families.filter((f) => f.is_active)
  const subFamilySelectValue = subFamilyId || SUB_FAMILY_NONE
  const subFamilyPlaceholder = familyId
    ? 'Select sub-family (optional)'
    : 'Select a family first'

  const isPending = mode === 'edit' ? updateMut.isPending : createMut.isPending
  // While the initial edit-mode detail fetch is in flight, hide the form
  // behind a spinner so the user never sees empty defaults momentarily.
  const showLoadingShell = mode === 'edit' && editLoading && !editExam

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* ``max-w-2xl`` gives the two-column rows enough breathing room for
          long family / sub-family names. ``max-h-[90vh] overflow-y-auto``
          keeps the dialog scrollable inside tight viewports instead of
          clipping the footer. */}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit Exam Definition' : 'New Exam Definition'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? 'Update the exam metadata and reference price. The code is locked and cannot be changed.'
              : 'Define a new exam in your catalog. Code will be auto-uppercased and cannot be changed after use.'}
          </DialogDescription>
        </DialogHeader>
        {showLoadingShell ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading exam…
          </div>
        ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Family"
              htmlFor="exam-family"
              required
              error={errors.family_id?.message}
              className="min-w-0"
            >
              <Select
                value={familyId}
                onValueChange={(v) => { if (v) setValue('family_id', v, { shouldValidate: true }) }}
                // Base UI ``items`` makes <SelectValue> render the selected
                // family's name in the closed trigger instead of the UUID.
                items={activeFamilies.map((f) => ({ value: f.id, label: f.name }))}
              >
                {/* ``w-full`` overrides shadcn's default ``w-fit`` so the
                    trigger fills its grid cell instead of growing with the
                    longest label, and the built-in ``line-clamp-1`` on
                    SelectValue clips long names with an ellipsis. */}
                <SelectTrigger id="exam-family" className="w-full">
                  <SelectValue placeholder="Select family" />
                </SelectTrigger>
                <SelectContent>
                  {activeFamilies.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField
              label="Sub-family"
              htmlFor="exam-subfamily"
              error={errors.sub_family_id?.message}
              hint={
                familyId && !subFamiliesLoading && subFamilies.length === 0
                  ? 'No sub-families defined for this family — leave empty.'
                  : 'Optional. Filtered by the selected family.'
              }
              className="min-w-0"
            >
              <Select
                value={subFamilySelectValue}
                onValueChange={(v) => {
                  const next = v && v !== SUB_FAMILY_NONE ? v : ''
                  setValue('sub_family_id', next, { shouldValidate: true })
                }}
                disabled={!familyId || subFamiliesLoading}
                // Includes the SUB_FAMILY_NONE sentinel so the trigger renders
                // "None" when the user clears the field, and the dynamic
                // sub-family options so it renders each one's name.
                items={[
                  { value: SUB_FAMILY_NONE, label: 'None' },
                  ...subFamilies.map((sf) => ({ value: sf.id, label: sf.name })),
                ]}
              >
                <SelectTrigger id="exam-subfamily" className="w-full">
                  <SelectValue placeholder={subFamilyPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SUB_FAMILY_NONE}>None</SelectItem>
                  {subFamilies.map((sf) => (
                    <SelectItem key={sf.id} value={sf.id}>{sf.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Code"
              htmlFor="exam-code"
              required
              error={errors.code?.message}
              hint={
                mode === 'edit'
                  ? 'Immutable identifier — locked after creation.'
                  : 'Unique identifier (e.g. CBC, GLU). Immutable after first use.'
              }
              className="min-w-0"
            >
              <div className="relative">
                <Input
                  id="exam-code"
                  placeholder="CBC"
                  className={mode === 'edit' ? 'uppercase pr-9' : 'uppercase'}
                  disabled={mode === 'edit'}
                  readOnly={mode === 'edit'}
                  {...register('code')}
                />
                {mode === 'edit' && (
                  <Lock
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"
                    aria-label="Locked"
                  />
                )}
              </div>
            </FormField>
            <FormField
              label="Sample type"
              htmlFor="exam-sample"
              required
              error={errors.sample_type?.message}
              className="min-w-0"
            >
              <Select
                value={watch('sample_type')}
                onValueChange={(v) => { if (v) setValue('sample_type', v, { shouldValidate: true }) }}
                // ``sampleTypes`` already has {value, label} shape from useSampleTypes().
                items={sampleTypes}
              >
                <SelectTrigger id="exam-sample" className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {sampleTypes.map((o) => (
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
            <FormField
              label="Unit price"
              htmlFor="exam-price"
              error={errors.unit_price?.message}
              hint="Reference catalog price. Existing requests keep their snapshotted price."
              className="min-w-0"
            >
              <Input id="exam-price" type="number" step="0.01" min="0" placeholder="0.00" {...register('unit_price')} />
            </FormField>
            <FormField
              label="Turnaround (hours)"
              htmlFor="exam-tat"
              error={errors.turnaround_hours?.message}
              className="min-w-0"
            >
              <Input id="exam-tat" type="number" min="1" placeholder="e.g. 4" {...register('turnaround_hours')} />
            </FormField>
          </div>

          <FormField label="Fasting required" htmlFor="exam-fasting" hint="Patient must fast before specimen collection.">
            <Select
              value={watch('fasting_required') ? 'yes' : 'no'}
              onValueChange={(v) => setValue('fasting_required', v === 'yes')}
              items={[
                { value: 'no', label: 'No' },
                { value: 'yes', label: 'Yes' },
              ]}
            >
              <SelectTrigger id="exam-fasting" className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Description" htmlFor="exam-desc" error={errors.description?.message}>
            <Textarea id="exam-desc" rows={2} placeholder="Optional notes about this exam" {...register('description')} />
          </FormField>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'edit' ? 'Save changes' : 'Create Exam'}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
