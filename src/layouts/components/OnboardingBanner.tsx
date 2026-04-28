import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowRight, PenLine, Sparkles, X } from 'lucide-react'
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/auth/store'
import { useDashboardSetupProgress } from '@/modules/dashboard/api'
import { SetupProgressCard } from '@/modules/dashboard/components/SetupProgressCard'
import type { DashboardSetupProgress } from '@/modules/dashboard/types'

// sessionStorage so the dismissal lasts for the current browser session
// only — a refresh or a new tab gives the user another chance to act on
// the nudge if their setup is still incomplete. Once setup_progress hits
// 100%, the banner stops rendering for a separate (permanent) reason:
// the gating condition itself fails.
const SS_LAB_ADMIN_KEY = 'cytova:onboarding:lab_admin:dismissed_session'
const SS_BIOLOGIST_KEY = 'cytova:onboarding:biologist_signature:dismissed_session'

// Permanent flag — go-live celebration fires exactly once per user, ever.
// Namespaced by user id so two staff sharing a browser each get their moment.
const LS_CELEBRATED_PREFIX = 'cytova:onboarding:lab_admin:celebrated:'

function readDismissed(key: string): boolean {
  try {
    return window.sessionStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function writeDismissed(key: string) {
  try {
    window.sessionStorage.setItem(key, '1')
  } catch {
    /* sessionStorage unavailable — silently no-op; banner will reappear next mount. */
  }
}

function readCelebrated(userId: string): boolean {
  try {
    return window.localStorage.getItem(LS_CELEBRATED_PREFIX + userId) === '1'
  } catch {
    return false
  }
}

function writeCelebrated(userId: string) {
  try {
    window.localStorage.setItem(LS_CELEBRATED_PREFIX + userId, '1')
  } catch {
    /* localStorage unavailable — toast may re-fire on next visit; acceptable. */
  }
}

/**
 * Map a next-step key to a contextual headline. Designed to read like a
 * coach, not a status indicator: each line tells the user *why* the next
 * action matters. Keys not in the map fall through to the percentage-only
 * default below.
 */
const HEADLINE_BY_KEY: Record<string, string> = {
  catalog_exams:         'Add your first exam to start creating requests',
  partners:              'Add partners to enable external referrals',
  lab_profile:           'Complete your lab profile to generate official reports',
  pdf_settings:          'Configure how your result PDFs look',
  lab_logo:              'Add your logo to brand every report',
  team_users:            'Invite teammates to share the workload',
  patient_notifications: 'Enable email so patients receive their results',
}

function buildHeadline(progress: DashboardSetupProgress): string {
  // "One step away" beats per-key copy — the milestone feels more urgent
  // than the specific task that closes it.
  const incompleteRequired = progress.tasks.filter(
    (t) => t.required && !t.completed,
  ).length
  if (incompleteRequired === 1) {
    return "You're one step away from going live 🚀"
  }
  if (progress.next_step) {
    const fromKey = HEADLINE_BY_KEY[progress.next_step.key]
    if (fromKey) return fromKey
  }
  return `Setup your laboratory — ${progress.percentage}% complete`
}

function buildSubtitle(progress: DashboardSetupProgress): string {
  // Motivational subtitle — short, celebratory tilt as the bar fills up.
  // Falls back to a quiet steps counter so something is always there.
  const incompleteRequired = progress.tasks.filter(
    (t) => t.required && !t.completed,
  ).length
  if (incompleteRequired === 1) return 'Final step'
  if (progress.percentage >= 80) return 'Almost ready'
  if (progress.percentage >= 50) return "You're making good progress"
  return `${progress.completed_count} of ${progress.total_count} steps complete`
}

/**
 * Tenant-wide floating banner that surfaces onboarding nudges based on the
 * logged-in user's role. Sits between the topbar and the page content.
 *
 * Two variants, with priority:
 *   1. BIOLOGIST without an uploaded signature → "Add your validation signature"
 *   2. LAB_ADMIN with setup-progress < 100%   → contextual smart CTA
 *
 * The lab-admin variant uses ``setup_progress.next_step`` to drive a single
 * primary CTA pointed at the most important pending action. When progress
 * reaches 100% for the first time we fire a one-off celebration toast and
 * stop rendering. Dismissal is session-scoped (sessionStorage) — a refresh
 * gives the user another chance to act if setup is still incomplete.
 */
export function OnboardingBanner() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { data: setupProgress } = useDashboardSetupProgress()

  const [labAdminDismissed, setLabAdminDismissed] = useState(() => readDismissed(SS_LAB_ADMIN_KEY))
  const [biologistDismissed, setBiologistDismissed] = useState(() => readDismissed(SS_BIOLOGIST_KEY))

  const [drawerOpen, setDrawerOpen] = useState(false)

  // Animate the progress bar from 0 → actual on mount / when percentage
  // changes. Default initial state to 0 so the first paint shows the
  // empty bar, then the effect transitions it to the live value.
  const [animatedPct, setAnimatedPct] = useState(0)
  useEffect(() => {
    if (setupProgress) setAnimatedPct(setupProgress.percentage)
  }, [setupProgress?.percentage])

  // Go-live transition state. Two phases so we can show the banner at
  // 100% briefly, fade it out smoothly, then unmount:
  //   visible → fading → null
  // Driven by an effect that watches percentage flipping to 100 (after
  // mutation invalidation refreshes the query). Per-user permanent flag
  // ensures we only celebrate once ever, even across sessions.
  type CelebPhase = 'visible' | 'fading' | null
  const [celebrating, setCelebrating] = useState<CelebPhase>(null)
  useEffect(() => {
    if (
      user?.role === 'LAB_ADMIN'
      && user.id
      && setupProgress?.percentage === 100
      && !readCelebrated(user.id)
    ) {
      toast.success('Your laboratory is fully configured and ready 🚀')
      writeCelebrated(user.id)
      setCelebrating('visible')
      const tFade = window.setTimeout(() => setCelebrating('fading'), 1500)
      const tDone = window.setTimeout(() => setCelebrating(null), 1500 + 700)
      return () => {
        window.clearTimeout(tFade)
        window.clearTimeout(tDone)
      }
    }
  }, [user?.role, user?.id, setupProgress?.percentage])

  if (!user) return null

  const showBiologist =
    user.role === 'BIOLOGIST'
    && user.hasSignature === false
    && !biologistDismissed

  const showLabAdmin =
    user.role === 'LAB_ADMIN'
    && setupProgress != null
    && setupProgress.percentage < 100
    && !labAdminDismissed

  // Keep the banner mounted at 100% during the brief celebration window
  // so the user sees a smooth fade-out instead of an abrupt unmount.
  const renderLabAdmin = showLabAdmin || (celebrating !== null && setupProgress != null)

  if (!showBiologist && !renderLabAdmin) return null

  // ---- BIOLOGIST variant ------------------------------------------------
  if (showBiologist) {
    return (
      <div
        className={cn(
          'border-b border-amber-200/70 bg-gradient-to-r from-amber-50/90 via-white/80 to-amber-50/90',
          'shadow-[0_2px_8px_rgba(0,0,0,0.04)] backdrop-blur-sm',
          'animate-fade-in',
        )}
        role="region"
        aria-label="Biologist onboarding"
      >
        <div className="flex items-center gap-4 px-6 py-2.5">
          <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-sm shadow-amber-500/20">
            <PenLine className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">
              Add your validation signature
            </p>
            <p className="truncate text-xs text-slate-500">
              You must configure your signature before validating results.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="hidden sm:inline-flex h-8 items-center gap-1.5 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 px-3 text-xs font-medium text-white shadow-sm transition-all hover:from-amber-600 hover:to-orange-600 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            Add signature
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              writeDismissed(SS_BIOLOGIST_KEY)
              setBiologistDismissed(true)
            }}
            aria-label="Dismiss signature reminder"
            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  // ---- LAB_ADMIN variant ------------------------------------------------
  // Already gated by showLabAdmin; setupProgress is non-null here.
  const progress = setupProgress!
  const headline = buildHeadline(progress)
  const subtitle = buildSubtitle(progress)
  // Smart CTA — backend-resolved next_step. Falls back to a generic
  // "Continue setup" pointing at /settings/laboratory only if next_step
  // is somehow null at < 100% (shouldn't happen, but cheap defence).
  const ctaLabel = progress.next_step?.label ?? 'Continue setup'
  const ctaUrl = progress.next_step?.url ?? '/settings/laboratory'

  return (
    <>
      <div
        className={cn(
          'border-b border-blue-100/80 bg-gradient-to-r from-blue-50/90 via-white/80 to-indigo-50/90',
          'shadow-[0_2px_8px_rgba(0,0,0,0.04)] backdrop-blur-sm',
          'animate-fade-in',
          // Smooth fade-out during the second half of the celebration window.
          'transition-opacity duration-700 ease-out',
          celebrating === 'fading' && 'opacity-0 pointer-events-none',
        )}
        role="region"
        aria-label="Laboratory setup progress"
      >
        <div className="flex items-center gap-4 px-6 py-2.5">
          <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm shadow-blue-500/20">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-slate-900">
                {headline}
              </p>
              <span className="hidden text-xs font-medium text-blue-700 lg:inline">
                · {subtitle}
              </span>
            </div>
            {/* Slim gradient progress bar inline with the title row */}
            <div className="mt-1 hidden h-1 w-full max-w-md overflow-hidden rounded-full bg-slate-200/70 sm:block">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-[width] duration-700 ease-out"
                style={{ width: `${animatedPct}%` }}
                role="progressbar"
                aria-valuenow={progress.percentage}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate(ctaUrl)}
            className="hidden sm:inline-flex h-8 items-center gap-1.5 rounded-md bg-gradient-to-r from-blue-600 to-indigo-700 px-3 text-xs font-medium text-white shadow-sm transition-all hover:from-blue-700 hover:to-indigo-800 hover:shadow-md hover:translate-x-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {ctaLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="hidden md:inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            View checklist
          </button>
          <button
            type="button"
            onClick={() => {
              writeDismissed(SS_LAB_ADMIN_KEY)
              setLabAdminDismissed(true)
            }}
            aria-label="Dismiss setup banner"
            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Slide-over drawer hosts the existing checklist component */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Laboratory setup</SheetTitle>
            <SheetDescription>
              Complete the essentials to make Cytova ready for daily operations.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            <SetupProgressCard
              data={progress}
              onTaskClick={(href) => {
                // Close the drawer first so the new page isn't covered
                // by a stale overlay, then navigate. Both happen in the
                // same render pass so the user sees no jank.
                setDrawerOpen(false)
                navigate(href)
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
