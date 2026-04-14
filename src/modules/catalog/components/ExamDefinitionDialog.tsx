import { useEffect, useRef } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Lock, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog, DialogContentLarge, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormField } from '@/components/shared/FormField'
import {
  useCreateExamDefinition, useUpdateExamDefinition, useExamDefinition,
  useSubFamilies, useSampleTypes, useTechniques,
} from '../api'
import type { ExamFamilyItem } from '../types'
import type { ApiError } from '@/lib/api/types'

const SUB_FAMILY_NONE = '__none__'

const paramSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  unit: z.string().optional().default(''),
  reference_range: z.string().optional().default(''),
})

const schema = z.object({
  family_id: z.string().min(1, 'Family is required'),
  sub_family_id: z.string().optional().default(''),
  technique_id: z.string().min(1, 'Technique is required'),
  code: z.string().min(1, 'Code is required').max(50),
  name: z.string().min(1, 'Name is required').max(255),
  sample_type: z.string().min(1, 'Sample type is required'),
  result_structure: z.enum(['SINGLE_VALUE', 'MULTI_PARAMETER']).default('SINGLE_VALUE'),
  unit: z.string().optional().default(''),
  reference_range: z.string().optional().default(''),
  fasting_required: z.boolean().default(false),
  turnaround_hours: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  unit_price: z.string().optional().or(z.literal('')),
  parameters: z.array(paramSchema).default([]),
}).superRefine((data, ctx) => {
  if (data.result_structure === 'SINGLE_VALUE' && !data.unit?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Unit is required for single-value exams.',
      path: ['unit'],
    })
  }
  if (data.result_structure === 'MULTI_PARAMETER' && data.parameters.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least one parameter is required for multi-parameter exams.',
      path: ['parameters'],
    })
  }
})

type FormData = z.input<typeof schema>

const FORM_FIELD_NAMES: readonly string[] = [
  'family_id', 'sub_family_id', 'technique_id', 'code', 'name',
  'sample_type', 'result_structure', 'unit', 'reference_range',
  'fasting_required', 'turnaround_hours', 'description', 'unit_price',
  'parameters',
]

function isFormField(name: string): boolean {
  return FORM_FIELD_NAMES.includes(name)
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  families: ExamFamilyItem[]
  preselectedFamilyId?: string | null
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
  const { data: editExam, isLoading: editLoading } = useExamDefinition(editExamId ?? '')

  const {
    register, handleSubmit, reset, setError, setValue, watch, control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      family_id: preselectedFamilyId ?? '',
      sub_family_id: '',
      technique_id: '',
      code: '',
      name: '',
      sample_type: '',
      result_structure: 'SINGLE_VALUE',
      unit: '',
      reference_range: '',
      fasting_required: false,
      description: '',
      unit_price: '0',
      parameters: [],
    },
  })

  const { fields: paramFields, append: addParam, remove: removeParam } = useFieldArray({
    control,
    name: 'parameters',
  })

  const familyId = watch('family_id')
  const subFamilyId = watch('sub_family_id')
  const resultStructure = watch('result_structure')
  const { data: subFamilies = [], isFetching: subFamiliesLoading } = useSubFamilies(
    familyId || undefined,
  )
  const { data: sampleTypes = [] } = useSampleTypes()
  const { data: techniques = [] } = useTechniques({ is_active: 'true' })

  const prevFamilyId = useRef(familyId)
  useEffect(() => {
    if (prevFamilyId.current !== familyId) {
      setValue('sub_family_id', '', { shouldValidate: false })
      prevFamilyId.current = familyId
    }
  }, [familyId, setValue])

  const didHydrateRef = useRef(false)
  useEffect(() => {
    if (didHydrateRef.current) return
    if (mode !== 'edit' || !editExam) return

    reset({
      family_id: editExam.family?.id ?? '',
      sub_family_id: editExam.sub_family?.id ?? '',
      technique_id: editExam.technique?.id ?? '',
      code: editExam.code,
      name: editExam.name,
      sample_type: editExam.sample_type,
      result_structure: editExam.result_structure ?? 'SINGLE_VALUE',
      unit: editExam.unit ?? '',
      reference_range: editExam.reference_range ?? '',
      fasting_required: editExam.fasting_required,
      description: editExam.description ?? '',
      unit_price: editExam.unit_price ?? '0',
      turnaround_hours: editExam.turnaround_hours != null
        ? String(editExam.turnaround_hours)
        : '',
      parameters: (editExam.parameters ?? [])
        .filter((p) => p.is_active)
        .map((p) => ({
          code: p.code,
          name: p.name,
          unit: p.unit,
          reference_range: p.reference_range,
        })),
    })
    prevFamilyId.current = editExam.family?.id ?? ''
    didHydrateRef.current = true
  }, [mode, editExam, reset])

  async function onSubmit(data: FormData) {
    const params = data.result_structure === 'MULTI_PARAMETER'
      ? (data.parameters ?? []).map((p, i) => ({ ...p, display_order: i + 1 }))
      : []

    try {
      if (mode === 'edit' && isEditMode(editExamId)) {
        await updateMut.mutateAsync({
          family_id: data.family_id,
          sub_family_id: data.sub_family_id ? data.sub_family_id : null,
          technique_id: data.technique_id,
          name: data.name,
          sample_type: data.sample_type,
          unit: data.unit || '',
          reference_range: data.reference_range || '',
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
          technique_id: data.technique_id,
          code: data.code,
          name: data.name,
          sample_type: data.sample_type,
          result_structure: data.result_structure,
          unit: data.unit || '',
          reference_range: data.reference_range || '',
          fasting_required: data.fasting_required,
          unit_price: data.unit_price || '0',
          turnaround_hours: data.turnaround_hours ? parseInt(data.turnaround_hours, 10) : null,
          description: data.description || '',
          parameters: params,
        })
        toast.success(`Exam "${data.name}" created.`)
      }
      reset()
      onOpenChange(false)
    } catch (err: unknown) {
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
          setError(e.field as keyof FormData, { type: 'server', message: e.message })
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
  const showLoadingShell = mode === 'edit' && editLoading && !editExam
  const isSingleValue = resultStructure === 'SINGLE_VALUE'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContentLarge>
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit Exam Definition' : 'New Exam Definition'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? 'Update the exam metadata and reference price. Code and result structure are locked.'
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
          {/* Row 1: Family + Sub-family */}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Family" htmlFor="exam-family" required error={errors.family_id?.message} className="min-w-0">
              <Select
                value={familyId}
                onValueChange={(v) => { if (v) setValue('family_id', v, { shouldValidate: true }) }}
                items={activeFamilies.map((f) => ({ value: f.id, label: f.name }))}
              >
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
              label="Sub-family" htmlFor="exam-subfamily"
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

          {/* Row 2: Code + Sample type */}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Code" htmlFor="exam-code" required
              error={errors.code?.message}
              hint={mode === 'edit' ? 'Immutable identifier — locked after creation.' : 'Unique identifier (e.g. CBC, GLU).'}
              className="min-w-0"
            >
              <div className="relative">
                <Input
                  id="exam-code" placeholder="CBC"
                  className={mode === 'edit' ? 'uppercase pr-9' : 'uppercase'}
                  disabled={mode === 'edit'} readOnly={mode === 'edit'}
                  {...register('code')}
                />
                {mode === 'edit' && (
                  <Lock className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
            </FormField>
            <FormField label="Sample type" htmlFor="exam-sample" required error={errors.sample_type?.message} className="min-w-0">
              <Select
                value={watch('sample_type')}
                onValueChange={(v) => { if (v) setValue('sample_type', v, { shouldValidate: true }) }}
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

          {/* Row 3: Technique + Result structure */}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Technique" htmlFor="exam-technique" required error={errors.technique_id?.message} className="min-w-0">
              <Select
                value={watch('technique_id')}
                onValueChange={(v) => { if (v) setValue('technique_id', v, { shouldValidate: true }) }}
                items={techniques.map((t) => ({ value: t.id, label: t.name }))}
              >
                <SelectTrigger id="exam-technique" className="w-full">
                  <SelectValue placeholder="Select technique" />
                </SelectTrigger>
                <SelectContent>
                  {techniques.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField
              label="Result structure" htmlFor="exam-structure" required
              error={errors.result_structure?.message}
              hint={mode === 'edit' ? 'Locked after creation.' : undefined}
              className="min-w-0"
            >
              <Select
                value={resultStructure}
                onValueChange={(v) => {
                  if (v && mode === 'create') {
                    setValue('result_structure', v as 'SINGLE_VALUE' | 'MULTI_PARAMETER', { shouldValidate: true })
                  }
                }}
                disabled={mode === 'edit'}
                items={[
                  { value: 'SINGLE_VALUE', label: 'Single Value' },
                  { value: 'MULTI_PARAMETER', label: 'Multi-Parameter' },
                ]}
              >
                <SelectTrigger id="exam-structure" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SINGLE_VALUE">Single Value</SelectItem>
                  <SelectItem value="MULTI_PARAMETER">Multi-Parameter</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          {/* Conditional: Single-value fields */}
          {isSingleValue && (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Unit" htmlFor="exam-unit" required error={errors.unit?.message} className="min-w-0">
                <Input id="exam-unit" placeholder="e.g. g/dL" {...register('unit')} />
              </FormField>
              <FormField label="Reference range" htmlFor="exam-ref" error={errors.reference_range?.message} className="min-w-0">
                <Input id="exam-ref" placeholder="e.g. 12.0–16.0" {...register('reference_range')} />
              </FormField>
            </div>
          )}

          {/* Conditional: Multi-parameter rows */}
          {!isSingleValue && (
            <div className="space-y-3">
              <Separator />
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Parameters</p>
                {mode === 'create' && (
                  <Button
                    type="button" size="sm" variant="outline" className="gap-1.5 text-xs h-7"
                    onClick={() => addParam({ code: '', name: '', unit: '', reference_range: '' })}
                  >
                    <Plus className="h-3 w-3" /> Add Parameter
                  </Button>
                )}
              </div>
              {errors.parameters && typeof errors.parameters.message === 'string' && (
                <p className="text-xs text-destructive">{errors.parameters.message}</p>
              )}
              {paramFields.length === 0 && (
                <p className="text-xs text-muted-foreground py-2">No parameters defined yet.</p>
              )}
              {paramFields.map((field, index) => (
                <div key={field.id} className="grid gap-2 sm:grid-cols-[1fr_1.5fr_0.8fr_1fr_auto] items-end border rounded-lg p-3">
                  <FormField label="Code" htmlFor={`param-code-${index}`} error={errors.parameters?.[index]?.code?.message}>
                    <Input id={`param-code-${index}`} placeholder="WBC" className="uppercase" {...register(`parameters.${index}.code`)} />
                  </FormField>
                  <FormField label="Name" htmlFor={`param-name-${index}`} error={errors.parameters?.[index]?.name?.message}>
                    <Input id={`param-name-${index}`} placeholder="White Blood Cells" {...register(`parameters.${index}.name`)} />
                  </FormField>
                  <FormField label="Unit" htmlFor={`param-unit-${index}`}>
                    <Input id={`param-unit-${index}`} placeholder="10³/µL" {...register(`parameters.${index}.unit`)} />
                  </FormField>
                  <FormField label="Ref. range" htmlFor={`param-ref-${index}`}>
                    <Input id={`param-ref-${index}`} placeholder="4.5–11.0" {...register(`parameters.${index}.reference_range`)} />
                  </FormField>
                  <Button
                    type="button" size="sm" variant="ghost"
                    className="text-destructive hover:text-destructive h-8 w-8 p-0"
                    onClick={() => removeParam(index)}
                    title="Remove parameter"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Pricing + TAT */}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Unit price" htmlFor="exam-price"
              error={errors.unit_price?.message}
              hint="Reference catalog price."
              className="min-w-0"
            >
              <Input id="exam-price" type="number" step="0.01" min="0" placeholder="0.00" {...register('unit_price')} />
            </FormField>
            <FormField label="Turnaround (hours)" htmlFor="exam-tat" error={errors.turnaround_hours?.message} className="min-w-0">
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
      </DialogContentLarge>
    </Dialog>
  )
}
