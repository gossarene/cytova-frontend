import type { ReactNode } from 'react'
import { SearchInput } from '@/components/shared/SearchInput'
import {
  Select, SelectContent, SelectItem, SelectTrigger,
} from '@/components/ui/select'
import type { StatusFilter } from './filterUtils'

/**
 * Search + status filter block shared by every reference-management panel
 * (Families, Sub-families, Tube Types, Techniques). Visual layout is
 * deliberately a byte-for-byte mirror of the Exam Definitions filter bar:
 *
 *   - plain ``<SearchInput>`` with a descriptive placeholder (no external
 *     label); the embedded magnifier icon gives immediate affordance
 *   - ``<SelectTrigger className="sm:w-48">`` with an inline
 *     ``"<Prefix>: <value>"`` span — muted prefix + current label
 *   - parent flex row: ``flex flex-col gap-3 sm:flex-row`` (no
 *     items-alignment override), applied by PanelShell's filters slot
 *
 * Kept stateless — the parent panel owns the two pieces of state so each
 * hook's React Query cache key is scoped correctly.
 */

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: 'All',
  active: 'Active',
  inactive: 'Inactive',
}

interface Props {
  search: string
  onSearchChange: (value: string) => void
  status: StatusFilter
  onStatusChange: (value: StatusFilter) => void
  searchPlaceholder?: string
  /** Entity-specific extra filter(s) rendered after the status select. */
  extra?: ReactNode
}

export function ReferenceFilters({
  search, onSearchChange, status, onStatusChange,
  searchPlaceholder = 'Search by name...', extra,
}: Props) {
  return (
    <>
      <SearchInput
        placeholder={searchPlaceholder}
        value={search}
        onChange={onSearchChange}
      />
      <Select
        value={status}
        onValueChange={(v) => onStatusChange(((v ?? 'all') as StatusFilter))}
      >
        <SelectTrigger className="sm:w-48">
          <span className="text-sm">
            <span className="text-muted-foreground">Status:</span> {STATUS_LABELS[status]}
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>
      {extra}
    </>
  )
}
