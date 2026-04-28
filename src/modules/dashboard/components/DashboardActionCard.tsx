import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TONE_CLASSES, resolveActionIcon } from './cockpit-helpers'
import type { DashboardAction } from '../types'

/**
 * Action card — icon + title + count badge + short description + compact CTA.
 *
 * Layout:
 *   - 4px tone-coloured left rail anchors the card visually
 *   - tinted icon chip beside the title (resolved heuristically from the
 *     action key — alert / billing / stock / etc.)
 *   - shared premium substrate (gradient + border + soft shadow)
 *   - count badge on the right with the same tone tint
 *   - compact gradient CTA anchored bottom-right (mt-auto + justify-end)
 *
 * The whole card is the click target (Link); the visible "button" is a
 * styled <span> so we don't nest interactive elements. The tone signal
 * stays on the rail + icon chip; the CTA itself uses a uniform Cytova
 * blue→indigo gradient so the action row reads as one premium family
 * (fintech-style consistency, not a quilt of coloured buttons).
 */
export function DashboardActionCard({ action }: { action: DashboardAction }) {
  const tone = TONE_CLASSES[action.tone]
  const Icon = resolveActionIcon(action.key)
  return (
    <Link
      to={action.href}
      className={cn(
        'group flex h-full flex-col border-l-4',
        tone.surface,
        tone.rail,
        'cursor-pointer hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      )}
    >
      <div className="flex flex-1 flex-col gap-3 p-6">
        {/* Header: icon + title (left) — count badge (right) */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                'transition-transform duration-200 group-hover:scale-110',
                tone.iconChip,
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <h3 className="truncate text-base font-semibold tracking-tight text-slate-900">
              {action.title}
            </h3>
          </div>
          {action.count > 0 && (
            <span
              className={cn(
                'inline-flex h-6 min-w-[1.75rem] items-center justify-center rounded-full px-2 text-xs font-semibold tabular-nums',
                tone.iconChip,
              )}
            >
              {action.count}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-sm leading-relaxed text-muted-foreground">
          {action.description}
        </p>

        {/* CTA — anchored bottom-right; mt-auto pushes it to the card foot
            so cards with different description lengths still align cleanly. */}
        <div className="mt-auto flex justify-end pt-2">
          <span
            className={cn(
              'inline-flex h-9 items-center gap-1.5 rounded-md px-4 text-sm font-medium',
              'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-sm',
              'transition-all duration-200',
              'group-hover:from-blue-700 group-hover:to-indigo-800 group-hover:translate-x-0.5 group-hover:shadow-md',
            )}
          >
            {action.cta}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}
