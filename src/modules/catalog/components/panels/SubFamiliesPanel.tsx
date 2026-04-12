import { useState } from 'react'
import { toast } from 'sonner'
import { Ban, Pencil, RotateCcw, Network } from 'lucide-react'
import { TableCell, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { ErrorState } from '@/components/shared/ErrorState'
import { Can } from '@/lib/permissions/Can'
import { P } from '@/lib/permissions/constants'
import {
  useFamilies, useSubFamiliesList,
  useDeactivateSubFamily, useReactivateSubFamily,
} from '../../api'
import { SubFamilyDialog } from '../SubFamilyDialog'
import type { ExamSubFamilyItem } from '../../types'
import { PanelShell } from './PanelShell'
import { ReferenceFilters } from './ReferenceFilters'
import { statusToParam, type StatusFilter } from './filterUtils'

export function SubFamiliesPanel() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [familyFilter, setFamilyFilter] = useState<string>('all')

  const { data: famData } = useFamilies({ is_active: 'true' })
  const families = famData?.data ?? []

  // Management list uses the dedicated params hook so ``useSubFamilies``
  // (consumed by the Exam Definition cascading dropdown with its safe
  // activeOnly default) stays untouched.
  const listParams: { family_id?: string; is_active?: string; search?: string } = {}
  if (familyFilter !== 'all') listParams.family_id = familyFilter
  const isActive = statusToParam(status)
  if (isActive !== undefined) listParams.is_active = isActive
  if (search) listParams.search = search

  const { data: subs = [], isLoading, error, refetch } = useSubFamiliesList(listParams)

  const [editing, setEditing] = useState<ExamSubFamilyItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  if (error) return <ErrorState onRetry={refetch} />

  const hasActiveFilter = !!search || status !== 'all' || familyFilter !== 'all'

  // Inline label shown in the Select trigger, mirroring the Exam Definitions
  // pattern: "<Prefix>: <current value>".
  const familyLabel = familyFilter === 'all'
    ? 'All'
    : families.find((f) => f.id === familyFilter)?.name ?? 'All'

  return (
    <>
      <PanelShell
        title="Sub-families"
        description="Optional secondary classification scoped to a parent family."
        filters={
          <ReferenceFilters
            search={search}
            onSearchChange={setSearch}
            status={status}
            onStatusChange={setStatus}
            searchPlaceholder="Search sub-families by name..."
            extra={
              <Select
                value={familyFilter}
                onValueChange={(v) => setFamilyFilter(v ?? 'all')}
              >
                <SelectTrigger className="sm:w-56">
                  <span className="text-sm">
                    <span className="text-muted-foreground">Family:</span> {familyLabel}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {families.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
          />
        }
        onAdd={() => { setEditing(null); setDialogOpen(true) }}
        addLabel="Add sub-family"
        isLoading={isLoading}
        isEmpty={!isLoading && subs.length === 0}
        emptyIcon={Network}
        emptyLabel={hasActiveFilter ? 'No matching sub-families' : 'No sub-families'}
        emptyHint={
          hasActiveFilter
            ? 'Try adjusting the search, status, or family filter.'
            : 'No sub-families yet — create one scoped to a family.'
        }
        columns={['Family', 'Name', 'Status', '']}
      >
        {subs.map((sf) => (
          <SubFamilyRow
            key={sf.id}
            subFamily={sf}
            onEdit={() => { setEditing(sf); setDialogOpen(true) }}
          />
        ))}
      </PanelShell>

      {/* Sibling, not child — see FamiliesPanel for the rationale. */}
      <SubFamilyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        families={families}
        editSubFamily={editing}
      />
    </>
  )
}

function SubFamilyRow({
  subFamily, onEdit,
}: {
  subFamily: ExamSubFamilyItem
  onEdit: () => void
}) {
  const deactivate = useDeactivateSubFamily(subFamily.id)
  const reactivate = useReactivateSubFamily(subFamily.id)

  async function handleDeactivate() {
    try {
      await deactivate.mutateAsync()
      toast.success('Sub-family deactivated.')
    } catch {
      toast.error('Failed to deactivate sub-family.')
    }
  }

  async function handleReactivate() {
    try {
      await reactivate.mutateAsync()
      toast.success('Sub-family reactivated.')
    } catch {
      // The backend rejects reactivation when the parent family is inactive.
      // Surface that constraint in the toast so the admin has an actionable
      // path ("reactivate the parent first") instead of a generic error.
      toast.error(
        'Failed to reactivate sub-family. '
        + 'If the parent family is inactive, reactivate it first.',
      )
    }
  }

  return (
    <TableRow className={subFamily.is_active ? '' : 'bg-muted/30'}>
      <TableCell className="text-sm text-muted-foreground">
        {subFamily.family_name ?? '\u2014'}
      </TableCell>
      <TableCell className="font-medium">{subFamily.name}</TableCell>
      <TableCell>
        {subFamily.is_active ? (
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-xs">Active</Badge>
        ) : (
          <Badge variant="outline" className="border-red-200 bg-red-50 text-red-600 text-xs">Inactive</Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <Can permission={P.CATALOG_MANAGE}>
          <div className="flex justify-end gap-1">
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onEdit} aria-label="Edit sub-family">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            {subFamily.is_active ? (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-red-600 hover:text-red-600"
                onClick={handleDeactivate}
                disabled={deactivate.isPending}
                aria-label="Deactivate sub-family"
              >
                <Ban className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-600"
                onClick={handleReactivate}
                disabled={reactivate.isPending}
                aria-label="Reactivate sub-family"
                title="Reactivate"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </Can>
      </TableCell>
    </TableRow>
  )
}
