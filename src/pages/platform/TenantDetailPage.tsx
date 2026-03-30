import { useParams, Link } from 'react-router-dom'
import {
  ExternalLink, Globe, CreditCard,
} from 'lucide-react'
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
import { useTenant, useSuspendTenant, useActivateTenant } from './api'
import { useIsPlatformOwner } from '@/lib/permissions/platform-hooks'
import { formatDate, formatDateTime } from '@/lib/utils/date'
import { ROUTES } from '@/config/routes'
import { useState } from 'react'

export function TenantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: tenant, isLoading, error, refetch } = useTenant(id!)
  const isOwner = useIsPlatformOwner()

  const suspendMutation = useSuspendTenant(id!)
  const activateMutation = useActivateTenant(id!)

  const [showSuspend, setShowSuspend] = useState(false)
  const [showActivate, setShowActivate] = useState(false)

  if (error) return <ErrorState onRetry={refetch} />

  if (isLoading || !tenant) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    )
  }

  async function handleSuspend() {
    try {
      await suspendMutation.mutateAsync()
      toast.success('Tenant suspended.')
      setShowSuspend(false)
    } catch { toast.error('Failed to suspend tenant.') }
  }

  async function handleActivate() {
    try {
      await activateMutation.mutateAsync()
      toast.success('Tenant activated.')
      setShowActivate(false)
    } catch { toast.error('Failed to activate tenant.') }
  }

  const sub = tenant.active_subscription

  return (
    <div className="space-y-6">
      <PageHeader
        title={tenant.name}
        breadcrumbs={[
          { label: 'Laboratories', href: ROUTES.PLATFORM_TENANTS },
          { label: tenant.name },
        ]}
      >
        {isOwner && tenant.is_active && (
          <Button variant="destructive" onClick={() => setShowSuspend(true)}>
            Suspend
          </Button>
        )}
        {isOwner && !tenant.is_active && (
          <Button onClick={() => setShowActivate(true)}>
            Activate
          </Button>
        )}
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Laboratory Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Row label="Status">
              <Badge
                variant="outline"
                className={tenant.is_active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-600'}
              >
                {tenant.is_active ? 'Active' : 'Suspended'}
              </Badge>
            </Row>
            <Row label="Subdomain">
              <span className="flex items-center gap-1.5">
                {tenant.subdomain}
                <a
                  href={`https://${tenant.domains?.[0]?.domain || tenant.subdomain + '.cytova.io'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </span>
            </Row>
            <Row label="Schema">{tenant.schema_name}</Row>
            <Row label="Plan">{tenant.plan}</Row>
            <Row label="Created">{formatDate(tenant.created_at)}</Row>
            {tenant.activated_at && <Row label="Activated">{formatDateTime(tenant.activated_at)}</Row>}
            {tenant.suspended_at && <Row label="Suspended">{formatDateTime(tenant.suspended_at)}</Row>}
            {tenant.domains.length > 0 && (
              <Row label="Domains">
                <div className="space-y-1">
                  {tenant.domains.map((d) => (
                    <div key={d.domain} className="flex items-center gap-1.5 text-sm">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                      {d.domain}
                      {d.is_primary && <Badge variant="outline" className="text-[10px] ml-1">Primary</Badge>}
                    </div>
                  ))}
                </div>
              </Row>
            )}
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sub ? (
              <div className="space-y-4">
                <Row label="Status"><StatusBadge status={sub.status} /></Row>
                <Row label="Plan">{sub.plan_name} ({sub.plan_code})</Row>
                <Row label="Started">{formatDate(sub.started_at)}</Row>
                {sub.trial_end_date && (
                  <Row label="Trial ends">
                    {formatDate(sub.trial_end_date)}
                    {sub.trial_days_remaining !== null && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({sub.trial_days_remaining}d remaining)
                      </span>
                    )}
                  </Row>
                )}
                {sub.current_period_end && (
                  <Row label="Period ends">{formatDate(sub.current_period_end)}</Row>
                )}
                <Row label="Usable">
                  <Badge variant="outline" className={sub.is_usable ? 'text-emerald-600' : 'text-red-600'}>
                    {sub.is_usable ? 'Yes' : 'No'}
                  </Badge>
                </Row>
                <Separator />
                <Link to={`${ROUTES.PLATFORM_SUBSCRIPTIONS}?tenant_id=${tenant.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    View Subscription Details
                  </Button>
                </Link>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No active subscription.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={showSuspend}
        onOpenChange={setShowSuspend}
        title="Suspend laboratory"
        description={`This will block all API access for "${tenant.name}". Users will see a suspension notice.`}
        confirmLabel="Suspend"
        variant="destructive"
        onConfirm={handleSuspend}
        isLoading={suspendMutation.isPending}
      />

      <ConfirmDialog
        open={showActivate}
        onOpenChange={setShowActivate}
        title="Activate laboratory"
        description={`This will restore API access for "${tenant.name}".`}
        confirmLabel="Activate"
        onConfirm={handleActivate}
        isLoading={activateMutation.isPending}
      />
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
