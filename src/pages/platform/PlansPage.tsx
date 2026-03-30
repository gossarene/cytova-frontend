import { Layers, Check, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { usePlans } from './api'

export function PlansPage() {
  const { data, isLoading, error, refetch } = usePlans()
  const plans = data?.data ?? []

  if (error) return <ErrorState onRetry={refetch} />

  return (
    <div className="space-y-6">
      <PageHeader title="Subscription Plans" description="Available plans on the platform" />

      {isLoading ? (
        <TableSkeleton rows={4} columns={5} />
      ) : plans.length === 0 ? (
        <EmptyState icon={Layers} title="No plans configured" description="Add subscription plans to the database." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className={!plan.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  <div className="flex gap-1.5">
                    {plan.is_trial && (
                      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 text-[10px]">
                        Trial
                      </Badge>
                    )}
                    {!plan.is_active && (
                      <Badge variant="outline" className="border-red-200 bg-red-50 text-red-600 text-[10px]">
                        Inactive
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <Row label="Code">{plan.code}</Row>
                  {plan.is_trial && plan.trial_duration_days && (
                    <Row label="Trial duration">{plan.trial_duration_days} days</Row>
                  )}
                  {plan.monthly_price && (
                    <Row label="Monthly">{plan.monthly_price}</Row>
                  )}
                  {plan.yearly_price && (
                    <Row label="Yearly">{plan.yearly_price}</Row>
                  )}
                  <Row label="Public">
                    {plan.is_public ? <Check className="h-4 w-4 text-emerald-500" /> : <X className="h-4 w-4 text-muted-foreground" />}
                  </Row>
                  <Row label="Order">{plan.display_order}</Row>
                </div>
                {plan.description && (
                  <p className="text-xs text-muted-foreground pt-2 border-t">
                    {plan.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{children}</span>
    </div>
  )
}
