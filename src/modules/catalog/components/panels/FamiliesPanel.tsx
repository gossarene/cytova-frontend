import { useState } from 'react'
import { toast } from 'sonner'
import { Ban, Pencil, RotateCcw, Layers } from 'lucide-react'
import { TableCell, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/shared/ErrorState'
import { Can } from '@/lib/permissions/Can'
import { P } from '@/lib/permissions/constants'
import { useFamilies, useDeactivateFamily, useReactivateFamily } from '../../api'
import { FamilyDialog } from '../FamilyDialog'
import type { ExamFamilyItem } from '../../types'
import { PanelShell } from './PanelShell'
import { ReferenceFilters } from './ReferenceFilters'
import { statusToParam, type StatusFilter } from './filterUtils'

export function FamiliesPanel() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')

  const params: { is_active?: string; search?: string } = {}
  const isActive = statusToParam(status)
  if (isActive !== undefined) params.is_active = isActive
  if (search) params.search = search

  const { data, isLoading, error, refetch } = useFamilies(params)
  const [editing, setEditing] = useState<ExamFamilyItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  if (error) return <ErrorState onRetry={refetch} />

  const families = data?.data ?? []

  return (
    <>
      <PanelShell
        title="Families"
        description="Top-level classification used to group exam definitions."
        onAdd={() => { setEditing(null); setDialogOpen(true) }}
        addLabel="Add family"
        filters={
          <ReferenceFilters
            search={search}
            onSearchChange={setSearch}
            status={status}
            onStatusChange={setStatus}
            searchPlaceholder="Search families by name..."
          />
        }
        isLoading={isLoading}
        isEmpty={!isLoading && families.length === 0}
        emptyIcon={Layers}
        emptyLabel={search || status !== 'all' ? 'No matching families' : 'No families yet'}
        emptyHint={
          search || status !== 'all'
            ? 'Try adjusting the search or status filter.'
            : 'Create your first exam family to start organising the catalog.'
        }
        columns={['Name', 'Description', 'Order', 'Status', '']}
      >
        {families.map((fam) => (
          <FamilyRow
            key={fam.id}
            family={fam}
            onEdit={() => { setEditing(fam); setDialogOpen(true) }}
          />
        ))}
      </PanelShell>

      {/* Dialog is a sibling of PanelShell, not a child — PanelShell only
          renders its children inside <TableBody> on the populated branch,
          so nesting the dialog inside would leave it unmounted on the
          empty/loading branches (which is the state of a fresh install). */}
      <FamilyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editFamily={editing}
      />
    </>
  )
}

function FamilyRow({ family, onEdit }: { family: ExamFamilyItem; onEdit: () => void }) {
  const deactivate = useDeactivateFamily(family.id)
  const reactivate = useReactivateFamily(family.id)

  async function handleDeactivate() {
    try {
      await deactivate.mutateAsync()
      toast.success('Family deactivated.')
    } catch {
      toast.error('Failed to deactivate family.')
    }
  }

  async function handleReactivate() {
    try {
      await reactivate.mutateAsync()
      toast.success('Family reactivated.')
    } catch {
      toast.error('Failed to reactivate family.')
    }
  }

  return (
    <TableRow className={family.is_active ? '' : 'bg-muted/30'}>
      <TableCell className="font-medium">{family.name}</TableCell>
      <TableCell className="text-sm text-muted-foreground max-w-md truncate">
        {family.description || '\u2014'}
      </TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground">{family.display_order}</TableCell>
      <TableCell>
        {family.is_active ? (
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-xs">Active</Badge>
        ) : (
          <Badge variant="outline" className="border-red-200 bg-red-50 text-red-600 text-xs">Inactive</Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <Can permission={P.CATALOG_MANAGE}>
          <div className="flex justify-end gap-1">
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onEdit} aria-label="Edit family">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            {family.is_active ? (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-red-600 hover:text-red-600"
                onClick={handleDeactivate}
                disabled={deactivate.isPending}
                aria-label="Deactivate family"
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
                aria-label="Reactivate family"
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
