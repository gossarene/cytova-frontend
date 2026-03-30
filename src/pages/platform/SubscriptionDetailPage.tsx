import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ErrorState } from '@/components/shared/ErrorState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { CardSkeleton } from '@/components/shared/LoadingSkeleton'
import {
  useSubscription, useActivateSubscription, useSuspendSubscription,
  useReactivateSubscription, useCancelSubscription,
} from './api'
import { formatDate, formatDateTime } from '@/lib/utils/date'
import { ROUTES } from '@/config/routes'

type DialogType = 'activate' | 'suspend' | 'reactivate' | 'cancel' | null

export function SubscriptionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: sub, isLoading, error, refetch } = useSubscription(id!)
  const [dialog, setDialog] = useState<DialogType>(null)
  const [reason, setReason] = useState('')
  const [months] = useState(1)

  const activateMut = useActivateSubscription(id!)
  const suspendMut = useSuspendSubscription(id!)
  const reactivateMut = useReactivateSubscription(id!)
  const cancelMut = useCancelSubscription(id!)

  if (error) return <ErrorState onRetry={refetch} />
  if (isLoading || !sub) return <div className="space-y-6"><CardSkeleton /><CardSkeleton /></div>

  async function handleAction() {
    try {
      if (dialog === 'activate') {
        await activateMut.mutateAsync({ period_months: months })
        toast.success('Subscription activated.')
      } else if (dialog === 'suspend') {
        await suspendMut.mutateAsync({ reason })
        toast.success('Subscription suspended.')
      } else if (dialog === 'reactivate') {
        await reactivateMut.mutateAsync()
        toast.success('Subscription reactivated.')
      } else if (dialog === 'cancel') {
        await cancelMut.mutateAsync({ reason })
        toast.success('Subscription cancelled.')
      }
      setDialog(null)
      setReason('')
    } catch {
      toast.error('Action failed. Please try again.')
    }
  }

  const isPending = activateMut.isPending || suspendMut.isPending || reactivateMut.isPending || cancelMut.isPending

  // Available actions based on current status
  const canActivate = sub.status === 'TRIAL' || sub.status === 'EXPIRED'
  const canSuspend = sub.status === 'ACTIVE'
  const canReactivate = sub.status === 'SUSPENDED'
  const canCancel = sub.status !== 'CANCELLED'

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Subscription — ${sub.tenant_name}`}
        breadcrumbs={[
          { label: 'Subscriptions', href: ROUTES.PLATFORM_SUBSCRIPTIONS },
          { label: sub.tenant_name },
        ]}
      >
        {canActivate && (
          <Button onClick={() => setDialog('activate')}>Activate</Button>
        )}
        {canSuspend && (
          <Button variant="outline" onClick={() => setDialog('suspend')}>Suspend</Button>
        )}
        {canReactivate && (
          <Button onClick={() => setDialog('reactivate')}>Reactivate</Button>
        )}
        {canCancel && (
          <Button variant="destructive" onClick={() => setDialog('cancel')}>Cancel</Button>
        )}
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status & lifecycle */}
        <Card>
          <CardHeader><CardTitle className="text-base">Subscription Status</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Row label="Status"><StatusBadge status={sub.status} /></Row>
            <Row label="Usable">
              <Badge variant="outline" className={sub.is_usable ? 'text-emerald-600' : 'text-red-600'}>
                {sub.is_usable ? 'Yes' : 'No'}
              </Badge>
            </Row>
            <Row label="Started">{formatDate(sub.started_at)}</Row>
            {sub.trial_end_date && (
              <Row label="Trial ends">
                {formatDate(sub.trial_end_date)}
                {sub.trial_days_remaining !== null && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({sub.trial_days_remaining}d left)
                  </span>
                )}
              </Row>
            )}
            {sub.current_period_end && <Row label="Period ends">{formatDate(sub.current_period_end)}</Row>}
            {sub.activated_at && <Row label="Activated">{formatDateTime(sub.activated_at)}</Row>}
            {sub.suspended_at && <Row label="Suspended">{formatDateTime(sub.suspended_at)}</Row>}
            {sub.cancelled_at && (
              <>
                <Row label="Cancelled">{formatDateTime(sub.cancelled_at)}</Row>
                <Row label="Cancelled by">{sub.cancelled_by || '—'}</Row>
              </>
            )}
            {sub.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm bg-muted p-3 rounded">{sub.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Plan info */}
        <Card>
          <CardHeader><CardTitle className="text-base">Plan Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Row label="Plan">{sub.plan.name}</Row>
            <Row label="Code">{sub.plan.code}</Row>
            <Row label="Trial plan">{sub.plan.is_trial ? 'Yes' : 'No'}</Row>
            {sub.plan.trial_duration_days && <Row label="Trial duration">{sub.plan.trial_duration_days} days</Row>}
            {sub.plan.monthly_price && <Row label="Monthly price">{sub.plan.monthly_price}</Row>}
            {sub.plan.yearly_price && <Row label="Yearly price">{sub.plan.yearly_price}</Row>}
            <Row label="Public">{sub.plan.is_public ? 'Yes' : 'No'}</Row>
            <Row label="Active">{sub.plan.is_active ? 'Yes' : 'No'}</Row>
          </CardContent>
        </Card>
      </div>

      {/* Activate dialog (needs period_months) */}
      {dialog === 'activate' && (
        <ConfirmDialog
          open
          onOpenChange={() => setDialog(null)}
          title="Activate subscription"
          description={`This will activate the subscription for "${sub.tenant_name}" and grant access.`}
          confirmLabel="Activate"
          onConfirm={handleAction}
          isLoading={isPending}
        />
      )}

      {/* Suspend dialog (needs reason) */}
      {dialog === 'suspend' && (
        <ConfirmDialog
          open
          onOpenChange={() => setDialog(null)}
          title="Suspend subscription"
          description={`This will suspend access for "${sub.tenant_name}". Users will see a suspension notice.`}
          confirmLabel="Suspend"
          variant="destructive"
          onConfirm={handleAction}
          isLoading={isPending}
        />
      )}

      {/* Reactivate dialog */}
      {dialog === 'reactivate' && (
        <ConfirmDialog
          open
          onOpenChange={() => setDialog(null)}
          title="Reactivate subscription"
          description={`This will restore access for "${sub.tenant_name}".`}
          confirmLabel="Reactivate"
          onConfirm={handleAction}
          isLoading={isPending}
        />
      )}

      {/* Cancel dialog (requires typing CANCEL) */}
      {dialog === 'cancel' && (
        <ConfirmDialog
          open
          onOpenChange={() => setDialog(null)}
          title="Cancel subscription"
          description={`This will permanently cancel the subscription for "${sub.tenant_name}". This action cannot be undone.`}
          confirmLabel="Cancel Subscription"
          variant="destructive"
          requireConfirmText="CANCEL"
          onConfirm={handleAction}
          isLoading={isPending}
        />
      )}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <div className="text-sm font-medium text-right">{children}</div>
    </div>
  )
}
