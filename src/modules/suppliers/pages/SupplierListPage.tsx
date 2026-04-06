import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Truck } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/PageHeader'
import { SearchInput } from '@/components/shared/SearchInput'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { Can } from '@/lib/permissions/Can'
import { P } from '@/lib/permissions/constants'
import { usePermission } from '@/lib/permissions/hooks'
import { useSuppliers } from '../api'

export function SupplierListPage() {
  const navigate = useNavigate()
  const canCreate = usePermission(P.SUPPLIERS_MANAGE)
  const [search, setSearch] = useState('')

  const params: Record<string, string> = {}
  if (search) params.search = search

  const { data, isLoading, error, refetch } = useSuppliers(params)
  const suppliers = data?.data ?? []

  if (error) return <ErrorState onRetry={refetch} />

  return (
    <div className="space-y-6">
      <PageHeader title="Suppliers" description="Manage reagent and consumable suppliers">
        <Can permission={P.SUPPLIERS_MANAGE}>
          <Button className="gap-2" onClick={() => navigate('/suppliers/new')}>
            <Plus className="h-4 w-4" /> Add Supplier
          </Button>
        </Can>
      </PageHeader>

      <SearchInput placeholder="Search by name..." value={search} onChange={setSearch} />

      {isLoading ? <TableSkeleton rows={6} columns={5} /> : suppliers.length === 0 ? (
        <EmptyState icon={Truck} title="No suppliers found"
          description={search ? 'Try a different search.' : 'Add your first supplier.'}
          action={!search && canCreate ? { label: 'Add Supplier', onClick: () => navigate('/suppliers/new') } : undefined}
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((s) => (
                <TableRow key={s.id} className="cursor-pointer" onClick={() => navigate(`/suppliers/${s.id}`)}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.contact_name || '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.email || '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.phone || '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={s.is_active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-600'}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
