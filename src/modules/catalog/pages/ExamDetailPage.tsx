import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { toast } from 'sonner'
import { FlaskConical, DollarSign, Settings2, Ban } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/shared/PageHeader'
import { ErrorState } from '@/components/shared/ErrorState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { CardSkeleton } from '@/components/shared/LoadingSkeleton'
import { Can } from '@/lib/permissions/Can'
import { P } from '@/lib/permissions/constants'
import { PricingRulesTable } from '../components/PricingRulesTable'
import { useExamDefinition, useDeactivateExamDefinition, usePricingRules } from '../api'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDateTime } from '@/lib/utils/date'
import { ROUTES } from '@/config/routes'

export function ExamDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: exam, isLoading, error, refetch } = useExamDefinition(id!)
  const { data: rulesData, isLoading: rulesLoading } = usePricingRules({ exam_definition_id: id! })
  const deactivateMut = useDeactivateExamDefinition(id!)
  const [showDeactivate, setShowDeactivate] = useState(false)

  if (error) return <ErrorState onRetry={refetch} />

  if (isLoading || !exam) {
    return <div className="space-y-6"><CardSkeleton /><CardSkeleton /></div>
  }

  async function handleDeactivate() {
    try {
      await deactivateMut.mutateAsync()
      toast.success('Exam definition deactivated.')
      setShowDeactivate(false)
    } catch {
      toast.error('Failed to deactivate.')
    }
  }

  const rules = rulesData?.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title={exam.name}
        breadcrumbs={[
          { label: 'Catalog', href: ROUTES.CATALOG },
          { label: exam.code },
        ]}
      >
        <Can permission={P.CATALOG_MANAGE}>
          {exam.is_active && (
            <Button variant="destructive" className="gap-2" onClick={() => setShowDeactivate(true)}>
              <Ban className="h-4 w-4" />
              Deactivate
            </Button>
          )}
        </Can>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <FlaskConical className="h-4 w-4 text-muted-foreground" />
                Exam Definition
              </CardTitle>
              <Badge
                variant="outline"
                className={exam.is_active
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-red-200 bg-red-50 text-red-600'}
              >
                {exam.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Code" value={exam.code} mono />
              <Field label="Category" value={exam.category.name} />
              <Field label="Sample Type" value={exam.sample_type} />
              <Field label="Turnaround" value={exam.turnaround_hours ? `${exam.turnaround_hours}h` : 'Not set'} />
            </div>
            {exam.description && (
              <>
                <Separator />
                <Field label="Description" value={exam.description} />
              </>
            )}

            <Separator />

            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Reference unit price:</span>
              <span className="text-lg font-semibold font-mono">{formatCurrency(exam.unit_price)}</span>
            </div>

            <div className="text-xs text-muted-foreground pt-2">
              Created {formatDateTime(exam.created_at)} &middot; Updated {formatDateTime(exam.updated_at)}
            </div>
          </CardContent>
        </Card>

        {/* Lab settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              Lab Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {exam.lab_settings ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Enabled</span>
                  <Badge variant="outline" className={exam.lab_settings.is_enabled ? 'text-emerald-600' : 'text-red-600'}>
                    {exam.lab_settings.is_enabled ? 'Yes' : 'No'}
                  </Badge>
                </div>
                {exam.lab_settings.reference_range && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reference range</span>
                    <span className="font-mono">{exam.lab_settings.reference_range}</span>
                  </div>
                )}
                {exam.lab_settings.turnaround_hours_override && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">TAT override</span>
                    <span>{exam.lab_settings.turnaround_hours_override}h</span>
                  </div>
                )}
                {exam.lab_settings.internal_notes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Internal notes</p>
                      <p className="text-xs bg-muted p-2 rounded">{exam.lab_settings.internal_notes}</p>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No lab-specific settings. Using catalog defaults.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pricing rules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pricing Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <PricingRulesTable rules={rules} isLoading={rulesLoading} />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showDeactivate}
        onOpenChange={setShowDeactivate}
        title="Deactivate exam definition"
        description={`"${exam.name}" (${exam.code}) will be hidden from new requests. Existing requests using it are not affected.`}
        confirmLabel="Deactivate"
        variant="destructive"
        onConfirm={handleDeactivate}
        isLoading={deactivateMut.isPending}
      />
    </div>
  )
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-sm ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}
