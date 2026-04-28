import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { PREMIUM_SURFACE_CLASSES, TONE_CLASSES } from './cockpit-helpers'
import type { DashboardTone } from '../types'

export interface RankedItem {
  /** Stable identifier (used as React key). */
  id: string
  /** Primary label displayed for the row. */
  label: string
  /** Optional small caption under the label (e.g. "of 124 total"). */
  caption?: string
  /** Numeric value driving both the displayed number and the bar width. */
  value: number
  /** Optional formatted display value (e.g. "2 485 000 FCFA"). Falls back to value. */
  display?: string
}

interface Props {
  title: string
  subtitle?: string
  /** Top-right slot: filter pill, toggle group, action menu, etc. */
  headerExtra?: ReactNode
  /** Tone drives the top accent stripe + progress-bar fill colour. */
  tone: DashboardTone
  items: RankedItem[]
  /** Optional click handler — wraps each row in a button when set. */
  onItemClick?: (item: RankedItem) => void
  /** Empty-state message. */
  emptyMessage?: string
}

const BAR_TONE: Record<DashboardTone, string> = {
  primary: 'bg-blue-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger:  'bg-rose-500',
  neutral: 'bg-violet-500',
}

const BAR_TRACK: Record<DashboardTone, string> = {
  primary: 'bg-blue-100/60',
  success: 'bg-emerald-100/60',
  warning: 'bg-amber-100/60',
  danger:  'bg-rose-100/60',
  neutral: 'bg-violet-100/60',
}

/**
 * Generic ranked-list card. Same premium substrate as the KPI / chart
 * cards — top tone gradient stripe, hairline-bordered header, padded
 * body — so the analytics row reads as one family.
 *
 * Each row shows: rank · label (+caption) · value · progress bar scaled
 * to the largest value in the list.
 */
export function RankedListCard({
  title, subtitle, headerExtra, tone, items, onItemClick, emptyMessage = 'No data yet.',
}: Props) {
  const max = items.reduce((m, it) => Math.max(m, it.value), 0)
  const stripe = TONE_CLASSES[tone].accentLine

  return (
    <div className={cn(PREMIUM_SURFACE_CLASSES, 'relative flex flex-col overflow-hidden')}>
      <span aria-hidden className={cn('pointer-events-none absolute inset-x-0 top-0 h-[3px]', stripe)} />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-black/5 px-6 pt-5 pb-4">
        <div className="min-w-0">
          <h3 className="text-base font-semibold tracking-tight">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {headerExtra}
      </div>

      {/* Body */}
      <div className="flex-1 px-6 py-4">
        {items.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <ol className="space-y-3.5">
            {items.map((it, i) => {
              const pct = max > 0 ? Math.max(4, Math.round((it.value / max) * 100)) : 0
              const rowContent = (
                <>
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="flex min-w-0 items-baseline gap-3">
                      <span className="w-5 shrink-0 text-xs font-semibold tabular-nums text-slate-400">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">{it.label}</p>
                        {it.caption && (
                          <p className="truncate text-[11px] text-slate-500">{it.caption}</p>
                        )}
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                      {it.display ?? it.value}
                    </span>
                  </div>
                  <div className={cn('mt-2 ml-8 h-1.5 overflow-hidden rounded-full', BAR_TRACK[tone])}>
                    <div
                      className={cn('h-full rounded-full transition-[width] duration-500', BAR_TONE[tone])}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </>
              )

              return (
                <li key={it.id}>
                  {onItemClick ? (
                    <button
                      type="button"
                      onClick={() => onItemClick(it)}
                      className="group/row block w-full rounded-md px-1 py-1 text-left transition-colors hover:bg-slate-50 focus:outline-none focus-visible:bg-slate-50 focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {rowContent}
                    </button>
                  ) : (
                    <div className="px-1 py-1">{rowContent}</div>
                  )}
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </div>
  )
}
