import { AlertTriangle, XCircle, Clock, Package } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { AlertSummaryItem } from '../types'

interface Props {
  data: AlertSummaryItem[] | undefined
  isLoading: boolean
}

const TYPE_CONFIG: Record<string, { icon: typeof AlertTriangle; label: string; color: string; bg: string }> = {
  LOW_STOCK: { icon: Package, label: 'Low Stock', color: 'text-amber-600', bg: 'bg-amber-50' },
  OUT_OF_STOCK: { icon: XCircle, label: 'Out of Stock', color: 'text-red-600', bg: 'bg-red-50' },
  EXPIRING_SOON: { icon: Clock, label: 'Expiring Soon', color: 'text-amber-600', bg: 'bg-amber-50' },
  EXPIRED: { icon: AlertTriangle, label: 'Expired', color: 'text-red-600', bg: 'bg-red-50' },
}

export function AlertSummaryCards({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}><CardContent className="p-5"><Skeleton className="h-12" /></CardContent></Card>
        ))}
      </div>
    )
  }

  // Aggregate by type across all severities
  const byType: Record<string, number> = {}
  for (const item of data ?? []) {
    byType[item.alert_type] = (byType[item.alert_type] ?? 0) + item.count
  }

  const types = ['LOW_STOCK', 'OUT_OF_STOCK', 'EXPIRING_SOON', 'EXPIRED'] as const

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {types.map((type) => {
        const config = TYPE_CONFIG[type]
        const Icon = config.icon
        const count = byType[type] ?? 0
        return (
          <Card key={type} className={cn(count > 0 && config.bg)}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', count > 0 ? `${config.bg}` : 'bg-muted')}>
                <Icon className={cn('h-5 w-5', count > 0 ? config.color : 'text-muted-foreground')} />
              </div>
              <div>
                <p className={cn('text-2xl font-bold tabular-nums', count > 0 ? config.color : 'text-muted-foreground')}>
                  {count}
                </p>
                <p className="text-xs text-muted-foreground">{config.label}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
