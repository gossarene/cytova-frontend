import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Building2 } from 'lucide-react'
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
import { usePartners } from '../api'
import { ORG_TYPE_OPTIONS } from '../types'

export function PartnerListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const params: Record<string, string> = {}
  if (search) params.search = search
  if (typeFilter !== 'all') params.organization_type = typeFilter

  const { data, isLoading, error, refetch } = usePartners(params)
  const partners = data?.data ?? []

  if (error) return <ErrorState onRetry={refetch} />

  return (
    <div className="space-y-6">
      <PageHeader title="Partners" description="Referring clinics, hospitals, and laboratories">
        <Can permission={P.PARTNERS_MANAGE}>
          <Button className="gap-2" onClick={() => navigate('/partners/new')}>
            <Plus className="h-4 w-4" /> Add Partner
          </Button>
        </Can>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row">
        <SearchInput placeholder="Search by name or code..." value={search} onChange={setSearch} />
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? 'all')}>
          <SelectTrigger className="sm:w-44"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {ORG_TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <TableSkeleton rows={6} columns={5} /> : partners.length === 0 ? (
        <EmptyState icon={Building2} title="No partners found"
          description={search ? 'Try adjusting your search.' : 'Add your first partner organization.'}
          action={!search ? { label: 'Add Partner', onClick: () => navigate('/partners/new') } : undefined}
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.map((p) => (
                <TableRow key={p.id} className="cursor-pointer" onClick={() => navigate(`/partners/${p.id}`)}>
                  <TableCell className="font-mono text-sm">{p.code}</TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{p.organization_type}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.contact_person || p.email || '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={p.is_active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-600'}>
                      {p.is_active ? 'Active' : 'Inactive'}
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
