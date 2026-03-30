import {
  Users, ClipboardList, FileCheck,
  Bell, AlertTriangle,
} from 'lucide-react'
import { StatCard } from '@/components/shared/StatCard'
import { Can } from '@/lib/permissions/Can'
import { P } from '@/lib/permissions/constants'
import type { DashboardOverview } from '../types'

interface Props {
  data: DashboardOverview | undefined
  isLoading: boolean
}

export function OverviewCards({ data, isLoading }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Can permission={P.PATIENTS_VIEW}>
        <StatCard
          title="Active Patients"
          value={data?.patients.total_active ?? 0}
          icon={Users}
          isLoading={isLoading}
          trend={data?.patients.registered_this_month
            ? { value: data.patients.registered_this_month, direction: 'up' }
            : undefined}
        />
      </Can>

      <Can permission={P.REQUESTS_VIEW}>
        <StatCard
          title="Active Requests"
          value={data?.requests.active ?? 0}
          icon={ClipboardList}
          isLoading={isLoading}
        />
      </Can>

      <Can permission={P.RESULTS_VIEW}>
        <StatCard
          title="Pending Validation"
          value={data?.results.pending_validation ?? 0}
          icon={FileCheck}
          isLoading={isLoading}
        />
      </Can>

      <Can permission={P.ALERTS_VIEW}>
        <StatCard
          title="Open Alerts"
          value={data?.alerts.total_open ?? 0}
          icon={data?.alerts.critical ? AlertTriangle : Bell}
          isLoading={isLoading}
        />
      </Can>
    </div>
  )
}
