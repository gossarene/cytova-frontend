import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { cn } from '@/lib/utils'
import { PREMIUM_SURFACE_CLASSES, TONE_CLASSES } from './cockpit-helpers'
import type { DashboardCockpit } from '../types'

/**
 * Chart palettes.
 *
 * Single hue family (Cytova blue) for "neutral" chart segments. We only
 * step out into amber / emerald / rose where the status itself carries
 * a semantic meaning (warning / done / error). The result is restrained:
 * one chart should never feel like a rainbow.
 */
const CYTOVA_BLUE = '#2563eb'
const CHART_PALETTE = [CYTOVA_BLUE, '#60a5fa', '#93c5fd', '#1e40af']  // monochromatic blue ramp

const STATUS_COLOURS: Record<string, string> = {
  // Workflow statuses — blue family for "in progress", semantic for terminals.
  DRAFT:                  '#cbd5e1',  // slate-300
  CONFIRMED:              '#60a5fa',  // blue-400
  COLLECTION_IN_PROGRESS: '#3b82f6',  // blue-500
  IN_ANALYSIS:            CYTOVA_BLUE,
  AWAITING_REVIEW:        '#f59e0b',  // amber — needs attention
  RETEST_REQUIRED:        '#ef4444',  // rose — error
  READY_FOR_RELEASE:      '#10b981',  // emerald — done-ish
  VALIDATED:              '#10b981',
  COMPLETED:              '#16a34a',
  CANCELLED:              '#94a3b8',  // slate-400 — terminal but not an error
  IN_PROGRESS:            CYTOVA_BLUE,
  // Result statuses
  SUBMITTED:              '#f59e0b',
  PUBLISHED:              '#16a34a',
  REJECTED:               '#ef4444',
}

const SOURCE_LABELS: Record<string, string> = {
  DIRECT_PATIENT: 'Direct',
  PARTNER_ORGANIZATION: 'Partner',
}

/* Axis + grid styling shared across all chart variants. */
const AXIS_TICK = { fontSize: 11, fill: '#64748b' }
const GRID_STROKE = '#eef2f7'  // softer than slate-200 — nearly imperceptible
const AXIS_LINE = { stroke: '#e2e8f0' }

/* Premium tooltip — white card, hairline border, soft shadow, rounded.
 * We pass a content render function to Recharts so the tooltip matches
 * the rest of the design system (instead of Recharts' default white box). */
function PremiumTooltip({ active, payload, label, labelFormatter }: any) {
  if (!active || !payload?.length) return null
  const formattedLabel = labelFormatter ? labelFormatter(label) : label
  return (
    <div className="rounded-lg border border-black/5 bg-white/95 px-3 py-2 text-xs shadow-[0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-sm">
      {formattedLabel !== undefined && formattedLabel !== '' && (
        <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-slate-500">
          {formattedLabel}
        </div>
      )}
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 tabular-nums">
          <span
            aria-hidden
            className="h-2 w-2 rounded-full"
            style={{ background: entry.color || entry.payload?.fill || CYTOVA_BLUE }}
          />
          <span className="font-medium text-slate-900">
            {entry.name}{entry.name ? ': ' : ''}{entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

/**
 * Generic chart card wrapper.
 *
 * Layout:
 *   - 3px gradient stripe along the top edge (shared "primary" tone so
 *     the analytics row reads as one block, distinct from per-tone KPIs)
 *   - Header (padded) with title + subtitle, separated by a hairline border
 *   - Optional filter pill on the right ("Last 14 days") — visual only
 *   - Body (padded) with the chart, or a calm empty state
 *
 * Same premium substrate as the KPI / action cards so the analytics row
 * reads as a continuation of the rest of the dashboard.
 */
function ChartCard({
  title, subtitle, filter, isEmpty, children,
}: {
  title: string
  subtitle?: string
  filter?: string
  isEmpty: boolean
  children: React.ReactNode
}) {
  return (
    <div className={cn(PREMIUM_SURFACE_CLASSES, 'relative flex flex-col overflow-hidden')}>
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-[3px]',
          TONE_CLASSES.primary.accentLine,
        )}
      />
      <div className="flex items-start justify-between gap-3 border-b border-black/5 px-6 pt-5 pb-4">
        <div className="min-w-0">
          <h3 className="text-base font-semibold tracking-tight">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {filter && (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
            {filter}
          </span>
        )}
      </div>
      <div className="px-6 pt-4 pb-6">
        {isEmpty ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            No data in this period.
          </div>
        ) : (
          <div className="h-52">{children}</div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Per-chart wrappers — narrow APIs so the page just hands raw series.
// All charts use the shared PremiumTooltip and the soft grid styling above.
// ---------------------------------------------------------------------------

export function RequestsOverTimeChart({
  data,
}: { data: DashboardCockpit['charts']['requests_over_time'] }) {
  const isEmpty = data.every((d) => d.count === 0)
  return (
    <ChartCard
      title="Requests over time"
      subtitle="Daily inbound volume"
      filter="Last 14 days"
      isEmpty={isEmpty}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="reqArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor={CYTOVA_BLUE} stopOpacity={0.30} />
              <stop offset="60%" stopColor={CYTOVA_BLUE} stopOpacity={0.08} />
              <stop offset="100%" stopColor={CYTOVA_BLUE} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis
            dataKey="date"
            tick={AXIS_TICK}
            tickFormatter={(v) => v.slice(5)}  /* MM-DD */
            tickLine={false} axisLine={AXIS_LINE}
          />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false} axisLine={false} width={32}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ stroke: CYTOVA_BLUE, strokeWidth: 1, strokeDasharray: '3 3' }}
            content={<PremiumTooltip labelFormatter={(v: string) => new Date(v).toLocaleDateString()} />}
          />
          <Area
            type="monotone"
            dataKey="count"
            name="Requests"
            stroke={CYTOVA_BLUE} strokeWidth={2.25}
            fill="url(#reqArea)"
            activeDot={{ r: 5, strokeWidth: 2, stroke: '#ffffff', fill: CYTOVA_BLUE }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function RequestsByStatusChart({
  data,
}: { data: DashboardCockpit['charts']['requests_by_status'] }) {
  const isEmpty = data.length === 0 || data.every((d) => d.count === 0)
  return (
    <ChartCard
      title="Requests by workflow status"
      subtitle="Live distribution across the pipeline"
      isEmpty={isEmpty}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 28 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis
            dataKey="status"
            tick={{ fontSize: 10, fill: '#64748b' }}
            tickLine={false} axisLine={AXIS_LINE}
            interval={0} angle={-25} textAnchor="end"
          />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false} axisLine={false} width={32}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(37, 99, 235, 0.05)' }}
            content={<PremiumTooltip />}
          />
          <Bar dataKey="count" name="Requests" radius={[6, 6, 0, 0]} maxBarSize={42}>
            {data.map((row) => (
              <Cell key={row.status} fill={STATUS_COLOURS[row.status] ?? CYTOVA_BLUE} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function RequestsBySourceChart({
  data,
}: { data: DashboardCockpit['charts']['requests_by_source'] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0)
  const display = data.map((d) => ({ name: SOURCE_LABELS[d.source] ?? d.source, value: d.count }))
  return (
    <ChartCard
      title="Requests by source"
      subtitle={total > 0 ? `${total} total this month` : undefined}
      isEmpty={total === 0}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={display}
            dataKey="value"
            nameKey="name"
            innerRadius={48}
            outerRadius={78}
            paddingAngle={3}
            stroke="#ffffff"
            strokeWidth={2}
          >
            {display.map((_, i) => (
              <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip content={<PremiumTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function ResultsPipelineChart({
  data,
}: { data: DashboardCockpit['charts']['results_pipeline'] }) {
  const isEmpty = data.length === 0 || data.every((d) => d.count === 0)
  return (
    <ChartCard
      title="Results pipeline"
      subtitle="Throughput by stage"
      isEmpty={isEmpty}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
          <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <YAxis
            type="category" dataKey="status" width={92}
            tick={AXIS_TICK}
            tickLine={false} axisLine={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(37, 99, 235, 0.05)' }}
            content={<PremiumTooltip />}
          />
          <Bar dataKey="count" name="Results" radius={[0, 6, 6, 0]} maxBarSize={20}>
            {data.map((row) => (
              <Cell key={row.status} fill={STATUS_COLOURS[row.status] ?? CYTOVA_BLUE} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
