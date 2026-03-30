import { PageHeader } from '@/components/shared/PageHeader'
import { ErrorState } from '@/components/shared/ErrorState'
import { Separator } from '@/components/ui/separator'
import { Can } from '@/lib/permissions/Can'
import { P } from '@/lib/permissions/constants'
import {
  useDashboardOverview,
  useDashboardPatients,
  useDashboardRequests,
  useDashboardResults,
  useDashboardStock,
  useDashboardAlerts,
  useDashboardProcurement,
} from '../api'
import { OverviewCards } from '../components/OverviewCards'
import { PatientsWidget } from '../components/PatientsWidget'
import { RequestsWidget } from '../components/RequestsWidget'
import { ResultsWidget } from '../components/ResultsWidget'
import { StockWidget } from '../components/StockWidget'
import { AlertsWidget } from '../components/AlertsWidget'
import { ProcurementWidget } from '../components/ProcurementWidget'

export function DashboardPage() {
  const overview = useDashboardOverview()
  const patients = useDashboardPatients()
  const requests = useDashboardRequests()
  const results = useDashboardResults()
  const stock = useDashboardStock()
  const alerts = useDashboardAlerts()
  const procurement = useDashboardProcurement()

  if (overview.error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" />
        <ErrorState
          title="Unable to load dashboard"
          message="We couldn't retrieve your laboratory metrics. Please try again."
          onRetry={() => overview.refetch()}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your laboratory operations"
      />

      {/* Top-level KPI cards */}
      <OverviewCards data={overview.data} isLoading={overview.isLoading} />

      <Separator />

      {/* Laboratory section */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Laboratory Activity
        </h2>
        <div className="grid gap-6 lg:grid-cols-3">
          <Can permission={P.PATIENTS_VIEW}>
            <PatientsWidget data={patients.data} isLoading={patients.isLoading} />
          </Can>
          <Can permission={P.REQUESTS_VIEW}>
            <RequestsWidget data={requests.data} isLoading={requests.isLoading} />
          </Can>
          <Can permission={P.RESULTS_VIEW}>
            <ResultsWidget data={results.data} isLoading={results.isLoading} />
          </Can>
        </div>
      </section>

      {/* Operations section */}
      <Can permission={[P.STOCK_VIEW, P.ALERTS_VIEW, P.PROCUREMENT_VIEW]} mode="any">
        <Separator />
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Operations & Supply Chain
          </h2>
          <div className="grid gap-6 lg:grid-cols-3">
            <Can permission={P.STOCK_VIEW}>
              <StockWidget data={stock.data} isLoading={stock.isLoading} />
            </Can>
            <Can permission={P.ALERTS_VIEW}>
              <AlertsWidget data={alerts.data} isLoading={alerts.isLoading} />
            </Can>
            <Can permission={P.PROCUREMENT_VIEW}>
              <ProcurementWidget data={procurement.data} isLoading={procurement.isLoading} />
            </Can>
          </div>
        </section>
      </Can>
    </div>
  )
}
