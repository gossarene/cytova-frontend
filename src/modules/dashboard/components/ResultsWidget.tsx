import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { FileCheck, AlertTriangle } from 'lucide-react'
import type { DashboardResults } from '../types'

interface Props {
  data: DashboardResults | undefined
  isLoading: boolean
}

export function ResultsWidget({ data, isLoading }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <FileCheck className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-base">Results Pipeline</CardTitle>
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
                <p className="text-2xl font-semibold tabular-nums">{data.published_today}</p>
                <p className="text-xs text-muted-foreground">Published today</p>
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums">{data.published_this_week}</p>
                <p className="text-xs text-muted-foreground">This week</p>
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums">{data.published_this_month}</p>
                <p className="text-xs text-muted-foreground">This month</p>
              </div>
            </div>

            {/* Abnormal results */}
            {data.abnormal_published > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700">
                  <span className="font-semibold">{data.abnormal_published}</span> abnormal results published
                </span>
              </div>
            )}

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
          </div>
        )}
      </CardContent>
    </Card>
  )
}
