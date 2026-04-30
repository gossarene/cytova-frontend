import { useState } from 'react'
import { ArrowRight, Code2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  diff: Record<string, unknown> | null
}

/**
 * Business-friendly renderer for an ``AuditLog.diff`` payload.
 *
 * The backend stores diffs in a `{before: {...}, after: {...}}` shape
 * (UPDATE actions) or a single side (`{after: ...}` on CREATE,
 * `{before: ...}` on DELETE). This component flattens nested objects to
 * dotted keys, then renders a compact ``Field | Before | After`` table.
 *
 * Sensitive values are already masked server-side (passwords, tokens,
 * verification codes, etc. are replaced with "***" before the response
 * leaves Django) — the renderer just trusts what it receives.
 *
 * A "View raw JSON" toggle lets admins inspect the unflattened payload
 * for debugging without forcing it on everyone else.
 */
export function AuditDiff({ diff }: Props) {
  const [showRaw, setShowRaw] = useState(false)
  if (!diff || Object.keys(diff).length === 0) {
    return <p className="text-xs text-muted-foreground">No structured changes recorded.</p>
  }

  const before = isObject(diff['before']) ? (diff['before'] as Record<string, unknown>) : {}
  const after = isObject(diff['after']) ? (diff['after'] as Record<string, unknown>) : {}

  // Determine the canonical key set across before/after, then walk it.
  const beforeFlat = flatten(before)
  const afterFlat = flatten(after)
  const allKeys = new Set<string>([...Object.keys(beforeFlat), ...Object.keys(afterFlat)])

  // Some diffs carry top-level metadata next to before/after (e.g.
  // `reason`, `closure_from`). Surface those as plain key/value rows.
  const extras: [string, unknown][] = []
  for (const [k, v] of Object.entries(diff)) {
    if (k === 'before' || k === 'after') continue
    extras.push([k, v])
  }

  if (allKeys.size === 0 && extras.length === 0) {
    return <p className="text-xs text-muted-foreground">No structured changes recorded.</p>
  }

  return (
    <div className="space-y-3 p-3">
      {allKeys.size > 0 && (
        <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left">Field</th>
                <th className="px-3 py-2 text-left">Before</th>
                <th className="px-3 py-2 text-left">After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...allKeys].sort().map((key) => {
                const b = beforeFlat[key]
                const a = afterFlat[key]
                const changed = !isEqualPrimitive(b, a)
                return (
                  <tr key={key} className={cn(changed ? '' : 'opacity-60')}>
                    <td className="px-3 py-1.5 font-mono text-[11px] text-slate-600">{key}</td>
                    <td className="px-3 py-1.5">
                      <ValueChip value={b} variant="before" changed={changed} />
                    </td>
                    <td className="px-3 py-1.5">
                      <div className="flex items-center gap-1.5">
                        {changed && <ArrowRight className="h-3 w-3 text-slate-400" />}
                        <ValueChip value={a} variant="after" changed={changed} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {extras.length > 0 && (
        <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Context
          </p>
          <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-xs">
            {extras.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="font-mono text-[11px] text-slate-500">{k}</dt>
                <dd className="text-slate-900">{stringify(v)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowRaw((v) => !v)}
        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-900"
      >
        <Code2 className="h-3 w-3" />
        {showRaw ? 'Hide raw JSON' : 'View raw JSON'}
      </button>
      {showRaw && (
        <pre className="max-h-48 overflow-y-auto rounded-md bg-slate-900 p-3 font-mono text-[11px] leading-relaxed text-slate-100">
          {JSON.stringify(diff, null, 2)}
        </pre>
      )}
    </div>
  )
}


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Walk a nested object and return a flat ``{ "a.b.c": value }`` map.
 *  Lists, primitives, and null are kept as leaves so the table can show
 *  them whole — flattening into them would just confuse the reader. */
function flatten(input: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(input)) {
    const path = prefix ? `${prefix}.${k}` : k
    if (isObject(v)) Object.assign(out, flatten(v, path))
    else out[path] = v
  }
  return out
}

function isEqualPrimitive(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a == null && b == null) return true
  // For lists/objects, compare via JSON for stability — diffs are small.
  try {
    return JSON.stringify(a) === JSON.stringify(b)
  } catch {
    return false
  }
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/

/** Format a JSON-shaped value for display. ISO datetimes get a friendlier
 *  locale string; primitives stay literal; objects/arrays render compact. */
function stringify(v: unknown): string {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  if (typeof v === 'number') return String(v)
  if (typeof v === 'string') {
    if (v === '') return '(empty)'
    if (ISO_DATE.test(v)) {
      const d = new Date(v)
      if (!Number.isNaN(d.getTime())) return d.toLocaleString()
    }
    return v
  }
  try {
    return JSON.stringify(v)
  } catch {
    return String(v)
  }
}

interface ValueChipProps {
  value: unknown
  variant: 'before' | 'after'
  changed: boolean
}

function ValueChip({ value, variant, changed }: ValueChipProps) {
  const text = stringify(value)
  if (!changed) {
    return <span className="text-slate-700">{text}</span>
  }
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center rounded px-1.5 py-0.5 font-mono text-[11px] break-all',
        variant === 'before'
          ? 'bg-rose-50 text-rose-700 line-through decoration-rose-300'
          : 'bg-emerald-50 text-emerald-700',
      )}
    >
      {text}
    </span>
  )
}
