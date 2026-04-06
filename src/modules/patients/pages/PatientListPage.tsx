import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users, Globe } from 'lucide-react'
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
import { usePermission } from '@/lib/permissions/hooks'
import { P } from '@/lib/permissions/constants'
import { usePatients } from '../api'
import { formatDate } from '@/lib/utils/date'
import { ROUTES } from '@/config/routes'

export function PatientListPage() {
  const navigate = useNavigate()
  const canCreate = usePermission(P.PATIENTS_CREATE)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [portalFilter, setPortalFilter] = useState<string>('all')

  const params: Record<string, string> = {}
  if (search) params.search = search
  if (activeFilter !== 'all') params.is_active = activeFilter
  if (portalFilter !== 'all') params.has_portal_account = portalFilter

  const { data, isLoading, error, refetch } = usePatients(params)
  const patients = data?.data ?? []

  if (error) return <ErrorState onRetry={refetch} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patients"
        description="Manage patient records and portal accounts"
      >
        <Can permission={P.PATIENTS_CREATE}>
          <Button className="gap-2" onClick={() => navigate(ROUTES.PATIENT_NEW)}>
            <Plus className="h-4 w-4" />
            Register Patient
          </Button>
        </Can>
      </PageHeader>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <SearchInput
          placeholder="Search by name or national ID..."
          value={search}
          onChange={setSearch}
        />
        <Select value={activeFilter} onValueChange={(v) => setActiveFilter(v ?? 'all')}>
          <SelectTrigger className="sm:w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={portalFilter} onValueChange={(v) => setPortalFilter(v ?? 'all')}>
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="Portal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Patients</SelectItem>
            <SelectItem value="true">Has Portal</SelectItem>
            <SelectItem value="false">No Portal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={8} columns={6} />
      ) : patients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No patients found"
          description={search ? 'Try adjusting your search or filters.' : 'Register your first patient to get started.'}
          action={!search && canCreate ? { label: 'Register Patient', onClick: () => navigate(ROUTES.PATIENT_NEW) } : undefined}
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>National ID</TableHead>
                <TableHead>Date of Birth</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Portal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((patient) => (
                <TableRow
                  key={patient.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/patients/${patient.id}`)}
                >
                  <TableCell>
                    <span className="font-medium">{patient.full_name}</span>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {patient.national_id}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(patient.date_of_birth)}
                  </TableCell>
                  <TableCell className="text-sm">{patient.gender}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={patient.is_active
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-red-200 bg-red-50 text-red-600'}
                    >
                      {patient.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {patient.has_portal_account && (
                      <Globe className="h-4 w-4 text-primary" />
                    )}
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
