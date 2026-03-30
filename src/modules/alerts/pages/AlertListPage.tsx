import { useState } from 'react'
import { toast } from 'sonner'
import {
  Bell, CheckCircle2, Eye, AlertTriangle, XCircle, Clock, Package,
} from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { Can } from '@/lib/permissions/Can'
import { P } from '@/lib/permissions/constants'
import { AlertSummaryCards } from '../components/AlertSummaryCards'
import {
  useAlerts, useAlertSummary, useAlert,
  useAcknowledgeAlert, useResolveAlert, useBulkAcknowledge,
} from '../api'
import {
  ALERT_TYPE_OPTIONS, SEVERITY_OPTIONS, STATUS_OPTIONS,
  ALERT_TYPE_LABELS,
} from '../types'
import { formatDateTime } from '@/lib/utils/date'
import { cn } from '@/lib/utils'

const SEVERITY_STYLES: Record<string, { icon: typeof AlertTriangle; color: string; bg: string }> = {
  CRITICAL: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  WARNING: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
  INFO: { icon: Bell, color: 'text-blue-600', bg: 'bg-blue-50' },
}

const TYPE_ICONS: Record<string, typeof AlertTriangle> = {
  LOW_STOCK: Package,
  OUT_OF_STOCK: XCircle,
  EXPIRING_SOON: Clock,
  EXPIRED: AlertTriangle,
}

export function AlertListPage() {
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [detailId, setDetailId] = useState<string | null>(null)

  const params: Record<string, string> = {}
  if (typeFilter !== 'all') params.alert_type = typeFilter
  if (severityFilter !== 'all') params.severity = severityFilter
  if (statusFilter !== 'all') params.status = statusFilter

  const { data: summaryData, isLoading: summaryLoading } = useAlertSummary()
  const { data, isLoading, error, refetch } = useAlerts(params)
  const alerts = data?.data ?? []

  const bulkAck = useBulkAcknowledge()

  async function handleBulkAcknowledge() {
    if (selected.size === 0) return
    try {
      const result = await bulkAck.mutateAsync(Array.from(selected))
      toast.success(`${result.acknowledged} alert(s) acknowledged.`)
      setSelected(new Set())
    } catch { toast.error('Bulk acknowledge failed.') }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (error) return <ErrorState onRetry={refetch} />

  return (
    <div className="space-y-6">
      <PageHeader title="Alerts" description="Inventory alerts — stock levels and expiration monitoring" />

      {/* Summary cards */}
      <AlertSummaryCards data={summaryData} isLoading={summaryLoading} />

      <Separator />

      {/* Filters + bulk action */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? 'all')}>
            <SelectTrigger className="sm:w-40"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {ALERT_TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v ?? 'all')}>
            <SelectTrigger className="sm:w-36"><SelectValue placeholder="Severity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              {SEVERITY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
            <SelectTrigger className="sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {selected.size > 0 && (
          <Can permission={P.ALERTS_ACKNOWLEDGE}>
            <Button variant="outline" className="gap-2" onClick={handleBulkAcknowledge} disabled={bulkAck.isPending}>
              <CheckCircle2 className="h-4 w-4" /> Acknowledge {selected.size}
            </Button>
          </Can>
        )}
      </div>

      {/* Table */}
      {isLoading ? <TableSkeleton rows={8} columns={6} /> : alerts.length === 0 ? (
        <EmptyState icon={Bell} title="No alerts" description="No alerts match your current filters." />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Alert</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Stock Item</TableHead>
                <TableHead>Values</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert) => {
                const sev = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.INFO
                const TypeIcon = TYPE_ICONS[alert.alert_type] || Bell
                return (
                  <TableRow key={alert.id} className={cn(alert.status === 'ACTIVE' && sev.bg)}>
                    <TableCell>
                      {alert.status === 'ACTIVE' && (
                        <input
                          type="checkbox"
                          checked={selected.has(alert.id)}
                          onChange={() => toggleSelect(alert.id)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-sm max-w-[200px] truncate">{alert.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <TypeIcon className={cn('h-3.5 w-3.5', sev.color)} />
                        <span className="text-xs">{ALERT_TYPE_LABELS[alert.alert_type]}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-xs', alert.severity === 'CRITICAL' ? 'border-red-200 bg-red-50 text-red-600' : alert.severity === 'WARNING' ? 'border-amber-200 bg-amber-50 text-amber-600' : 'border-blue-200 bg-blue-50 text-blue-600')}>
                        {alert.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-mono text-xs text-muted-foreground">{alert.stock_item_code}</span>
                        <span className="text-sm ml-1.5">{alert.stock_item_name}</span>
                      </div>
                      {alert.lot_number && <p className="text-xs text-muted-foreground">Lot: {alert.lot_number}</p>}
                    </TableCell>
                    <TableCell className="font-mono text-xs tabular-nums">
                      {alert.current_value !== null && alert.threshold_value !== null
                        ? `${alert.current_value} / ${alert.threshold_value}`
                        : alert.current_value ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-xs',
                        alert.status === 'ACTIVE' ? 'border-red-200 bg-red-50 text-red-600' :
                        alert.status === 'ACKNOWLEDGED' ? 'border-blue-200 bg-blue-50 text-blue-600' :
                        'border-emerald-200 bg-emerald-50 text-emerald-600'
                      )}>
                        {alert.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDateTime(alert.created_at)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDetailId(alert.id)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Detail dialog */}
      {detailId && <AlertDetailDialog alertId={detailId} onClose={() => setDetailId(null)} />}
    </div>
  )
}

function AlertDetailDialog({ alertId, onClose }: { alertId: string; onClose: () => void }) {
  const { data: alert, isLoading } = useAlert(alertId)
  const ackMut = useAcknowledgeAlert(alertId)
  const resolveMut = useResolveAlert(alertId)

  async function handleAck() {
    try { await ackMut.mutateAsync(); toast.success('Alert acknowledged.') }
    catch { toast.error('Failed.') }
  }
  async function handleResolve() {
    try { await resolveMut.mutateAsync(); toast.success('Alert resolved.') }
    catch { toast.error('Failed.') }
  }

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent>
        <DialogHeader><DialogTitle>{alert?.title || 'Alert Detail'}</DialogTitle></DialogHeader>
        {isLoading || !alert ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm">{alert.message}</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Type:</span> {ALERT_TYPE_LABELS[alert.alert_type]}</div>
              <div><span className="text-muted-foreground">Severity:</span> {alert.severity}</div>
              <div><span className="text-muted-foreground">Status:</span> {alert.status}</div>
              <div><span className="text-muted-foreground">Item:</span> {alert.stock_item_code}</div>
              {alert.lot_number && <div><span className="text-muted-foreground">Lot:</span> {alert.lot_number}</div>}
              {alert.threshold_value && <div><span className="text-muted-foreground">Threshold:</span> {alert.threshold_value}</div>}
              {alert.current_value && <div><span className="text-muted-foreground">Current:</span> {alert.current_value}</div>}
            </div>
            {alert.acknowledged_at && (
              <p className="text-xs text-muted-foreground">Acknowledged {formatDateTime(alert.acknowledged_at)} by {alert.acknowledged_by_email}</p>
            )}
            {alert.resolved_at && (
              <p className="text-xs text-muted-foreground">Resolved {formatDateTime(alert.resolved_at)} by {alert.resolved_by_email}</p>
            )}
            <Separator />
            <div className="flex gap-2 justify-end">
              {alert.status === 'ACTIVE' && (
                <Can permission={P.ALERTS_ACKNOWLEDGE}>
                  <Button variant="outline" className="gap-2" onClick={handleAck} disabled={ackMut.isPending}>
                    <CheckCircle2 className="h-4 w-4" /> Acknowledge
                  </Button>
                </Can>
              )}
              {(alert.status === 'ACTIVE' || alert.status === 'ACKNOWLEDGED') && (
                <Can permission={P.ALERTS_ACKNOWLEDGE}>
                  <Button className="gap-2" onClick={handleResolve} disabled={resolveMut.isPending}>
                    <CheckCircle2 className="h-4 w-4" /> Resolve
                  </Button>
                </Can>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
