import { Badge } from '@/components/ui/badge'
import type { PatientSharedResultRow } from './api'

/**
 * Friendly status badges for a patient-facing shared result row.
 *
 * Rules:
 *   - "Available" — base label for any visible (ACTIVE) row.
 *   - "New" — never downloaded AND created in the recent window
 *     (server decides via ``is_new``).
 *   - "Downloaded" — at least one successful download in the past.
 *
 * Both "New" and "Downloaded" are mutually exclusive by construction
 * (a downloaded row can't be ``is_new``), but we render whichever is
 * appropriate without coupling the rules to either page.
 */
export function ResultStatusBadges({ row }: { row: PatientSharedResultRow }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
        {row.status_label || 'Available'}
      </Badge>
      {row.is_new && (
        <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
          New
        </Badge>
      )}
      {!row.is_new && row.download_count > 0 && (
        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
          Downloaded
        </Badge>
      )}
    </div>
  )
}
