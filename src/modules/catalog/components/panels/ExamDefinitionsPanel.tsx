import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FlaskConical, UtensilsCrossed, Pencil } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { SearchInput } from '@/components/shared/SearchInput'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { Can } from '@/lib/permissions/Can'
import { usePermission } from '@/lib/permissions/hooks'
import { P } from '@/lib/permissions/constants'
import { FamilySidebar } from '../FamilySidebar'
import { FamilyDialog } from '../FamilyDialog'
import { ExamDefinitionDialog } from '../ExamDefinitionDialog'
import { useFamilies, useExamDefinitions, useSampleTypes } from '../../api'
import { formatCurrency } from '@/lib/utils/currency'

/**
 * Exam Definitions tab — the primary Catalog view: browse and search the
 * lab's exam definitions, filter by family (via the sidebar) or sample type,
 * and create new families / exams.
 *
 * This used to be the entire CatalogPage; it has been extracted into a
 * self-contained panel so it can live next to the reference-data tabs
 * under the unified /catalog page.
 */
export function ExamDefinitionsPanel() {
  const navigate = useNavigate()
  const canManage = usePermission(P.CATALOG_MANAGE)

  const [selectedFamily, setSelectedFamily] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sampleFilter, setSampleFilter] = useState<string>('all')
  const [showFamilyDialog, setShowFamilyDialog] = useState(false)
  const [showExamDialog, setShowExamDialog] = useState(false)
  // ``editingExamId`` drives whether the exam dialog is in create mode
  // (null) or edit mode (the target exam id). Kept alongside
  // ``showExamDialog`` so opening the "+ Exam" header button always lands
  // in create mode regardless of a prior edit session.
  const [editingExamId, setEditingExamId] = useState<string | null>(null)

  const { data: famData, isLoading: famLoading } = useFamilies({ is_active: 'true' })
  const families = famData?.data ?? []

  const { data: sampleTypes = [] } = useSampleTypes()

  const examParams: Record<string, string> = {}
  if (selectedFamily) examParams.family_id = selectedFamily
  if (search) examParams.search = search
  if (sampleFilter !== 'all') examParams.sample_type = sampleFilter

  const { data: examData, isLoading: examLoading, error, refetch } = useExamDefinitions(examParams)
  const exams = examData?.data ?? []

  const sampleLabel = sampleFilter === 'all'
    ? 'All'
    : sampleTypes.find((o) => o.value === sampleFilter)?.label ?? sampleFilter

  if (error) return <ErrorState onRetry={refetch} />

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Exam definitions</h2>
          <p className="text-sm text-muted-foreground">
            Browse, search and create the lab&apos;s exam definitions.
          </p>
        </div>
        <Can permission={P.CATALOG_MANAGE}>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setShowFamilyDialog(true)}>
              <Plus className="h-4 w-4" />
              Family
            </Button>
            <Button
              className="gap-2"
              onClick={() => { setEditingExamId(null); setShowExamDialog(true) }}
            >
              <Plus className="h-4 w-4" />
              Exam
            </Button>
          </div>
        </Can>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <FamilySidebar
          families={families}
          isLoading={famLoading}
          selectedId={selectedFamily}
          onSelect={setSelectedFamily}
          onCreateClick={() => setShowFamilyDialog(true)}
        />

        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchInput
              placeholder="Search by name or code..."
              value={search}
              onChange={setSearch}
            />
            <Select value={sampleFilter} onValueChange={(v) => setSampleFilter(v ?? 'all')}>
              <SelectTrigger className="sm:w-48">
                <span className="text-sm">
                  <span className="text-muted-foreground">Sample:</span> {sampleLabel}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {sampleTypes.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {examLoading ? (
            <TableSkeleton rows={8} columns={8} />
          ) : exams.length === 0 ? (
            <EmptyState
              icon={FlaskConical}
              title="No exams found"
              description={search || selectedFamily ? 'Try adjusting your search or family filter.' : 'Add your first exam definition.'}
              action={
                !search && canManage
                  ? {
                      label: 'Add Exam',
                      onClick: () => { setEditingExamId(null); setShowExamDialog(true) },
                    }
                  : undefined
              }
            />
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Family</TableHead>
                    <TableHead>Sample</TableHead>
                    <TableHead className="w-8" />
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12 text-right" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams.map((exam) => (
                    <TableRow
                      key={exam.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/catalog/exams/${exam.id}`)}
                    >
                      <TableCell className="font-mono text-sm font-medium">{exam.code}</TableCell>
                      <TableCell className="font-medium">{exam.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {exam.family_name ?? exam.category_name ?? '\u2014'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{exam.sample_type}</Badge>
                      </TableCell>
                      <TableCell>
                        {exam.fasting_required && (
                          <UtensilsCrossed className="h-3.5 w-3.5 text-amber-500" />
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCurrency(exam.unit_price)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1.5">
                          {!exam.is_active && (
                            <Badge variant="outline" className="border-red-200 bg-red-50 text-red-600 text-xs">Inactive</Badge>
                          )}
                          {!exam.is_enabled && exam.is_active && (
                            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-600 text-xs">Disabled</Badge>
                          )}
                          {exam.is_active && exam.is_enabled && (
                            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-xs">Active</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Can permission={P.CATALOG_MANAGE}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            aria-label={`Edit ${exam.code}`}
                            onClick={(e) => {
                              // Row click navigates to detail; stop the
                              // propagation so clicking Edit opens the
                              // dialog instead of the detail page.
                              e.stopPropagation()
                              setEditingExamId(exam.id)
                              setShowExamDialog(true)
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </Can>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <FamilyDialog open={showFamilyDialog} onOpenChange={setShowFamilyDialog} />
      {/*
        The ``key`` prop forces React to remount the dialog whenever the
        target exam changes. Each edit session therefore gets a fresh
        useForm instance and a fresh one-shot hydration guard — no state
        leaks between consecutive edits or between edit → create.
      */}
      <ExamDefinitionDialog
        key={editingExamId ?? 'new'}
        open={showExamDialog}
        onOpenChange={(next) => {
          setShowExamDialog(next)
          if (!next) setEditingExamId(null)
        }}
        families={families}
        preselectedFamilyId={editingExamId ? null : selectedFamily}
        editExamId={editingExamId}
      />
    </div>
  )
}
