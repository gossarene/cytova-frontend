import { AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  current: number
  threshold: number
  unit: string
  showBar?: boolean
}

function getLevel(current: number, threshold: number): 'ok' | 'low' | 'out' {
  if (current <= 0) return 'out'
  if (current <= threshold && threshold > 0) return 'low'
  return 'ok'
}

const LEVEL_CONFIG = {
  ok: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-500', barBg: 'bg-emerald-100' },
  low: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-500', barBg: 'bg-amber-100' },
  out: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-500', barBg: 'bg-red-100' },
}

export function QuantityIndicator({ current, threshold, unit, showBar = true }: Props) {
  const level = getLevel(current, threshold)
  const config = LEVEL_CONFIG[level]
  const Icon = config.icon
  const pct = threshold > 0 ? Math.min((current / (threshold * 2)) * 100, 100) : current > 0 ? 100 : 0

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Icon className={cn('h-4 w-4', config.color)} />
        <span className={cn('text-sm font-semibold tabular-nums', config.color)}>
          {current} {unit}
        </span>
        {threshold > 0 && (
          <span className="text-xs text-muted-foreground">
            (min: {threshold})
          </span>
        )}
      </div>
      {showBar && (
        <div className={cn('h-1.5 w-full rounded-full', config.barBg)}>
          <div
            className={cn('h-full rounded-full transition-all', config.bg)}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  )
}
