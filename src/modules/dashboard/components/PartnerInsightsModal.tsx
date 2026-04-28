import { useState } from 'react'
import { Dialog, DialogContentLarge, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/currency'
import type { RankedPartner } from '../types'

type Range = 'month' | 'quarter' | 'year' | 'custom'
type Mode = 'billing' | 'volume'

const RANGE_LABELS: Record<Range, string> = {
  month:   'This month',
  quarter: 'Quarter',
  year:    'Year',
  custom:  'Custom range',
}

interface Props {
  partner: RankedPartner | null
  defaultMode?: Mode
  onClose: () => void
}

/**
 * Partner deep-analysis modal — opened by clicking a row in the
 * "Top partners" RankedListCard.
 *
 * Controls:
 *   - Date range pills (This month / Quarter / Year / Custom)
 *   - Mode toggle: Billing amount vs Number of requests
 *
 * Body:
 *   - Headline metric card (current value for selected mode)
 *
 * The range pills + custom-date inputs are visual-only: the API does
 * not yet expose a per-partner time series. Wire to a per-partner
 * endpoint when one ships, then add a trend chart below the headline.
 */
export function PartnerInsightsModal({ partner, defaultMode = 'billing', onClose }: Props) {
  const [range, setRange] = useState<Range>('month')
  const [mode, setMode] = useState<Mode>(defaultMode)

  const open = partner !== null
  const headline =
    !partner ? '—'
    : mode === 'billing' ? formatCurrency(partner.amount)
    : `${partner.requests} requests`

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContentLarge className="sm:max-w-2xl">
        {partner && (
          <>
            <div className="space-y-1">
              <DialogTitle className="text-lg font-semibold tracking-tight">
                {partner.name}
              </DialogTitle>
              <DialogDescription>
                Deep analysis · partner activity over the selected period
              </DialogDescription>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                {(Object.keys(RANGE_LABELS) as Range[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRange(r)}
                    className={cn(
                      'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                      range === r
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900',
                    )}
                  >
                    {RANGE_LABELS[r]}
                  </button>
                ))}
              </div>
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                {(['billing', 'volume'] as Mode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={cn(
                      'rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors',
                      mode === m
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900',
                    )}
                  >
                    {m === 'billing' ? 'Amount' : 'Volume'}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom range stub — only visible for the 'custom' option */}
            {range === 'custom' && (
              <div className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <input type="date" className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs" />
                <span>→</span>
                <input type="date" className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs" />
              </div>
            )}

            {/* Headline metric */}
            <div className="rounded-xl border border-black/5 bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                {mode === 'billing' ? 'Total billed' : 'Total requests'} · {RANGE_LABELS[range]}
              </p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
                {headline}
              </p>
            </div>

            <p className="text-[11px] text-slate-400">
              Range filter and custom dates are visual-only until a per-partner
              time-series endpoint is exposed.
            </p>
          </>
        )}
      </DialogContentLarge>
    </Dialog>
  )
}
