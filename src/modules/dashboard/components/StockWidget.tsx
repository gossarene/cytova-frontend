import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Package, AlertTriangle, XCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DashboardStock } from '../types'

interface Props {
  data: DashboardStock | undefined
  isLoading: boolean
}

export function StockWidget({ data, isLoading }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <Package className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-base">Inventory Health</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : !data ? null : (
          <div className="space-y-3">
            <MetricRow
              icon={Package}
              label="Active items"
              value={data.total_active_items}
              sublabel={`${data.total_active_lots} active lots`}
            />
            <MetricRow
              icon={AlertTriangle}
              label="Below threshold"
              value={data.below_threshold}
              variant={data.below_threshold > 0 ? 'warning' : 'ok'}
            />
            <MetricRow
              icon={XCircle}
              label="Out of stock"
              value={data.out_of_stock}
              variant={data.out_of_stock > 0 ? 'critical' : 'ok'}
            />
            <MetricRow
              icon={Clock}
              label={`Expiring soon (${data.expiring_soon_window_days}d)`}
              value={data.expiring_soon}
              variant={data.expiring_soon > 0 ? 'warning' : 'ok'}
            />
            {data.expired > 0 && (
              <MetricRow
                icon={XCircle}
                label="Expired lots"
                value={data.expired}
                variant="critical"
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function MetricRow({
  icon: Icon,
  label,
  value,
  sublabel,
  variant = 'ok',
}: {
  icon: typeof Package
  label: string
  value: number
  sublabel?: string
  variant?: 'ok' | 'warning' | 'critical'
}) {
  return (
    <div className={cn(
      'flex items-center justify-between rounded-lg px-3 py-2.5',
      variant === 'critical' && 'bg-red-50',
      variant === 'warning' && 'bg-amber-50',
      variant === 'ok' && 'bg-muted/50',
    )}>
      <div className="flex items-center gap-2.5">
        <Icon className={cn(
          'h-4 w-4',
          variant === 'critical' && 'text-red-500',
          variant === 'warning' && 'text-amber-500',
          variant === 'ok' && 'text-muted-foreground',
        )} />
        <div>
          <p className="text-sm font-medium">{label}</p>
          {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
        </div>
      </div>
      <span className={cn(
        'text-lg font-semibold tabular-nums',
        variant === 'critical' && 'text-red-600',
        variant === 'warning' && 'text-amber-600',
      )}>
        {value}
      </span>
    </div>
  )
}
