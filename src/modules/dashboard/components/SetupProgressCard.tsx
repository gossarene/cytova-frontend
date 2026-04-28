import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PREMIUM_SURFACE_CLASSES, TONE_CLASSES } from './cockpit-helpers'
import type { DashboardSetupProgress } from '../types'

interface Props {
  data: DashboardSetupProgress
  /** Optional click handler for an incomplete task's CTA. Receives the
   *  task ``href``. When supplied, the consumer is responsible for
   *  navigation (and any side-effects like closing a drawer). When
   *  omitted, the card falls back to ``react-router-dom``'s navigate(). */
  onTaskClick?: (href: string) => void
}

/**
 * Lab-admin onboarding checklist. Sits between the hero and the KPI grid.
 *
 * Visuals match the rest of the dashboard:
 *   - Premium substrate (gradient + hairline border + shadow)
 *   - 3px Cytova blue→indigo accent stripe along the top
 *   - Gradient progress bar (same blue→indigo)
 *   - Completed tasks: muted with a check chip
 *   - Incomplete required tasks: clear "Configure" CTA → /settings/* page
 *   - Recommended (non-required) tasks: dim "Recommended" pill, lighter CTA
 *
 * When all required tasks are done (percentage === 100) the card collapses
 * to a single-line congrats with an expand toggle, so it doesn't dominate
 * a fully-set-up dashboard but is still discoverable.
 */
export function SetupProgressCard({ data, onTaskClick }: Props) {
  const navigate = useNavigate()
  const allRequiredDone = data.percentage >= 100
  const [expanded, setExpanded] = useState<boolean>(!allRequiredDone)

  function handleTaskClick(href: string) {
    if (onTaskClick) onTaskClick(href)
    else navigate(href)
  }

  const stripe = TONE_CLASSES.primary.accentLine

  return (
    <div className={cn(PREMIUM_SURFACE_CLASSES, 'relative overflow-hidden')}>
      <span aria-hidden className={cn('pointer-events-none absolute inset-x-0 top-0 h-[3px]', stripe)} />

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 px-6 pt-6 pb-4">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm shadow-blue-500/20">
              <Sparkles className="h-4 w-4" />
            </span>
            <h2 className="text-base font-semibold tracking-tight text-slate-900">
              {allRequiredDone
                ? 'Your laboratory is set up'
                : 'Finish setting up your laboratory'}
            </h2>
          </div>
          <p className="text-sm text-slate-500">
            {allRequiredDone
              ? "All essentials are in place — keep an eye on the optional tasks below."
              : 'Complete the essentials to make Cytova ready for daily operations.'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right">
            <div className="text-2xl font-semibold tracking-tight tabular-nums text-slate-900">
              {data.percentage}%
            </div>
            <div className="text-[11px] text-slate-500">
              {data.completed_count}/{data.total_count} steps
            </div>
          </div>
          {allRequiredDone && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={expanded ? 'Hide checklist' : 'Show checklist'}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-6 pb-5">
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-[width] duration-500"
            style={{ width: `${data.percentage}%` }}
            role="progressbar"
            aria-valuenow={data.percentage}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {/* Task list */}
      {expanded && (
        <ol className="border-t border-black/5 px-6 py-4 space-y-3">
          {data.tasks.map((task) => (
            <li key={task.key} className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                {/* Status dot */}
                {task.completed ? (
                  <span
                    aria-label="Completed"
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-1 ring-inset ring-emerald-200"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </span>
                ) : (
                  <span
                    aria-hidden
                    className={cn(
                      'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-1 ring-inset',
                      task.required
                        ? 'bg-blue-50 ring-blue-200'
                        : 'bg-slate-50 ring-slate-200',
                    )}
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        task.required ? 'bg-blue-500' : 'bg-slate-400',
                      )}
                    />
                  </span>
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={cn(
                        'text-sm font-medium',
                        task.completed ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-900',
                      )}
                    >
                      {task.label}
                    </p>
                    {!task.required && (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                        Recommended
                      </span>
                    )}
                  </div>
                  {!task.completed && (
                    <p className="mt-0.5 text-xs text-slate-500">{task.description}</p>
                  )}
                </div>
              </div>

              {/* CTA — only when incomplete */}
              {!task.completed && (
                <button
                  type="button"
                  onClick={() => handleTaskClick(task.href)}
                  className={cn(
                    'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    task.required
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-sm hover:from-blue-700 hover:to-indigo-800 hover:shadow-md'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900',
                  )}
                >
                  Configure
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
