import { useState } from 'react'
import { toast } from 'sonner'
import { Ban, Pencil, RotateCcw, FlaskConical } from 'lucide-react'
import { TableCell, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/shared/ErrorState'
import { Can } from '@/lib/permissions/Can'
import { P } from '@/lib/permissions/constants'
import {
  useTechniques, useCreateTechnique, useUpdateTechnique,
  useDeactivateTechnique, useReactivateTechnique,
} from '../../api'
import { SimpleRefDialog, type SimpleRefRecord } from '../SimpleRefDialog'
import type { ExamTechniqueItem } from '../../types'
import { PanelShell } from './PanelShell'
import { ReferenceFilters } from './ReferenceFilters'
import { statusToParam, type StatusFilter } from './filterUtils'

export function TechniquesPanel() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')

  const params: { is_active?: string; search?: string } = {}
  const isActive = statusToParam(status)
  if (isActive !== undefined) params.is_active = isActive
  if (search) params.search = search

  const { data: techs = [], isLoading, error, refetch } = useTechniques(params)
  const createMut = useCreateTechnique()
  const [editing, setEditing] = useState<ExamTechniqueItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  if (error) return <ErrorState onRetry={refetch} />

  return (
    <>
      <PanelShell
        title="Techniques"
        description="Laboratory techniques that exam definitions can reference."
        onAdd={() => { setEditing(null); setDialogOpen(true) }}
        addLabel="Add technique"
        filters={
          <ReferenceFilters
            search={search}
            onSearchChange={setSearch}
            status={status}
            onStatusChange={setStatus}
            searchPlaceholder="Search techniques by name..."
          />
        }
        isLoading={isLoading}
        isEmpty={!isLoading && techs.length === 0}
        emptyIcon={FlaskConical}
        emptyLabel={search || status !== 'all' ? 'No matching techniques' : 'No techniques'}
        emptyHint={
          search || status !== 'all'
            ? 'Try adjusting the search or status filter.'
            : 'Add PCR, ELISA, Spectrophotometry, etc.'
        }
        columns={['Name', 'Description', 'Status', '']}
      >
        {techs.map((t) => (
          <TechniqueRow
            key={t.id}
            technique={t}
            onEdit={() => { setEditing(t); setDialogOpen(true) }}
          />
        ))}
      </PanelShell>

      {/* Sibling, not child — see FamiliesPanel for the rationale. */}
      <TechniqueDialogBridge
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onCreate={async (payload) => { await createMut.mutateAsync(payload) }}
        isPending={createMut.isPending}
      />
    </>
  )
}

function TechniqueRow({
  technique, onEdit,
}: {
  technique: ExamTechniqueItem
  onEdit: () => void
}) {
  const deactivate = useDeactivateTechnique(technique.id)
  const reactivate = useReactivateTechnique(technique.id)

  async function handleDeactivate() {
    try {
      await deactivate.mutateAsync()
      toast.success('Technique deactivated.')
    } catch {
      toast.error('Failed to deactivate technique.')
    }
  }

  async function handleReactivate() {
    try {
      await reactivate.mutateAsync()
      toast.success('Technique reactivated.')
    } catch {
      toast.error('Failed to reactivate technique.')
    }
  }

  return (
    <TableRow className={technique.is_active ? '' : 'bg-muted/30'}>
      <TableCell className="font-medium">{technique.name}</TableCell>
      <TableCell className="text-sm text-muted-foreground max-w-md truncate">
        {technique.description || '\u2014'}
      </TableCell>
      <TableCell>
        {technique.is_active ? (
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-xs">Active</Badge>
        ) : (
          <Badge variant="outline" className="border-red-200 bg-red-50 text-red-600 text-xs">Inactive</Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <Can permission={P.CATALOG_MANAGE}>
          <div className="flex justify-end gap-1">
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onEdit} aria-label="Edit technique">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            {technique.is_active ? (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-red-600 hover:text-red-600"
                onClick={handleDeactivate}
                disabled={deactivate.isPending}
                aria-label="Deactivate technique"
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
                aria-label="Reactivate technique"
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

function TechniqueDialogBridge({
  open, onOpenChange, editing, onCreate, isPending,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editing: ExamTechniqueItem | null
  onCreate: (p: { name: string; description: string }) => Promise<void>
  isPending: boolean
}) {
  const updateMut = useUpdateTechnique(editing?.id ?? '')
  const editRecord: SimpleRefRecord | null = editing
    ? { id: editing.id, name: editing.name, description: editing.description }
    : null
  return (
    <SimpleRefDialog
      open={open}
      onOpenChange={onOpenChange}
      entityLabel="Technique"
      editRecord={editRecord}
      onCreate={onCreate}
      onUpdate={async (_id, payload) => { await updateMut.mutateAsync(payload) }}
      isPending={isPending || updateMut.isPending}
    />
  )
}
