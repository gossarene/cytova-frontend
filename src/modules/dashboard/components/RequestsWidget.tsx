import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { ClipboardList } from 'lucide-react'
import type { DashboardRequests } from '../types'

interface Props {
  data: DashboardRequests | undefined
  isLoading: boolean
}

export function RequestsWidget({ data, isLoading }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <ClipboardList className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-base">Requests</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-5" />)}
          </div>
        ) : !data ? null : (
          <div className="space-y-4">
            {/* Period stats */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-2xl font-semibold tabular-nums">{data.created_today}</p>
                <p className="text-xs text-muted-foreground">Today</p>
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums">{data.created_this_week}</p>
                <p className="text-xs text-muted-foreground">This week</p>
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums">{data.created_this_month}</p>
                <p className="text-xs text-muted-foreground">This month</p>
              </div>
            </div>

            {/* Status breakdown */}
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">By Status</p>
              {Object.entries(data.by_status).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <StatusBadge status={status} />
                  <span className="text-sm font-semibold tabular-nums">{count}</span>
                </div>
              ))}
            </div>

            {/* Source breakdown */}
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">By Source</p>
              {Object.entries(data.by_source_type).map(([source, count]) => (
                <div key={source} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {source === 'DIRECT_PATIENT' ? 'Direct' : source === 'PARTNER_ORGANIZATION' ? 'Partner' : source.replace(/_/g, ' ')}
                  </span>
                  <span className="font-semibold tabular-nums">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
