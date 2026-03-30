import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { ShoppingCart, AlertTriangle } from 'lucide-react'
import type { DashboardProcurement } from '../types'

interface Props {
  data: DashboardProcurement | undefined
  isLoading: boolean
}

export function ProcurementWidget({ data, isLoading }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-base">Procurement</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-5" />)}
          </div>
        ) : !data ? null : (
          <div className="space-y-4">
            {/* Summary stats */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-2xl font-semibold tabular-nums">{data.pending_reception}</p>
                <p className="text-xs text-muted-foreground">Pending reception</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-2xl font-semibold tabular-nums">{data.receptions_this_month}</p>
                <p className="text-xs text-muted-foreground">Received this month</p>
              </div>
            </div>

            {/* Overdue warning */}
            {data.overdue > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-amber-700">
                  <span className="font-semibold">{data.overdue}</span> overdue orders
                </span>
              </div>
            )}

            {/* Discrepancies */}
            {data.receptions_with_discrepancy_this_month > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700">
                  <span className="font-semibold">{data.receptions_with_discrepancy_this_month}</span> receptions with discrepancies
                </span>
              </div>
            )}

            {/* Orders by status */}
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Orders by Status</p>
              {Object.entries(data.orders_by_status).map(([status, count]) => (
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
