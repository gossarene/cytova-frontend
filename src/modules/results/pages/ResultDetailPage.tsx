import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  FlaskConical, Edit, AlertTriangle, Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ErrorState } from '@/components/shared/ErrorState'
import { FormField } from '@/components/shared/FormField'
import { CardSkeleton } from '@/components/shared/LoadingSkeleton'
import { Can } from '@/lib/permissions/Can'
import { P } from '@/lib/permissions/constants'
import { ResultActions } from '../components/ResultActions'
import { ResultFileList } from '../components/ResultFileList'
import { useResult, useUpdateResult } from '../api'
import { formatDateTime } from '@/lib/utils/date'
import { ROUTES } from '@/config/routes'

const editSchema = z.object({
  result_value: z.string().optional().or(z.literal('')),
  result_unit: z.string().optional().or(z.literal('')),
  reference_range: z.string().optional().or(z.literal('')),
  is_abnormal: z.boolean(),
  comments: z.string().optional().or(z.literal('')),
  internal_notes: z.string().optional().or(z.literal('')),
})

type EditForm = z.infer<typeof editSchema>

export function ResultDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: result, isLoading, error, refetch } = useResult(id!)
  const updateMut = useUpdateResult(id!)
  const [editing, setEditing] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    values: result ? {
      result_value: result.result_value,
      result_unit: result.result_unit,
      reference_range: result.reference_range,
      is_abnormal: result.is_abnormal,
      comments: result.comments,
      internal_notes: result.internal_notes,
    } : undefined,
  })

  if (error) return <ErrorState onRetry={refetch} />
  if (isLoading || !result) return <div className="space-y-6"><CardSkeleton /><CardSkeleton /></div>

  const isDraft = result.status === 'DRAFT'

  async function onSave(data: EditForm) {
    try {
      await updateMut.mutateAsync(data)
      toast.success('Result updated.')
      setEditing(false)
    } catch { toast.error('Failed to update.') }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${result.exam_code} — ${result.exam_name}`}
        breadcrumbs={[
          { label: 'Results', href: ROUTES.RESULTS },
          { label: result.exam_code },
        ]}
      >
        {isDraft && !editing && (
          <Can permission={P.RESULTS_UPDATE}>
            <Button variant="outline" className="gap-2" onClick={() => setEditing(true)}>
              <Edit className="h-4 w-4" /> Edit
            </Button>
          </Can>
        )}
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FlaskConical className="h-4 w-4 text-muted-foreground" />
                  Result Data
                </CardTitle>
                <div className="flex items-center gap-2">
                  <StatusBadge status={result.status} />
                  {result.is_abnormal && (
                    <Badge variant="outline" className="border-red-200 bg-red-50 text-red-600 text-xs gap-1">
                      <AlertTriangle className="h-3 w-3" /> Abnormal
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {editing ? (
                <form onSubmit={handleSubmit(onSave)} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <FormField label="Result value" htmlFor="result_value" error={errors.result_value?.message}>
                      <Input id="result_value" placeholder="e.g. 5.2" className="font-mono" autoFocus {...register('result_value')} />
                    </FormField>
                    <FormField label="Unit" htmlFor="result_unit" error={errors.result_unit?.message}>
                      <Input id="result_unit" placeholder="e.g. mmol/L" {...register('result_unit')} />
                    </FormField>
                    <FormField label="Reference range" htmlFor="reference_range" error={errors.reference_range?.message}>
                      <Input id="reference_range" placeholder="e.g. 3.9–5.6" {...register('reference_range')} />
                    </FormField>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      id="is_abnormal"
                      checked={watch('is_abnormal')}
                      onCheckedChange={(v) => setValue('is_abnormal', v)}
                    />
                    <Label htmlFor="is_abnormal" className="text-sm">Flag as abnormal</Label>
                  </div>
                  <FormField label="Comments" htmlFor="comments" hint="Visible on the result document sent to the patient.">
                    <Textarea id="comments" rows={2} {...register('comments')} />
                  </FormField>
                  <FormField label="Internal notes" htmlFor="internal_notes" hint="Lab-internal only. Not visible to patients.">
                    <Textarea id="internal_notes" rows={2} {...register('internal_notes')} />
                  </FormField>
                  <div className="flex gap-3 justify-end pt-2">
                    <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                    <Button type="submit" disabled={updateMut.isPending}>
                      {updateMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  {/* Result value display */}
                  <div className="rounded-lg bg-muted/50 px-5 py-4">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Result</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-semibold font-mono tabular-nums">
                        {result.result_value || '—'}
                      </span>
                      {result.result_unit && (
                        <span className="text-sm text-muted-foreground">{result.result_unit}</span>
                      )}
                    </div>
                    {result.reference_range && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Reference: {result.reference_range}
                      </p>
                    )}
                  </div>

                  {result.comments && <Field label="Comments" value={result.comments} />}
                  {result.internal_notes && <Field label="Internal notes" value={result.internal_notes} />}
                  {result.validation_notes && <Field label="Validation notes" value={result.validation_notes} />}

                  <Separator />

                  <div className="grid gap-4 sm:grid-cols-2 text-sm">
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Request: <span className="font-mono">{result.request_number}</span></p>
                      <p className="text-xs text-muted-foreground">Entered by: {result.entered_by_email || '—'}</p>
                      <p className="text-xs text-muted-foreground">Created: {formatDateTime(result.created_at)}</p>
                    </div>
                    <div className="space-y-2">
                      {result.validated_at && (
                        <p className="text-xs text-muted-foreground">Validated: {formatDateTime(result.validated_at)} by {result.validated_by_email}</p>
                      )}
                      {result.published_at && (
                        <p className="text-xs text-muted-foreground">Published: {formatDateTime(result.published_at)} by {result.published_by_email}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Files */}
          <ResultFileList
            resultId={result.id}
            files={result.files}
            status={result.status}
          />
        </div>

        {/* Sidebar — actions */}
        <div>
          <ResultActions
            resultId={result.id}
            status={result.status}
            hasValue={!!result.result_value}
          />
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm whitespace-pre-wrap">{value}</p>
    </div>
  )
}
