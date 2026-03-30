import { useState } from 'react'
import { ScrollText, ChevronDown, ChevronUp } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/shared/PageHeader'
import { SearchInput } from '@/components/shared/SearchInput'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { useAuditLogs } from '../api'
import { formatDateTime } from '@/lib/utils/date'
import { cn } from '@/lib/utils'

const ACTION_STYLES: Record<string, string> = {
  CREATE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  UPDATE: 'border-blue-200 bg-blue-50 text-blue-700',
  DELETE: 'border-red-200 bg-red-50 text-red-600',
  DEACTIVATE: 'border-red-200 bg-red-50 text-red-600',
  LOGIN: 'border-slate-200 bg-slate-50 text-slate-700',
  LOGIN_FAILED: 'border-amber-200 bg-amber-50 text-amber-700',
  VALIDATE: 'border-blue-200 bg-blue-50 text-blue-700',
  PUBLISH: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  CONFIRM: 'border-blue-200 bg-blue-50 text-blue-700',
  CANCEL: 'border-red-200 bg-red-50 text-red-600',
  ROLE_ASSIGN: 'border-purple-200 bg-purple-50 text-purple-700',
  PERMISSION_OVERRIDE: 'border-purple-200 bg-purple-50 text-purple-700',
}

const ACTION_OPTIONS = [
  'all', 'CREATE', 'UPDATE', 'DELETE', 'DEACTIVATE',
  'LOGIN', 'LOGIN_FAILED', 'VALIDATE', 'PUBLISH',
  'CONFIRM', 'CANCEL', 'ROLE_ASSIGN', 'PERMISSION_OVERRIDE',
]

export function AuditLogPage() {
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [entityFilter, setEntityFilter] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const params: Record<string, string> = {}
  if (actionFilter !== 'all') params.action = actionFilter
  if (entityFilter) params.entity_type = entityFilter

  const { data, isLoading, error, refetch } = useAuditLogs(params)
  const logs = data?.data ?? []

  if (error) return <ErrorState onRetry={refetch} />

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Log" description="Immutable trail of all actions in this laboratory" />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Select value={actionFilter} onValueChange={(v) => setActionFilter(v ?? 'all')}>
          <SelectTrigger className="sm:w-48"><SelectValue placeholder="Action" /></SelectTrigger>
          <SelectContent>
            {ACTION_OPTIONS.map((a) => (
              <SelectItem key={a} value={a}>{a === 'all' ? 'All Actions' : a.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <SearchInput placeholder="Filter by entity type..." value={entityFilter} onChange={setEntityFilter} debounceMs={500} />
      </div>

      {isLoading ? <TableSkeleton rows={10} columns={6} /> : logs.length === 0 ? (
        <EmptyState icon={ScrollText} title="No audit entries" description="Actions will be logged here as they occur." />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <>
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-xs', ACTION_STYLES[log.action] || '')}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{log.entity_type}</span>
                      {log.entity_id && (
                        <span className="text-xs text-muted-foreground ml-1 font-mono">
                          {log.entity_id.slice(0, 8)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.actor_email || log.actor_type}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{log.ip_address || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDateTime(log.timestamp)}</TableCell>
                    <TableCell>
                      {log.diff && (
                        <button
                          onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {expandedId === log.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                  {expandedId === log.id && log.diff && (
                    <TableRow key={`${log.id}-diff`}>
                      <TableCell colSpan={6} className="bg-muted/50">
                        <pre className="text-xs font-mono whitespace-pre-wrap max-h-48 overflow-y-auto p-2">
                          {JSON.stringify(log.diff, null, 2)}
                        </pre>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
