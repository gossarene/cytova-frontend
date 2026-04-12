import type { ReactNode } from 'react'
import { Plus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/shared/EmptyState'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { Can } from '@/lib/permissions/Can'
import { P } from '@/lib/permissions/constants'

/**
 * Shared layout shell for the reference-data tabs inside the Catalog page.
 *
 * Each management tab (families, sub-families, tube types, techniques) has
 * the same structural needs: a small header with a title + description, an
 * optional filter slot, an Add button gated on ``P.CATALOG_MANAGE``, and a
 * loading / empty / table body. Centralising it here keeps every tab body
 * focused on its data-fetching + row rendering, and keeps UX wording and
 * permission gating consistent across the whole section.
 */

interface Props {
  title: string
  description: string
  addLabel: string
  onAdd: () => void
  /** Optional filter/sort controls rendered next to the Add button. */
  headerExtra?: ReactNode
  /**
   * Filter row rendered above the table, below the title/add-button row.
   * Used for search + status + any entity-specific filters. Kept separate
   * from ``headerExtra`` so multi-control filter rows don't cram the
   * header next to the Add button.
   */
  filters?: ReactNode
  columns: string[]
  children: ReactNode
  isLoading: boolean
  isEmpty: boolean
  emptyIcon: LucideIcon
  emptyLabel: string
  emptyHint: string
}

export function PanelShell({
  title, description, addLabel, onAdd, headerExtra, filters, columns, children,
  isLoading, isEmpty, emptyIcon, emptyLabel, emptyHint,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          {headerExtra}
          <Can permission={P.CATALOG_MANAGE}>
            <Button className="gap-2" onClick={onAdd}>
              <Plus className="h-4 w-4" />
              {addLabel}
            </Button>
          </Can>
        </div>
      </div>

      {filters && (
        <div className="flex flex-col gap-3 sm:flex-row">
          {filters}
        </div>
      )}

      {isLoading ? (
        <TableSkeleton rows={6} columns={columns.length} />
      ) : isEmpty ? (
        <EmptyState
          icon={emptyIcon}
          title={emptyLabel}
          description={emptyHint}
          action={{ label: addLabel, onClick: onAdd }}
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col, i) => (
                  <TableHead
                    key={i}
                    className={i === columns.length - 1 ? 'text-right' : ''}
                  >
                    {col}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>{children}</TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
