import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileCheck, AlertTriangle } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/shared/PageHeader'
import { SearchInput } from '@/components/shared/SearchInput'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { useResults } from '../api'
import { formatDate } from '@/lib/utils/date'

const STATUS_OPTIONS = ['all', 'DRAFT', 'SUBMITTED', 'REJECTED', 'VALIDATED', 'PUBLISHED']

export function ResultListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [abnormalFilter, setAbnormalFilter] = useState<string>('all')

  const params: Record<string, string> = {}
  if (search) params.search = search
  if (statusFilter !== 'all') params.status = statusFilter
  if (abnormalFilter !== 'all') params.is_abnormal = abnormalFilter

  const { data, isLoading, error, refetch } = useResults(params)
  const results = data?.data ?? []

  if (error) return <ErrorState onRetry={refetch} />

  return (
    <div className="space-y-6">
      <PageHeader title="Results" description="Exam results pipeline — entry, validation, publication" />

      <div className="flex flex-col gap-3 sm:flex-row">
        <SearchInput placeholder="Search by exam, request #..." value={search} onChange={setSearch} />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
          <SelectTrigger className="sm:w-48"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s === 'all' ? 'All Statuses' : s.replace(/_/g, ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={abnormalFilter} onValueChange={(v) => setAbnormalFilter(v ?? 'all')}>
          <SelectTrigger className="sm:w-36"><SelectValue placeholder="Abnormal" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">Abnormal</SelectItem>
            <SelectItem value="false">Normal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <TableSkeleton rows={8} columns={7} /> : results.length === 0 ? (
        <EmptyState icon={FileCheck} title="No results found" description="Results will appear here as exams are processed." />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam</TableHead>
                <TableHead>Request</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Abnormal</TableHead>
                <TableHead>Files</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((r) => (
                <TableRow key={r.id} className="cursor-pointer" onClick={() => navigate(`/results/${r.id}`)}>
                  <TableCell>
                    <div>
                      <span className="font-mono text-xs text-muted-foreground mr-1.5">{r.exam_code}</span>
                      <span className="text-sm font-medium">{r.exam_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{r.request_number}</TableCell>
                  <TableCell>
                    <span className="text-sm font-mono">
                      {r.result_value || '—'}
                      {r.result_unit && <span className="ml-1 text-muted-foreground">{r.result_unit}</span>}
                    </span>
                  </TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell>
                    {r.is_abnormal && (
                      <Badge variant="outline" className="border-red-200 bg-red-50 text-red-600 text-xs gap-1">
                        <AlertTriangle className="h-3 w-3" /> Abnormal
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">{r.files_count > 0 ? r.files_count : '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(r.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
