import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/currency'
import { resolveIcon, TONE_CLASSES, PREMIUM_SURFACE_CLASSES } from './cockpit-helpers'
import type { DashboardKpi } from '../types'

interface Props {
  kpi: DashboardKpi
  isLoading?: boolean
}

/**
 * KPI card. Banking/Stripe-style visual hierarchy:
 *   - 3px tone-tinted gradient stripe along the top edge (the only place
 *     a card-level coloured signal lives — keeps the substrate uniform)
 *   - small uppercase muted label
 *   - large 3xl semibold metric value (tone-tinted accent colour)
 *   - tinted icon chip in the top-right corner
 *   - "View details →" subtle affordance when the card is a link
 *
 * Hover: subtle lift (-translate-y-0.5) + scale (1.02) + deeper shadow.
 * The whole card becomes a Link when ``kpi.href`` is set. Cards line up
 * visually as one family because the substrate is shared across tones.
 */
export function DashboardKpiCard({ kpi, isLoading }: Props) {
  const Icon = resolveIcon(kpi.icon)
  const tone = TONE_CLASSES[kpi.tone]
  const isMonetary = kpi.key.startsWith('revenue_') || kpi.key.endsWith('_amount')

  if (isLoading) {
    return (
      <div className={cn(PREMIUM_SURFACE_CLASSES, 'relative overflow-hidden p-6')}>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
          <Skeleton className="h-11 w-11 rounded-xl" />
        </div>
      </div>
    )
  }

  const body = (
    <>
      {/* 3px tone gradient stripe along the top edge */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-[3px]',
          tone.accentLine,
        )}
      />
      <div className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              {kpi.label}
            </p>
            <p className={cn(
              'text-3xl font-semibold tracking-tight tabular-nums',
              tone.accent,
            )}>
              {isMonetary ? formatCurrency(kpi.value) : kpi.value}
            </p>
          </div>
          <span
            aria-hidden
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
              'transition-transform duration-200 group-hover:scale-110',
              tone.iconChip,
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
        </div>
        {kpi.href && (
          <div className="mt-5 flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
            View details
            <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        )}
      </div>
    </>
  )

  const cardClass = cn(
    'group relative overflow-hidden',
    tone.surface,
    kpi.href && 'cursor-pointer hover:-translate-y-0.5 hover:scale-[1.02]',
  )

  if (kpi.href) {
    return (
      <Link
        to={kpi.href}
        className={cn(cardClass, 'block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring')}
      >
        {body}
      </Link>
    )
  }
  return <div className={cardClass}>{body}</div>
}
