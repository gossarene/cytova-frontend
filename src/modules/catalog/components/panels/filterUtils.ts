/**
 * Non-component utilities for the reference-management filter row.
 * Lives in its own file so ``ReferenceFilters.tsx`` only exports React
 * components (required by ``react-refresh/only-export-components``).
 */

export type StatusFilter = 'all' | 'active' | 'inactive'

/**
 * Translate the UI status tri-state into the backend ``is_active`` query
 * parameter. ``'all'`` sends no param at all so the server returns both
 * active and inactive rows.
 */
export function statusToParam(status: StatusFilter): string | undefined {
  if (status === 'all') return undefined
  return status === 'active' ? 'true' : 'false'
}
