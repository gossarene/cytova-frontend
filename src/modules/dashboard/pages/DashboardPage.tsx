import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/shared/ErrorState'
import { useAuthStore } from '@/lib/auth/store'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/currency'
import {
  useDashboardCockpit,
  useDashboardAnalytics,
} from '../api'
import { DashboardKpiCard } from '../components/DashboardKpiCard'
import { DashboardActionCard } from '../components/DashboardActionCard'
import {
  RequestsByStatusChart,
  RequestsOverTimeChart,
} from '../components/DashboardChartCard'
import { RankedListCard } from '../components/RankedListCard'
import { PartnerInsightsModal } from '../components/PartnerInsightsModal'
import { greetingPrefix } from '../components/cockpit-helpers'
import type { RankedPartner } from '../types'

/**
 * Role-aware operational cockpit. The backend (``GET /dashboard/cockpit/``)
 * returns a payload tailored to the logged-in staff role: the KPIs,
 * actions, and revenue visibility all live in the composer (see
 * ``apps/dashboard/cockpit.py``). This page is "dumb" — it renders
 * whatever the API serves, in four zones:
 *
 *   A. Hero / welcome      — full-bleed gradient strip + greeting + date
 *                            + system-health badge
 *   B. KPI grid            — premium cards, count-aware columns
 *   C. Action zone         — 3-up responsive
 *   D. Analytics zone      — 4 Recharts cards in a 2-column grid
 *
 * Permission gating happens server-side (revenue is only added to the
 * payload for LAB_ADMIN / BILLING_OFFICER); the frontend never has to
 * decide what to hide.
 *
 * Layout note: the page escapes the surrounding ``main p-6`` via
 * ``-m-6`` so the hero stripe can extend edge-to-edge against a calm
 * gray-50 page background — a real "app shell" feel rather than a
 * floating card on a white sheet.
 */
export function DashboardPage() {
  const { data, isLoading, error, refetch } = useDashboardCockpit()
  const { data: analytics, isLoading: analyticsLoading } = useDashboardAnalytics()
  const userFirstName = useAuthStore((s) => s.user?.firstName) ?? ''

  // Top-partners view: billing amount (default) or volume of requests.
  // Modal opens with the same mode the card is currently showing.
  const [partnerMode, setPartnerMode] = useState<'billing' | 'volume'>('billing')
  const [selectedPartner, setSelectedPartner] = useState<RankedPartner | null>(null)

  if (error) {
    return (
      <div className="space-y-6 p-1">
        <ErrorState
          title="Unable to load dashboard"
          message="We couldn't retrieve your laboratory metrics. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  // The backend's greeting_name beats the local store: it's the freshly
  // loaded user identity from the same request that produced the metrics.
  const greetingName = data?.greeting_name || userFirstName || 'there'
  const today = new Intl.DateTimeFormat(undefined, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date())

  // Pick the KPI grid that fits the actual count cleanly.
  // The historical bug: LAB_ADMIN/BILLING_OFFICER get 5 KPIs (active, validated,
  // billed, delivered, alerts) but the grid was hard-coded to 4 columns →
  // "Open Alerts" wrapped to a row of its own. Selecting columns based on
  // count keeps every card on the same row at xl, and degrades to a clean
  // 2-row layout on smaller viewports.
  const kpiCount = data?.kpis.length ?? 4
  const kpiGridCols =
    kpiCount === 5 ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
    : kpiCount === 6 ? 'sm:grid-cols-2 lg:grid-cols-3'
    : kpiCount === 3 ? 'sm:grid-cols-2 lg:grid-cols-3'
    : 'sm:grid-cols-2 lg:grid-cols-4'

  return (
    <div className="-m-6 min-h-[calc(100%+3rem)] bg-gray-50">
      {/* A. Hero / welcome — full-bleed gradient strip ----------------- */}
      <header className="border-b border-black/5 bg-gradient-to-r from-blue-50 via-white to-indigo-50 px-6 py-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5 animate-fade-in">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-[2rem]">
              {greetingPrefix()}, {greetingName}
            </h1>
            <p className="text-sm text-slate-500">
              Here's what needs attention in your lab today.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 animate-fade-in animation-delay-100">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-xs font-medium text-slate-600 backdrop-blur-sm">
              <CalendarDays className="h-3.5 w-3.5" />
              {today}
            </span>
          </div>
        </div>
      </header>

      {/* Page content ------------------------------------------------- */}
      <div className="space-y-10 p-6">

        {/* B. KPI grid ------------------------------------------------ */}
        <section aria-labelledby="kpi-heading" className="animate-fade-in animation-delay-100">
          <h2 id="kpi-heading" className="sr-only">Key metrics</h2>
          <div className={`grid gap-5 ${kpiGridCols}`}>
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <DashboardKpiCard
                    key={`skeleton-${i}`}
                    isLoading
                    kpi={{ key: `s${i}`, label: '', value: 0, icon: 'clipboard-list', tone: 'neutral', href: null }}
                  />
                ))
              : data?.kpis.map((kpi) => <DashboardKpiCard key={kpi.key} kpi={kpi} />)}
          </div>
        </section>

        {/* C. Action zone --------------------------------------------- */}
        {data && data.actions.length > 0 && (
          <section aria-labelledby="actions-heading" className="animate-fade-in animation-delay-200">
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 id="actions-heading" className="text-lg font-semibold tracking-tight text-slate-900">
                Priority actions
              </h2>
              <span className="text-xs text-slate-500">
                Tasks waiting on you
              </span>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.actions.map((action) => (
                <DashboardActionCard key={action.key} action={action} />
              ))}
            </div>
          </section>
        )}

        {/* D. Analytics zone ----------------------------------------- */}
        <section aria-labelledby="analytics-heading" className="animate-fade-in animation-delay-300">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 id="analytics-heading" className="text-lg font-semibold tracking-tight text-slate-900">
              Analytics
            </h2>
            <span className="text-xs text-slate-500">
              Live operational metrics
            </span>
          </div>

          {isLoading || !data ? (
            <div className="space-y-5">
              <div className="grid gap-5 xl:grid-cols-3">
                <Skeleton className="h-64 rounded-xl xl:col-span-2" />
                <Skeleton className="h-64 rounded-xl" />
              </div>
              <div className="grid gap-5 xl:grid-cols-3">
                <Skeleton className="h-72 rounded-xl" />
                <Skeleton className="h-72 rounded-xl" />
                <Skeleton className="h-72 rounded-xl" />
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Row 1 — wide trend chart + status breakdown ----------- */}
              <div className="grid gap-5 xl:grid-cols-3">
                <div className="xl:col-span-2">
                  <RequestsOverTimeChart data={data.charts.requests_over_time} />
                </div>
                <RequestsByStatusChart data={data.charts.requests_by_status} />
              </div>

              {/* Row 2 — three ranked-insight cards ------------------- */}
              {analyticsLoading || !analytics ? (
                <div className="grid gap-5 xl:grid-cols-3">
                  <Skeleton className="h-72 rounded-xl" />
                  <Skeleton className="h-72 rounded-xl" />
                  <Skeleton className="h-72 rounded-xl" />
                </div>
              ) : (
                <div className="grid gap-5 xl:grid-cols-3">
                  <RankedListCard
                    title="Top requested exams"
                    subtitle="This month"
                    tone="primary"
                    items={analytics.top_exams.map((e) => ({
                      id: e.code,
                      label: e.name,
                      caption: e.code,
                      value: e.count,
                    }))}
                    emptyMessage="No exams requested yet this month."
                  />

                  <RankedListCard
                    title="Top partners"
                    subtitle={partnerMode === 'billing' ? 'Billed this month' : 'Requests this month'}
                    tone="success"
                    headerExtra={
                      <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5">
                        <button
                          type="button"
                          onClick={() => setPartnerMode('billing')}
                          className={cn(
                            'rounded px-2 py-0.5 text-[11px] font-medium transition-colors',
                            partnerMode === 'billing'
                              ? 'bg-white text-slate-900 shadow-sm'
                              : 'text-slate-500 hover:text-slate-900',
                          )}
                        >
                          Amount
                        </button>
                        <button
                          type="button"
                          onClick={() => setPartnerMode('volume')}
                          className={cn(
                            'rounded px-2 py-0.5 text-[11px] font-medium transition-colors',
                            partnerMode === 'volume'
                              ? 'bg-white text-slate-900 shadow-sm'
                              : 'text-slate-500 hover:text-slate-900',
                          )}
                        >
                          Volume
                        </button>
                      </div>
                    }
                    items={analytics.top_partners.map((p) => ({
                      id: p.name,
                      label: p.name,
                      value: partnerMode === 'billing' ? Number(p.amount) : p.requests,
                      display: partnerMode === 'billing'
                        ? formatCurrency(p.amount)
                        : `${p.requests}`,
                    }))}
                    onItemClick={(it) => {
                      const partner = analytics.top_partners.find((p) => p.name === it.id) ?? null
                      setSelectedPartner(partner)
                    }}
                    emptyMessage="No partner activity yet this month."
                  />

                  <RankedListCard
                    title="Most abnormal results"
                    subtitle="Exams with the highest abnormal count"
                    tone="danger"
                    items={analytics.abnormal_exams.map((e) => ({
                      id: e.code,
                      label: e.name,
                      caption: `of ${e.total} total`,
                      value: e.count,
                      display: `${e.count}`,
                    }))}
                    emptyMessage="No abnormal results this month."
                  />
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <PartnerInsightsModal
        partner={selectedPartner}
        defaultMode={partnerMode}
        onClose={() => setSelectedPartner(null)}
      />
    </div>
  )
}
