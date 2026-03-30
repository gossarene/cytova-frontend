import { Building2, AlertTriangle, Clock } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { ErrorState } from '@/components/shared/ErrorState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { usePlatformDashboard } from './api'

export function PlatformDashboardPage() {
  const { data, isLoading, error, refetch } = usePlatformDashboard()

  if (error) return <ErrorState onRetry={refetch} />

  return (
    <div className="space-y-6">
      <PageHeader title="Platform Overview" description="Cytova platform metrics at a glance" />

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Laboratories"
          value={data?.tenants.total ?? 0}
          icon={Building2}
          isLoading={isLoading}
        />
        <StatCard
          title="Active Laboratories"
          value={data?.tenants.active ?? 0}
          icon={Building2}
          isLoading={isLoading}
        />
        <StatCard
          title="Suspended"
          value={data?.tenants.suspended ?? 0}
          icon={AlertTriangle}
          isLoading={isLoading}
        />
        <StatCard
          title="Trials Expiring Soon"
          value={data?.subscriptions.trials_expiring_soon ?? 0}
          icon={Clock}
          isLoading={isLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Subscription status breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Subscriptions by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-6 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {data && Object.entries(data.subscriptions.by_status).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <StatusBadge status={status} />
                    <span className="text-sm font-semibold tabular-nums">{count}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-sm text-muted-foreground pt-1 border-t">
                  <span>No subscription</span>
                  <span className="font-semibold tabular-nums">{data?.subscriptions.no_subscription ?? 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plan distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-6 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {data && Object.entries(data.plan_distribution).map(([plan, count]) => (
                  <div key={plan} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{plan}</span>
                    <span className="text-sm font-semibold tabular-nums">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
