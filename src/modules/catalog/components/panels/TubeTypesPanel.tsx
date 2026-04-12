import { useState } from 'react'
import { toast } from 'sonner'
import { Ban, Pencil, RotateCcw, TestTube } from 'lucide-react'
import { TableCell, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/shared/ErrorState'
import { Can } from '@/lib/permissions/Can'
import { P } from '@/lib/permissions/constants'
import {
  useTubeTypes, useCreateTubeType, useUpdateTubeType,
  useDeactivateTubeType, useReactivateTubeType,
} from '../../api'
import { SimpleRefDialog, type SimpleRefRecord } from '../SimpleRefDialog'
import type { TubeTypeItem } from '../../types'
import { PanelShell } from './PanelShell'
import { ReferenceFilters } from './ReferenceFilters'
import { statusToParam, type StatusFilter } from './filterUtils'

export function TubeTypesPanel() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')

  const params: { is_active?: string; search?: string } = {}
  const isActive = statusToParam(status)
  if (isActive !== undefined) params.is_active = isActive
  if (search) params.search = search

  const { data: tubes = [], isLoading, error, refetch } = useTubeTypes(params)
  const createMut = useCreateTubeType()
  const [editing, setEditing] = useState<TubeTypeItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  if (error) return <ErrorState onRetry={refetch} />

  return (
    <>
      <PanelShell
        title="Tube types"
        description="Specimen collection tubes referenced by exam definitions."
        onAdd={() => { setEditing(null); setDialogOpen(true) }}
        addLabel="Add tube type"
        filters={
          <ReferenceFilters
            search={search}
            onSearchChange={setSearch}
            status={status}
            onStatusChange={setStatus}
            searchPlaceholder="Search tube types by name..."
          />
        }
        isLoading={isLoading}
        isEmpty={!isLoading && tubes.length === 0}
        emptyIcon={TestTube}
        emptyLabel={search || status !== 'all' ? 'No matching tube types' : 'No tube types'}
        emptyHint={
          search || status !== 'all'
            ? 'Try adjusting the search or status filter.'
            : 'Add EDTA, Citrate, Heparin, etc.'
        }
        columns={['Name', 'Description', 'Status', '']}
      >
        {tubes.map((t) => (
          <TubeTypeRow
            key={t.id}
            tube={t}
            onEdit={() => { setEditing(t); setDialogOpen(true) }}
          />
        ))}
      </PanelShell>

      {/* Sibling, not child — see FamiliesPanel for the rationale. */}
      <TubeTypeDialogBridge
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onCreate={async (payload) => { await createMut.mutateAsync(payload) }}
        isPending={createMut.isPending}
      />
    </>
  )
}

function TubeTypeRow({ tube, onEdit }: { tube: TubeTypeItem; onEdit: () => void }) {
  const deactivate = useDeactivateTubeType(tube.id)
  const reactivate = useReactivateTubeType(tube.id)

  async function handleDeactivate() {
    try {
      await deactivate.mutateAsync()
      toast.success('Tube type deactivated.')
    } catch {
      toast.error('Failed to deactivate tube type.')
    }
  }

  async function handleReactivate() {
    try {
      await reactivate.mutateAsync()
      toast.success('Tube type reactivated.')
    } catch {
      toast.error('Failed to reactivate tube type.')
    }
  }

  return (
    <TableRow className={tube.is_active ? '' : 'bg-muted/30'}>
      <TableCell className="font-medium">{tube.name}</TableCell>
      <TableCell className="text-sm text-muted-foreground max-w-md truncate">
        {tube.description || '\u2014'}
      </TableCell>
      <TableCell>
        {tube.is_active ? (
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-xs">Active</Badge>
        ) : (
          <Badge variant="outline" className="border-red-200 bg-red-50 text-red-600 text-xs">Inactive</Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <Can permission={P.CATALOG_MANAGE}>
          <div className="flex justify-end gap-1">
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onEdit} aria-label="Edit tube type">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            {tube.is_active ? (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-red-600 hover:text-red-600"
                onClick={handleDeactivate}
                disabled={deactivate.isPending}
                aria-label="Deactivate tube type"
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
                aria-label="Reactivate tube type"
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

/**
 * Bridges SimpleRefDialog to the per-row update mutation. The parent panel
 * owns the create hook; the update hook is scoped to the currently-editing
 * record so its id lands in the PATCH URL.
 */
function TubeTypeDialogBridge({
  open, onOpenChange, editing, onCreate, isPending,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editing: TubeTypeItem | null
  onCreate: (p: { name: string; description: string }) => Promise<void>
  isPending: boolean
}) {
  const updateMut = useUpdateTubeType(editing?.id ?? '')
  const editRecord: SimpleRefRecord | null = editing
    ? { id: editing.id, name: editing.name, description: editing.description }
    : null
  return (
    <SimpleRefDialog
      open={open}
      onOpenChange={onOpenChange}
      entityLabel="Tube type"
      editRecord={editRecord}
      onCreate={onCreate}
      onUpdate={async (_id, payload) => { await updateMut.mutateAsync(payload) }}
      isPending={isPending || updateMut.isPending}
    />
  )
}
