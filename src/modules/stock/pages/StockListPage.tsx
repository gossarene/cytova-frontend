import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Package } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/PageHeader'
import { SearchInput } from '@/components/shared/SearchInput'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { Can } from '@/lib/permissions/Can'
import { P } from '@/lib/permissions/constants'
import { QuantityIndicator } from '../components/QuantityIndicator'
import { useStockItems, useStockCategories } from '../api'
import { cn } from '@/lib/utils'

export function StockListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [thresholdFilter, setThresholdFilter] = useState<string>('all')

  const { data: catData } = useStockCategories({ is_active: 'true' })
  const categories = catData?.data ?? []

  const params: Record<string, string> = {}
  if (search) params.search = search
  if (categoryFilter !== 'all') params.category_id = categoryFilter
  if (thresholdFilter !== 'all') params.below_threshold = thresholdFilter

  const { data, isLoading, error, refetch } = useStockItems(params)
  const items = data?.data ?? []

  if (error) return <ErrorState onRetry={refetch} />

  return (
    <div className="space-y-6">
      <PageHeader title="Stock" description="Reagents, consumables, and inventory levels">
        <Can permission={P.STOCK_MANAGE}>
          <Button className="gap-2" onClick={() => navigate('/stock/new')}>
            <Plus className="h-4 w-4" /> Add Item
          </Button>
        </Can>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row">
        <SearchInput placeholder="Search by code, name, supplier..." value={search} onChange={setSearch} />
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? 'all')}>
          <SelectTrigger className="sm:w-44"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={thresholdFilter} onValueChange={(v) => setThresholdFilter(v ?? 'all')}>
          <SelectTrigger className="sm:w-40"><SelectValue placeholder="Stock level" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="true">Below Threshold</SelectItem>
            <SelectItem value="false">Above Threshold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <TableSkeleton rows={8} columns={6} /> : items.length === 0 ? (
        <EmptyState icon={Package} title="No stock items found"
          description={search ? 'Try adjusting your search.' : 'Add your first stock item.'}
          action={!search ? { label: 'Add Item', onClick: () => navigate('/stock/new') } : undefined}
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock Level</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const qty = parseFloat(item.current_quantity)
                const threshold = parseFloat(item.minimum_threshold)
                const isBelowThreshold = qty <= threshold && threshold > 0
                return (
                  <TableRow
                    key={item.id}
                    className={cn('cursor-pointer', isBelowThreshold && 'bg-amber-50/50')}
                    onClick={() => navigate(`/stock/${item.id}`)}
                  >
                    <TableCell className="font-mono text-sm">{item.code}</TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.category_name}</TableCell>
                    <TableCell>
                      <QuantityIndicator
                        current={qty}
                        threshold={threshold}
                        unit={item.unit}
                        showBar={false}
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.main_supplier_name || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={item.is_active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-600'}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
