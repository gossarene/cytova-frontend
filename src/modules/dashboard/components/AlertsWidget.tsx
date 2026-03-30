import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Bell, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DashboardAlerts } from '../types'

interface Props {
  data: DashboardAlerts | undefined
  isLoading: boolean
}

const SEVERITY_STYLES: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  CRITICAL: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  WARNING: { icon: Bell, color: 'text-amber-600', bg: 'bg-amber-50' },
  INFO: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50' },
}

const TYPE_LABELS: Record<string, string> = {
  LOW_STOCK: 'Low Stock',
  OUT_OF_STOCK: 'Out of Stock',
  EXPIRING_SOON: 'Expiring Soon',
  EXPIRED: 'Expired',
}

export function AlertsWidget({ data, isLoading }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Alerts</CardTitle>
        </div>
        {!isLoading && data && data.total_open > 0 && (
          <Badge variant="outline" className="border-red-200 bg-red-50 text-red-600 text-xs">
            {data.total_open} open
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : !data || data.total_open === 0 ? (
          <div className="py-6 text-center">
            <Bell className="mx-auto h-8 w-8 text-muted-foreground/30" />
            <p className="mt-2 text-sm text-muted-foreground">No open alerts</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* By severity */}
            <div className="space-y-2">
              {Object.entries(data.by_severity).map(([severity, count]) => {
                if (count === 0) return null
                const style = SEVERITY_STYLES[severity] || SEVERITY_STYLES.INFO
                const Icon = style.icon
                return (
                  <div key={severity} className={cn('flex items-center justify-between rounded-lg px-3 py-2', style.bg)}>
                    <div className="flex items-center gap-2">
                      <Icon className={cn('h-4 w-4', style.color)} />
                      <span className="text-sm font-medium">{severity}</span>
                    </div>
                    <span className={cn('text-sm font-semibold tabular-nums', style.color)}>{count}</span>
                  </div>
                )
              })}
            </div>

            {/* By type */}
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">By Type</p>
              {Object.entries(data.by_type).map(([type, count]) => {
                if (count === 0) return null
                return (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{TYPE_LABELS[type] || type}</span>
                    <span className="font-semibold tabular-nums">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
