import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FlaskConical } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/shared/PageHeader'
import { SearchInput } from '@/components/shared/SearchInput'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { Can } from '@/lib/permissions/Can'
import { usePermission } from '@/lib/permissions/hooks'
import { P } from '@/lib/permissions/constants'
import { CategorySidebar } from '../components/CategorySidebar'
import { CategoryDialog } from '../components/CategoryDialog'
import { ExamDefinitionDialog } from '../components/ExamDefinitionDialog'
import { useCategories, useExamDefinitions } from '../api'
import { SAMPLE_TYPE_OPTIONS } from '../types'
import { formatCurrency } from '@/lib/utils/currency'

export function CatalogPage() {
  const navigate = useNavigate()
  const canManage = usePermission(P.CATALOG_MANAGE)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sampleFilter, setSampleFilter] = useState<string>('all')
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [showExamDialog, setShowExamDialog] = useState(false)

  const { data: catData, isLoading: catLoading } = useCategories({ is_active: 'true' })
  const categories = catData?.data ?? []

  const examParams: Record<string, string> = {}
  if (selectedCategory) examParams.category_id = selectedCategory
  if (search) examParams.search = search
  if (sampleFilter !== 'all') examParams.sample_type = sampleFilter

  const { data: examData, isLoading: examLoading, error, refetch } = useExamDefinitions(examParams)
  const exams = examData?.data ?? []

  if (error) return <ErrorState onRetry={refetch} />

  return (
    <div className="space-y-6">
      <PageHeader title="Exam Catalog" description="Categories, definitions, and pricing">
        <Can permission={P.CATALOG_MANAGE}>
          <Button variant="outline" className="gap-2" onClick={() => setShowCategoryDialog(true)}>
            <Plus className="h-4 w-4" />
            Category
          </Button>
          <Button className="gap-2" onClick={() => setShowExamDialog(true)}>
            <Plus className="h-4 w-4" />
            Exam
          </Button>
        </Can>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Category sidebar */}
        <CategorySidebar
          categories={categories}
          isLoading={catLoading}
          selectedId={selectedCategory}
          onSelect={setSelectedCategory}
          onCreateClick={() => setShowCategoryDialog(true)}
        />

        {/* Exam list */}
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchInput
              placeholder="Search by name or code..."
              value={search}
              onChange={setSearch}
            />
            <Select value={sampleFilter} onValueChange={(v) => setSampleFilter(v ?? 'all')}>
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="Sample type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sample Types</SelectItem>
                {SAMPLE_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {examLoading ? (
            <TableSkeleton rows={8} columns={6} />
          ) : exams.length === 0 ? (
            <EmptyState
              icon={FlaskConical}
              title="No exams found"
              description={search || selectedCategory ? 'Try adjusting your search or category.' : 'Add your first exam definition.'}
              action={!search && canManage ? { label: 'Add Exam', onClick: () => setShowExamDialog(true) } : undefined}
            />
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Sample</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead>Status</TableHead>
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
                      <TableCell className="text-sm text-muted-foreground">{exam.category_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{exam.sample_type}</Badge>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <CategoryDialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog} />
      <ExamDefinitionDialog
        open={showExamDialog}
        onOpenChange={setShowExamDialog}
        categories={categories}
        preselectedCategoryId={selectedCategory}
      />
    </div>
  )
}
