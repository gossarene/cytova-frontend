import { useNavigate } from 'react-router-dom'
import { Plus, Receipt } from 'lucide-react'
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/components/shared/PageHeader'
import { CardSkeleton } from '@/components/shared/LoadingSkeleton'
import { ErrorState } from '@/components/shared/ErrorState'
import { Can } from '@/lib/permissions/Can'
import { P } from '@/lib/permissions/constants'
import { useInvoices } from '../api'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDateTime } from '@/lib/utils/date'
import { ROUTES } from '@/config/routes'
import type { InvoiceStatus } from '../types'

const STATUS_VARIANT: Record<InvoiceStatus, 'default' | 'outline' | 'destructive'> = {
  DRAFT: 'outline',
  CONFIRMED: 'default',
  CANCELLED: 'destructive',
}

export function InvoiceListPage() {
  const { data, isLoading, error, refetch } = useInvoices()
  const navigate = useNavigate()

  if (error) return <ErrorState onRetry={refetch} />

  return (
    <div className="space-y-6">
      <PageHeader title="Invoices" description="Partner billing invoices">
        <Can permission={P.BILLING_MANAGE}>
          <Button className="gap-2" onClick={() => navigate(ROUTES.INVOICE_NEW)}>
            <Plus className="h-4 w-4" /> New Invoice
          </Button>
        </Can>
      </PageHeader>

      {isLoading ? (
        <CardSkeleton />
      ) : !data || data.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            <Receipt className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
            No invoices yet. Generate your first partner invoice.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{data.length} invoice{data.length !== 1 ? 's' : ''}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Partner</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Net Total</TableHead>
                    <TableHead>Generated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((inv) => (
                    <TableRow
                      key={inv.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/invoices/${inv.id}`)}
                    >
                      <TableCell className="font-mono text-sm font-medium">
                        {inv.invoice_number}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{inv.partner_name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{inv.partner_code}</span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {inv.period_start} — {inv.period_end}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[inv.status]}>{inv.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold">
                        {formatCurrency(inv.net_total)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(inv.generated_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
