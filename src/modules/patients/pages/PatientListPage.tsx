import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users, FilePlus2 } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
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
import { GENDER_OPTIONS } from '../types'
import { formatDate } from '@/lib/utils/date'
import { ROUTES } from '@/config/routes'

export function PatientListPage() {
  const navigate = useNavigate()
  const canCreate = usePermission(P.PATIENTS_CREATE)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [genderFilter, setGenderFilter] = useState<string>('all')

  const params: Record<string, string> = {}
  if (search) params.search = search
  if (activeFilter !== 'all') params.is_active = activeFilter
  if (genderFilter !== 'all') params.gender = genderFilter

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
          placeholder="Search patients..."
          value={search}
          onChange={setSearch}
        />
        <Select value={activeFilter} onValueChange={(v) => setActiveFilter(v ?? 'all')}>
          <SelectTrigger className="sm:w-40">
            <span className="text-sm">
              <span className="text-muted-foreground">Status:</span>{' '}
              {{ all: 'All', true: 'Active', false: 'Inactive' }[activeFilter]}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={genderFilter} onValueChange={(v) => setGenderFilter(v ?? 'all')}>
          <SelectTrigger className="sm:w-44">
            <span className="text-sm">
              <span className="text-muted-foreground">Gender:</span>{' '}
              {genderFilter === 'all' ? 'All' : GENDER_OPTIONS.find((g) => g.value === genderFilter)?.label}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {GENDER_OPTIONS.map((g) => (
              <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={8} columns={5} />
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
                <TableHead>Document No.</TableHead>
                <TableHead>Date of Birth</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Status</TableHead>
                <Can permission={P.REQUESTS_CREATE}>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </Can>
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
                    {patient.document_number}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(patient.date_of_birth)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {GENDER_OPTIONS.find((g) => g.value === patient.gender)?.label ?? patient.gender}
                  </TableCell>
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
                  <Can permission={P.REQUESTS_CREATE}>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(ROUTES.REQUEST_NEW, {
                            state: {
                              patientId: patient.id,
                              patientName: patient.full_name,
                              patientDocumentNumber: patient.document_number,
                            },
                          })
                        }}
                      >
                        <FilePlus2 className="h-3.5 w-3.5" />
                        New Request
                      </Button>
                    </TableCell>
                  </Can>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
