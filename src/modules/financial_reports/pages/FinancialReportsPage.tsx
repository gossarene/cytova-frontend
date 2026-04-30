import { Fragment, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'
import {
  Activity, BarChart3, Check, ChevronDown, ChevronRight, ClipboardList,
  Download, FileSpreadsheet, FlaskConical, Tag,
  TrendingUp, Users, Wallet,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/currency'
import { usePartners } from '@/modules/partners/api'
import { useFinancialReportPreview, useFinancialReportExport } from '../api'
import type {
  FinancialReportFilters, FinancialSourceType,
} from '../types'

type QuickPeriodKey = 'this_month' | 'last_month' | 'last_7' | 'this_quarter'
type LucideIcon = typeof Activity

/**
 * Financial Reports — read-only simulation surface.
 *
 * Distinct from /invoices: filters → preview → export PDF, with no Invoice
 * record ever created and no period locking. Layout:
 *
 *   1. Filters card (period, source, partner multi-select)
 *   2. KPI summary (requests, exams, gross, discount, net)
 *   3. Preview table
 *   4. Export + Analyze graphically actions
 *   5. Analytics zone (collapsed by default; reveals on demand)
 *
 * All data is real: the page never displays anything until the user has
 * clicked "Generate preview" and the backend has returned a payload.
 */
export function FinancialReportsPage() {
  // ---- Filter state ----------------------------------------------------
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)

  const [periodStart, setPeriodStart] = useState(fmt(startOfMonth))
  const [periodEnd, setPeriodEnd] = useState(fmt(today))
  const [activeQuickPeriod, setActiveQuickPeriod] = useState<QuickPeriodKey | null>('this_month')
  const [sourceType, setSourceType] = useState<FinancialSourceType>('ALL')
  const [partnerIds, setPartnerIds] = useState<string[]>([])
  const [showCharts, setShowCharts] = useState(false)
  const [timeMetric, setTimeMetric] = useState<'revenue' | 'requests'>('revenue')
  /** Set of expanded request_ids in the preview table (drill-down). */
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  /** Partner-selector drawer state. ``draft`` is the in-flight selection
   *  the drawer mutates; on Apply it replaces ``partnerIds``. On Cancel
   *  the draft is discarded. */
  const [partnerDrawerOpen, setPartnerDrawerOpen] = useState(false)
  const [partnerDraft, setPartnerDraft] = useState<string[]>([])
  const [partnerSearch, setPartnerSearch] = useState('')

  function toggleExpanded(id: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  /** Quick-period helpers. They populate the date inputs and let the
   *  user click "Run analysis" — they don't auto-run the query. The
   *  applied key is tracked so the chip can show its active state. */
  function applyQuickPeriod(kind: QuickPeriodKey) {
    const now = new Date()
    let start: Date, end: Date
    if (kind === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      end = now
    } else if (kind === 'last_month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      end = new Date(now.getFullYear(), now.getMonth(), 0)
    } else if (kind === 'last_7') {
      start = new Date(now)
      start.setDate(now.getDate() - 6)
      end = now
    } else {
      // this_quarter — Jan/Apr/Jul/Oct
      const qStartMonth = Math.floor(now.getMonth() / 3) * 3
      start = new Date(now.getFullYear(), qStartMonth, 1)
      end = now
    }
    setPeriodStart(fmt(start))
    setPeriodEnd(fmt(end))
    setActiveQuickPeriod(kind)
  }

  /** Manual edits to the date inputs clear the active quick-period
   *  highlight — otherwise the chip would lie about what's currently
   *  in effect. */
  function handlePeriodChange(which: 'start' | 'end', value: string) {
    if (which === 'start') setPeriodStart(value)
    else setPeriodEnd(value)
    setActiveQuickPeriod(null)
  }

  function openPartnerDrawer() {
    setPartnerDraft(partnerIds)
    setPartnerSearch('')
    setPartnerDrawerOpen(true)
  }
  function applyPartnerSelection() {
    setPartnerIds(partnerDraft)
    setPartnerDrawerOpen(false)
  }

  // Active partners for the multi-select. Filter on is_active server-side
  // would be cleaner; the list endpoint already returns only active by
  // default, but we double-check on the client to be safe.
  const partnersQuery = usePartners({ is_active: 'true' })
  const partners = (partnersQuery.data?.data ?? []).filter((p) => p.is_active)

  // ---- Mutations -------------------------------------------------------
  const preview = useFinancialReportPreview()
  const exporter = useFinancialReportExport()

  function buildPayload(): FinancialReportFilters {
    return {
      period_start: periodStart,
      period_end: periodEnd,
      source_type: sourceType,
      partner_ids: sourceType === 'PARTNER' ? partnerIds : [],
    }
  }

  async function handlePreview() {
    try {
      await preview.mutateAsync(buildPayload())
    } catch (e: any) {
      toast.error(e?.response?.data?.errors?.[0]?.detail ?? 'Failed to generate preview.')
    }
  }

  async function handleExport() {
    try {
      const { blob, filename } = await exporter.mutateAsync(buildPayload())
      // Trigger a synthetic <a download> click so the browser saves the PDF.
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e: any) {
      toast.error(e?.response?.data?.errors?.[0]?.detail ?? 'Failed to export PDF.')
    }
  }

  // ---- Chart axis styling ---------------------------------------------
  // Heavier text + bumped size for readability. Currency formatter matches
  // the tenant locale (XAF / "F CFA") via the shared formatCurrency helper.
  const axisTickStyle = { fontSize: 12, fill: '#334155', fontWeight: 500 }
  const formatCurrencyAxis = (value: number | string) => formatCurrency(value)
  const formatCountAxis = (value: number) =>
    new Intl.NumberFormat('fr-FR').format(value)

  // ---- Derived ---------------------------------------------------------
  const data = preview.data
  const charts = data?.charts

  // Show the Top-partners chart per the spec rules:
  //   - source = ALL                       → show
  //   - source = PARTNER, no ids           → show (all partners)
  //   - source = PARTNER, multiple ids     → show
  //   - source = DIRECT or single partner  → hide
  // Backend already enforces this and emits an empty list when the chart
  // shouldn't render — the UI just uses the array length.
  const showTopPartners = (charts?.top_partners_by_revenue?.length ?? 0) > 0

  // Partner-comparison chart only when 2+ series came back.
  const showPartnerComparison = (charts?.partner_time_comparison?.length ?? 0) >= 2

  const sourceColors: Record<string, string> = useMemo(
    () => ({
      DIRECT_PATIENT: '#2563eb',
      PARTNER_ORGANIZATION: '#10b981',
    }),
    [],
  )
  const partnerLineColors = ['#2563eb', '#10b981', '#f59e0b', '#a855f7', '#ef4444']

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Reports"
        description="Run financial simulations over any period."
      />

      {/* ---- Filters card (sticky on scroll) ------------------------ */}
      <section
        className={cn(
          // sticky-y so it pins below the topbar / onboarding banner; the
          // page's main scroll container is the parent <main> in TenantLayout.
          'sticky top-0 z-10',
          'rounded-xl border border-black/5 bg-white/85 backdrop-blur-md',
          'shadow-[0_10px_30px_rgba(0,0,0,0.06)]',
        )}
      >
        {/* Row 1 — period inputs · source · primary CTA */}
        <div className="flex flex-wrap items-end gap-4 px-5 pt-4 pb-3">
          <div className="space-y-1.5">
            <Label htmlFor="period_start" className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">From</Label>
            <Input
              id="period_start" type="date"
              value={periodStart}
              onChange={(e) => handlePeriodChange('start', e.target.value)}
              className="h-9 w-[10rem]"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="period_end" className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">To</Label>
            <Input
              id="period_end" type="date"
              value={periodEnd}
              onChange={(e) => handlePeriodChange('end', e.target.value)}
              className="h-9 w-[10rem]"
            />
          </div>
          <div className="space-y-1.5">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Source
            </span>
            <div className="inline-flex h-9 rounded-md border border-slate-200 bg-slate-50 p-0.5">
              {(['ALL', 'DIRECT_PATIENT', 'PARTNER'] as FinancialSourceType[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSourceType(s)}
                  className={cn(
                    'rounded px-3 text-xs font-medium transition-all',
                    sourceType === s
                      ? 'bg-gradient-to-b from-white to-slate-50 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200'
                      : 'text-slate-500 hover:text-slate-900',
                  )}
                >
                  {s === 'ALL' ? 'All' : s === 'DIRECT_PATIENT' ? 'Direct' : 'Partner'}
                </button>
              ))}
            </div>
          </div>

          {/* Partner trigger — only when source=PARTNER */}
          {sourceType === 'PARTNER' && (
            <div className="space-y-1.5">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Partners
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={openPartnerDrawer}
                  className={cn(
                    'inline-flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-medium transition-colors',
                    partnerIds.length > 0
                      ? 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300',
                  )}
                >
                  <Users className="h-3.5 w-3.5" />
                  {partnerIds.length === 0
                    ? 'Select partners'
                    : `Partners: ${partnerIds.length} selected`}
                  {partnerIds.length > 0 && (
                    <span className="inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white">
                      {partnerIds.length}
                    </span>
                  )}
                </button>
                {partnerIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPartnerIds([])}
                    className="text-[11px] font-medium text-slate-500 hover:text-slate-900"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Primary CTA — right-aligned, compact, sparkline icon */}
          <div className="ml-auto">
            <Button
              onClick={handlePreview}
              disabled={preview.isPending}
              className={cn(
                'h-9 gap-2 bg-gradient-to-r from-blue-600 to-indigo-700',
                'shadow-sm shadow-blue-600/20',
                'hover:from-blue-700 hover:to-indigo-800 hover:shadow-md hover:shadow-blue-600/30',
              )}
            >
              <Activity className="h-4 w-4" />
              {preview.isPending ? 'Running…' : 'Run analysis'}
            </Button>
          </div>
        </div>

        {/* Row 2 — quick-period chips with active-state highlight */}
        <div className="flex flex-wrap items-center gap-2 border-t border-black/5 px-5 py-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Quick period
          </span>
          {([
            { key: 'this_month',    label: 'This month' },
            { key: 'last_month',    label: 'Last month' },
            { key: 'last_7',        label: 'Last 7 days' },
            { key: 'this_quarter',  label: 'This quarter' },
          ] as { key: QuickPeriodKey; label: string }[]).map((q) => {
            const active = activeQuickPeriod === q.key
            return (
              <button
                key={q.key}
                type="button"
                onClick={() => applyQuickPeriod(q.key)}
                className={cn(
                  'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-all',
                  active
                    ? 'border-blue-400 bg-blue-50 text-blue-700 shadow-sm shadow-blue-600/10'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50/60 hover:text-blue-700',
                )}
              >
                {active && <Check className="mr-1 h-3 w-3" />}
                {q.label}
              </button>
            )
          })}
        </div>
      </section>

      {/* ---- Partner-selector drawer -------------------------------- */}
      <PartnerDrawer
        open={partnerDrawerOpen}
        onOpenChange={setPartnerDrawerOpen}
        partners={partners}
        loading={partnersQuery.isLoading}
        draft={partnerDraft}
        setDraft={setPartnerDraft}
        search={partnerSearch}
        setSearch={setPartnerSearch}
        onApply={applyPartnerSelection}
      />

      {/* ---- Empty state before first preview ---------------------- */}
      {!data && !preview.isPending && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <FileSpreadsheet className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-700">
            Choose your filters and click <span className="font-semibold">Generate preview</span>.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Nothing is committed — this is a simulation. No Invoice will be created.
          </p>
        </div>
      )}

      {preview.isPending && (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      )}

      {/* ---- KPI summary ------------------------------------------- */}
      {data && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <KpiCard label="Requests" value={String(data.summary.request_count)} icon={ClipboardList} />
            <KpiCard label="Exams"    value={String(data.summary.exam_count)}    icon={FlaskConical} />
            <KpiCard label="Gross"    value={formatCurrency(data.summary.gross_total)}    icon={Wallet} />
            <KpiCard label="Discount" value={formatCurrency(data.summary.discount_total)} icon={Tag}          tone="warning" />
            <KpiCard label="Net"      value={formatCurrency(data.summary.net_total)}      icon={TrendingUp}   tone="success" />
          </section>

          {/* ---- Actions row ----------------------------------------- */}
          {/* TODO: add Excel export for financial reports. */}
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleExport} disabled={exporter.isPending} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              {exporter.isPending ? 'Exporting…' : 'Export PDF'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCharts((v) => !v)}
              className="gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              {showCharts ? 'Hide analytics' : 'Analyze graphically'}
            </Button>
          </div>

          {/* ---- Preview table -------------------------------------- */}
          <section className="rounded-xl border border-black/5 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <div className="border-b border-black/5 px-5 py-3">
              <h2 className="text-sm font-semibold text-slate-900">Preview ({data.rows.length} rows)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="w-8 px-2 py-2" aria-label="Expand" />
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Reference</th>
                    <th className="px-4 py-2 text-left">Patient</th>
                    <th className="px-4 py-2 text-left">Source</th>
                    <th className="px-4 py-2 text-left">Partner</th>
                    <th className="px-4 py-2 text-right">Exams</th>
                    <th className="px-4 py-2 text-right">Gross</th>
                    <th className="px-4 py-2 text-right">Discount</th>
                    <th className="px-4 py-2 text-right">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.rows.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center text-sm text-slate-500">
                        No data in the selected period.
                      </td>
                    </tr>
                  ) : data.rows.map((r) => {
                    const expanded = expandedRows.has(r.request_id)
                    return (
                      <Fragment key={r.request_id}>
                        <tr className="hover:bg-slate-50/60">
                          <td className="w-8 px-2 py-2">
                            <button
                              type="button"
                              onClick={() => toggleExpanded(r.request_id)}
                              aria-label={expanded ? 'Collapse exam list' : 'Expand exam list'}
                              aria-expanded={expanded}
                              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              {expanded
                                ? <ChevronDown className="h-3.5 w-3.5" />
                                : <ChevronRight className="h-3.5 w-3.5" />}
                            </button>
                          </td>
                          <td className="px-4 py-2 tabular-nums">{r.date ?? '—'}</td>
                          <td className="px-4 py-2 font-mono text-xs">{r.reference}</td>
                          <td className="px-4 py-2">{r.patient_name}</td>
                          <td className="px-4 py-2 text-xs text-slate-500">
                            {r.source_type === 'DIRECT_PATIENT' ? 'Direct' : 'Partner'}
                          </td>
                          <td className="px-4 py-2 text-xs text-slate-500">{r.partner_name || '—'}</td>
                          <td className="px-4 py-2 text-right tabular-nums">{r.exam_count}</td>
                          <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(r.gross_amount)}</td>
                          <td className="px-4 py-2 text-right tabular-nums text-amber-700">
                            {formatCurrency(r.discount_amount)}
                          </td>
                          <td className="px-4 py-2 text-right font-medium tabular-nums">
                            {formatCurrency(r.net_amount)}
                          </td>
                        </tr>
                        {expanded && (
                          <tr className="bg-slate-50/50">
                            <td colSpan={10} className="px-4 py-3">
                              <div className="rounded-lg border border-slate-200 bg-white">
                                <table className="min-w-full text-xs">
                                  <thead className="text-[10px] uppercase tracking-wider text-slate-500">
                                    <tr>
                                      <th className="px-3 py-2 text-left">Code</th>
                                      <th className="px-3 py-2 text-left">Exam</th>
                                      <th className="px-3 py-2 text-right">Qty</th>
                                      <th className="px-3 py-2 text-right">Unit price</th>
                                      <th className="px-3 py-2 text-right">Gross</th>
                                      <th className="px-3 py-2 text-right">Discount</th>
                                      <th className="px-3 py-2 text-right">Net</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {r.exams.length === 0 ? (
                                      <tr>
                                        <td colSpan={7} className="px-3 py-3 text-center text-slate-500">
                                          No exam lines for this request.
                                        </td>
                                      </tr>
                                    ) : r.exams.map((e) => (
                                      <tr key={`${r.request_id}-${e.code}`} className="hover:bg-slate-50/60">
                                        <td className="px-3 py-2 font-mono text-[11px] text-slate-500">{e.code}</td>
                                        <td className="px-3 py-2">{e.name}</td>
                                        <td className="px-3 py-2 text-right tabular-nums">{e.quantity}</td>
                                        <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(e.unit_price)}</td>
                                        <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(e.gross_amount)}</td>
                                        <td className="px-3 py-2 text-right tabular-nums text-amber-700">{formatCurrency(e.discount_amount)}</td>
                                        <td className="px-3 py-2 text-right font-medium tabular-nums">{formatCurrency(e.net_amount)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* ---- Analytics ------------------------------------------ */}
          {showCharts && charts && (
            <section className="space-y-5">
              <div className="grid gap-5 lg:grid-cols-2">
                {/* Source distribution — donut */}
                <ChartCard title="Source distribution" subtitle="Net revenue by source">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={charts.source_distribution.map((d) => ({
                          name: d.source === 'DIRECT_PATIENT' ? 'Direct' : 'Partner',
                          value: Number(d.value) || 0,
                          source: d.source,
                        }))}
                        dataKey="value" nameKey="name"
                        innerRadius={56} outerRadius={86}
                        paddingAngle={3}
                        stroke="#fff" strokeWidth={2}
                      >
                        {charts.source_distribution.map((d, i) => (
                          <Cell key={i} fill={sourceColors[d.source] ?? '#94a3b8'} />
                        ))}
                      </Pie>
                      <Tooltip content={<PremiumTooltip />} />
                      <Legend verticalAlign="bottom" height={24} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>

                {/* Time evolution — line with metric toggle */}
                <ChartCard
                  title="Time evolution"
                  subtitle="Daily activity over the selected period"
                  headerRight={
                    <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5">
                      {(['revenue', 'requests'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setTimeMetric(m)}
                          className={cn(
                            'rounded px-2 py-0.5 text-[11px] font-medium capitalize transition-colors',
                            timeMetric === m
                              ? 'bg-white text-slate-900 shadow-sm'
                              : 'text-slate-500 hover:text-slate-900',
                          )}
                        >
                          {m === 'revenue' ? 'Revenue' : 'Volume'}
                        </button>
                      ))}
                    </div>
                  }
                >
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart
                      data={charts.time_evolution.map((p) => ({
                        date: p.date,
                        revenue: Number(p.revenue) || 0,
                        requests: p.requests,
                      }))}
                      margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="frTimeArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563eb" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                      <XAxis dataKey="date" tick={axisTickStyle} tickFormatter={(v) => v.slice(5)} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                      <YAxis
                        tick={axisTickStyle} tickLine={false} axisLine={false}
                        width={timeMetric === 'revenue' ? 96 : 56}
                        tickFormatter={timeMetric === 'revenue' ? formatCurrencyAxis : formatCountAxis}
                      />
                      <Tooltip content={<PremiumTooltip metric={timeMetric} />} />
                      <Area
                        type="monotone"
                        dataKey={timeMetric}
                        name={timeMetric === 'revenue' ? 'Revenue' : 'Requests'}
                        stroke="#2563eb" strokeWidth={2.25} fill="url(#frTimeArea)"
                        activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: '#2563eb' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                {/* Top exams by revenue */}
                <ChartCard title="Top exams by revenue">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={charts.top_exams_by_revenue.slice(0, 8).map((e) => ({
                        name: e.name, value: Number(e.value) || 0,
                      }))}
                      layout="vertical"
                      margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" horizontal={false} />
                      <XAxis type="number" tick={axisTickStyle} tickLine={false} axisLine={false} tickFormatter={formatCurrencyAxis} />
                      <YAxis dataKey="name" type="category" tick={axisTickStyle} tickLine={false} axisLine={false} width={140} />
                      <Tooltip content={<PremiumTooltip metric="revenue" />} />
                      <Bar dataKey="value" name="Revenue" fill="#2563eb" radius={[0, 6, 6, 0]} maxBarSize={22} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                {/* Top exams by volume */}
                <ChartCard title="Top exams by volume">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={charts.top_exams_by_volume.slice(0, 8).map((e) => ({
                        name: e.name, value: Number(e.value) || 0,
                      }))}
                      layout="vertical"
                      margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" horizontal={false} />
                      <XAxis type="number" tick={axisTickStyle} tickLine={false} axisLine={false} tickFormatter={formatCountAxis} />
                      <YAxis dataKey="name" type="category" tick={axisTickStyle} tickLine={false} axisLine={false} width={140} />
                      <Tooltip content={<PremiumTooltip metric="requests" />} />
                      <Bar dataKey="value" name="Requests" fill="#10b981" radius={[0, 6, 6, 0]} maxBarSize={22} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>

              {/* Top partners — horizontal bar, conditional */}
              {showTopPartners && (
                <ChartCard title="Top partners by revenue">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={charts.top_partners_by_revenue.map((p) => ({
                        name: p.name, value: Number(p.value) || 0,
                      }))}
                      layout="vertical"
                      margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" horizontal={false} />
                      <XAxis type="number" tick={axisTickStyle} tickLine={false} axisLine={false} tickFormatter={formatCurrencyAxis} />
                      <YAxis dataKey="name" type="category" tick={axisTickStyle} tickLine={false} axisLine={false} width={160} />
                      <Tooltip content={<PremiumTooltip metric="revenue" />} />
                      <Bar dataKey="value" name="Revenue" fill="#1e40af" radius={[0, 6, 6, 0]} maxBarSize={22} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {/* Partner comparison — multi-line, conditional */}
              {showPartnerComparison && (
                <ChartCard title="Partner comparison over time" subtitle="Net revenue per partner">
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart
                      data={mergePartnerSeries(charts.partner_time_comparison)}
                      margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                      <XAxis dataKey="date" tick={axisTickStyle} tickFormatter={(v) => v.slice(5)} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                      <YAxis tick={axisTickStyle} tickLine={false} axisLine={false} width={96} tickFormatter={formatCurrencyAxis} />
                      <Tooltip content={<PremiumTooltip metric="revenue" />} />
                      <Legend verticalAlign="bottom" height={24} iconType="circle" />
                      {charts.partner_time_comparison.map((s, i) => (
                        <Line
                          key={s.partner_id ?? s.name}
                          type="monotone"
                          dataKey={s.name}
                          stroke={partnerLineColors[i % partnerLineColors.length]}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}
            </section>
          )}
        </>
      )}
    </div>
  )
}


// ---------------------------------------------------------------------------
// Local helpers
// ---------------------------------------------------------------------------

interface KpiCardProps {
  label: string
  value: string
  icon: LucideIcon
  tone?: 'success' | 'warning' | 'neutral'
}

function KpiCard({ label, value, icon: Icon, tone = 'neutral' }: KpiCardProps) {
  const accent =
    tone === 'success' ? 'text-emerald-700'
    : tone === 'warning' ? 'text-amber-700'
    : 'text-slate-900'
  const iconChip =
    tone === 'success' ? 'bg-emerald-100 text-emerald-600 ring-emerald-200/60'
    : tone === 'warning' ? 'bg-amber-100 text-amber-600 ring-amber-200/60'
    : 'bg-blue-100 text-blue-600 ring-blue-200/60'
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border border-black/5 bg-gradient-to-br from-white to-gray-50 p-4',
        'shadow-[0_10px_30px_rgba(0,0,0,0.06)]',
        'transition-all duration-200 hover:shadow-[0_14px_36px_rgba(37,99,235,0.10)] hover:-translate-y-0.5',
      )}
    >
      {/* Top gradient stripe — Cytova blue → navy */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-800"
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
            {label}
          </p>
          <p className={cn('mt-1 text-xl font-semibold tracking-tight tabular-nums', accent)}>
            {value}
          </p>
        </div>
        <span
          aria-hidden
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset shadow-sm',
            iconChip,
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  )
}

function ChartCard({
  title, subtitle, headerRight, children,
}: {
  title: string
  subtitle?: string
  headerRight?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-black/5 bg-gradient-to-br from-white to-gray-50 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-3 border-b border-black/5 px-5 pt-4 pb-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {headerRight}
      </div>
      <div className="px-3 py-3">{children}</div>
    </div>
  )
}

/** Recharts tooltip styled to match the rest of the design system.
 *  ``metric`` controls value formatting: "revenue" → FCFA, "requests"
 *  → integer with thousand separators, otherwise raw value. */
function PremiumTooltip({
  active, payload, label,
  metric,
}: any & { metric?: 'revenue' | 'requests' }) {
  if (!active || !payload?.length) return null
  const fmt = (v: number | string) => {
    if (metric === 'revenue') return formatCurrency(v)
    if (metric === 'requests') return new Intl.NumberFormat('fr-FR').format(Number(v) || 0)
    return v
  }
  return (
    <div className="rounded-lg border border-black/5 bg-white/95 px-3 py-2 text-xs shadow-[0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-sm">
      {label !== undefined && label !== '' && (
        <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-slate-500">
          {label}
        </div>
      )}
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 tabular-nums">
          <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: entry.color || entry.payload?.fill || '#2563eb' }} />
          <span className="font-medium text-slate-900">
            {entry.name}{entry.name ? ': ' : ''}{fmt(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Partner-selector drawer — search + checkboxes + bulk actions, with a
// draft buffer so Cancel discards changes and Apply commits them.
// ---------------------------------------------------------------------------

interface PartnerDrawerProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  partners: { id: string; name: string; code: string }[]
  loading: boolean
  draft: string[]
  setDraft: (ids: string[]) => void
  search: string
  setSearch: (s: string) => void
  onApply: () => void
}

function PartnerDrawer({
  open, onOpenChange, partners, loading,
  draft, setDraft, search, setSearch, onApply,
}: PartnerDrawerProps) {
  const filtered = partners.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
    || p.code.toLowerCase().includes(search.toLowerCase()),
  )
  const draftSet = new Set(draft)
  function toggle(id: string) {
    const next = new Set(draftSet)
    if (next.has(id)) next.delete(id); else next.add(id)
    setDraft(Array.from(next))
  }
  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => draftSet.has(p.id))

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="border-b border-slate-200 px-5 pt-5 pb-3">
          <SheetTitle>Select partners</SheetTitle>
          <SheetDescription>
            Filter the financial report to specific partner organizations.
          </SheetDescription>
        </SheetHeader>

        {/* Search */}
        <div className="border-b border-slate-100 px-5 py-3">
          <Label
            htmlFor="partner-drawer-search"
            className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500"
          >
            Search
          </Label>
          <Input
            id="partner-drawer-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search partners (name or code)"
            className="h-9 px-3.5"
          />
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              <span className="font-semibold text-slate-900">{draft.length}</span>
              {' selected · '}
              {filtered.length} matching
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  // Select-all = union of current draft + filtered IDs.
                  const next = new Set(draftSet)
                  filtered.forEach((p) => next.add(p.id))
                  setDraft(Array.from(next))
                }}
                className="font-medium text-blue-600 hover:text-blue-800"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={() => setDraft([])}
                className="font-medium text-slate-500 hover:text-slate-900"
              >
                Clear all
              </button>
            </div>
          </div>
        </div>

        {/* Checkbox list */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {loading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-slate-500">No partners match.</p>
          ) : (
            <ul className="space-y-0.5">
              {filtered.map((p) => {
                const selected = draftSet.has(p.id)
                return (
                  <li key={p.id}>
                    {/* <label> forwards a click on any part of the row to
                        the native checkbox, so the row click and the
                        checkbox click both fire ``onChange`` exactly once
                        — no double-toggle gymnastics required. The
                        checkbox is fully controlled (``checked`` bound to
                        the draft set) so it always reflects state. */}
                    <label
                      className={cn(
                        'flex w-full cursor-pointer items-center gap-3 rounded-md border px-3 py-2 transition-colors',
                        selected
                          ? 'border-blue-200 bg-blue-50 text-slate-900'
                          : 'border-transparent text-slate-700 hover:bg-gray-50',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggle(p.id)}
                        // ``accent-blue-600`` paints the native check mark
                        // in Cytova blue across all modern browsers without
                        // requiring a custom rendered control.
                        className="h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 accent-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm">{p.name}</span>
                      <span className="font-mono text-[10px] text-slate-400">{p.code}</span>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Sticky footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50/80 px-5 py-3 backdrop-blur-sm">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onApply} className="gap-2">
            <Check className="h-4 w-4" />
            {allFilteredSelected && draft.length === filtered.length
              ? 'Apply (all)'
              : `Apply (${draft.length})`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/** Flatten partner-time-comparison series into the wide format Recharts
 *  expects for a multi-line chart: ``[{ date, partnerA, partnerB, ... }]``. */
function mergePartnerSeries(
  series: { partner_id: string | null; name: string; series: { date: string; value: string }[] }[],
): Array<Record<string, string | number>> {
  const byDate = new Map<string, Record<string, string | number>>()
  for (const s of series) {
    for (const point of s.series) {
      const slot = byDate.get(point.date) ?? { date: point.date }
      slot[s.name] = Number(point.value) || 0
      byDate.set(point.date, slot)
    }
  }
  return Array.from(byDate.values()).sort((a, b) =>
    String(a.date).localeCompare(String(b.date)),
  )
}
