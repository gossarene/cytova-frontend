import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, XCircle, Receipt, FileText, Download } from 'lucide-react'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/components/shared/PageHeader'
import { CardSkeleton } from '@/components/shared/LoadingSkeleton'
import { ErrorState } from '@/components/shared/ErrorState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Can } from '@/lib/permissions/Can'
import { P } from '@/lib/permissions/constants'
import {
  useInvoice, useConfirmInvoice, useCancelInvoice,
  useGenerateInvoicePdf, useGenerateStatement,
} from '../api'
import { useLabSettings } from '@/modules/lab_settings/api'
import { api } from '@/lib/api/client'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDateTime } from '@/lib/utils/date'
import { ROUTES } from '@/config/routes'
import type { InvoiceStatus } from '../types'

const STATUS_VARIANT: Record<InvoiceStatus, 'default' | 'outline' | 'destructive'> = {
  DRAFT: 'outline',
  CONFIRMED: 'default',
  CANCELLED: 'destructive',
}

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: invoice, isLoading, error, refetch } = useInvoice(id!)
  const confirmMut = useConfirmInvoice(id!)
  const cancelMut = useCancelInvoice(id!)
  const generatePdfMut = useGenerateInvoicePdf(id!)
  const generateStmtMut = useGenerateStatement(id!)
  const { data: labSettings } = useLabSettings()
  const [showConfirm, setShowConfirm] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDownloadingStmt, setIsDownloadingStmt] = useState(false)

  if (error) return <ErrorState onRetry={refetch} />
  if (isLoading || !invoice) return <div className="space-y-6"><CardSkeleton /><CardSkeleton /></div>

  const isDraft = invoice.status === 'DRAFT'

  async function handleConfirm() {
    setShowConfirm(false)
    try {
      await confirmMut.mutateAsync()
      toast.success(`Invoice ${invoice!.invoice_number} confirmed.`)
      refetch()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { errors?: { message?: string }[] } } })
        ?.response?.data?.errors?.[0]?.message
      toast.error(msg || 'Failed to confirm invoice.')
    }
  }

  async function handleCancel() {
    setShowCancel(false)
    try {
      await cancelMut.mutateAsync()
      toast.success(`Invoice ${invoice!.invoice_number} cancelled.`)
      refetch()
    } catch {
      toast.error('Failed to cancel invoice.')
    }
  }

  async function handleGeneratePdf() {
    try {
      await generatePdfMut.mutateAsync()
      toast.success('Invoice PDF generated.')
      refetch()
    } catch {
      toast.error('Failed to generate invoice PDF.')
    }
  }

  async function handleDownloadPdf() {
    if (!invoice?.pdf_url) return
    setIsDownloading(true)
    try {
      const resp = await api.get<Blob>(invoice.pdf_url, { responseType: 'blob' })
      const blob = new Blob([resp.data], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      try {
        const a = document.createElement('a')
        a.href = url
        a.download = `${invoice.invoice_number}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } finally {
        URL.revokeObjectURL(url)
      }
    } catch {
      toast.error('Failed to download invoice PDF.')
    } finally {
      setIsDownloading(false)
    }
  }

  async function handleGenerateStatement() {
    try {
      await generateStmtMut.mutateAsync()
      toast.success('Financial statement generated.')
      refetch()
    } catch {
      toast.error('Failed to generate financial statement.')
    }
  }

  async function handleDownloadStatement() {
    if (!invoice?.statement_url) return
    setIsDownloadingStmt(true)
    try {
      const resp = await api.get<Blob>(invoice.statement_url, { responseType: 'blob' })
      const blob = new Blob([resp.data], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      try {
        const a = document.createElement('a')
        a.href = url
        a.download = `statement_${invoice.invoice_number}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } finally {
        URL.revokeObjectURL(url)
      }
    } catch {
      toast.error('Failed to download financial statement.')
    } finally {
      setIsDownloadingStmt(false)
    }
  }

  const docMode = labSettings?.financial_document_mode ?? 'INVOICE_ONLY'
  const showInvoicePdf = docMode === 'INVOICE_ONLY' || docMode === 'BOTH'
  const showStatement = docMode === 'STATEMENT_ONLY' || docMode === 'BOTH'

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Invoice ${invoice.invoice_number}`}
        breadcrumbs={[
          { label: 'Invoices', href: ROUTES.INVOICES },
          { label: invoice.invoice_number },
        ]}
      >
        {isDraft && (
          <Can permission={P.BILLING_MANAGE}>
            <Button
              variant="destructive" className="gap-2"
              onClick={() => setShowCancel(true)}
              disabled={cancelMut.isPending}
            >
              <XCircle className="h-4 w-4" /> Cancel
            </Button>
            <Button
              className="gap-2"
              onClick={() => setShowConfirm(true)}
              disabled={confirmMut.isPending}
            >
              {confirmMut.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <CheckCircle2 className="h-4 w-4" />}
              Confirm Invoice
            </Button>
          </Can>
        )}
        {/* Invoice PDF */}
        {showInvoicePdf && (invoice.has_pdf ? (
          <Button
            variant="outline" className="gap-2"
            onClick={handleDownloadPdf}
            disabled={isDownloading}
          >
            {isDownloading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Download className="h-4 w-4" />}
            Download Invoice
          </Button>
        ) : (
          <Can permission={P.BILLING_MANAGE}>
            <Button
              variant="outline" className="gap-2"
              onClick={handleGeneratePdf}
              disabled={generatePdfMut.isPending}
            >
              {generatePdfMut.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <FileText className="h-4 w-4" />}
              Generate Invoice PDF
            </Button>
          </Can>
        ))}
        {/* Financial Statement PDF */}
        {showStatement && (invoice.has_statement ? (
          <Button
            variant="outline" className="gap-2"
            onClick={handleDownloadStatement}
            disabled={isDownloadingStmt}
          >
            {isDownloadingStmt
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Download className="h-4 w-4" />}
            Download Statement
          </Button>
        ) : (
          <Can permission={P.BILLING_MANAGE}>
            <Button
              variant="outline" className="gap-2"
              onClick={handleGenerateStatement}
              disabled={generateStmtMut.isPending}
            >
              {generateStmtMut.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <FileText className="h-4 w-4" />}
              Generate Statement
            </Button>
          </Can>
        ))}
      </PageHeader>

      {/* Summary */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                Invoice Details
              </CardTitle>
              <Badge variant={STATUS_VARIANT[invoice.status]}>{invoice.status}</Badge>
            </div>
            <CardDescription>
              {invoice.partner_name} ({invoice.partner_code})
              {' · '}
              {invoice.period_start} — {invoice.period_end}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Invoice #" value={invoice.invoice_number} />
              <Field label="Partner" value={`${invoice.partner_name} (${invoice.partner_code})`} />
              <Field label="Period" value={`${invoice.period_start} — ${invoice.period_end}`} />
              <Field label="Generated" value={formatDateTime(invoice.generated_at)} />
              {invoice.generated_by_email && (
                <Field label="Generated by" value={invoice.generated_by_email} />
              )}
              {invoice.confirmed_at && (
                <Field label="Confirmed" value={formatDateTime(invoice.confirmed_at)} />
              )}
              {invoice.confirmed_by_email && (
                <Field label="Confirmed by" value={invoice.confirmed_by_email} />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Totals card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Totals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <SummaryRow label="Gross total" value={formatCurrency(invoice.gross_total)} bold />
            {parseFloat(invoice.discount_rate_snapshot) > 0 && (
              <>
                <SummaryRow
                  label={`Discount (${invoice.discount_rate_snapshot}%)`}
                  value={`- ${formatCurrency(invoice.discount_amount)}`}
                />
                <Separator />
              </>
            )}
            <SummaryRow label="Net total" value={formatCurrency(invoice.net_total)} bold accent />
            <div className="pt-2 text-xs text-muted-foreground">
              {invoice.lines.length} line{invoice.lines.length !== 1 ? 's' : ''}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lines table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invoice Lines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Request</TableHead>
                  <TableHead>Exam</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Billed</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="text-sm font-medium">{line.patient_display_name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {line.public_reference_snapshot}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-muted-foreground mr-1">
                        {line.exam_code_snapshot}
                      </span>
                      <span className="text-sm">{line.exam_name_snapshot}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {line.performed_date || '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-muted-foreground">
                      {formatCurrency(line.unit_price_snapshot)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(line.billed_price_snapshot)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">
                      {formatCurrency(line.line_amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showConfirm} onOpenChange={setShowConfirm}
        title="Confirm this invoice?"
        description={`This will lock invoice ${invoice.invoice_number} (net ${formatCurrency(invoice.net_total)}). Once confirmed, no new invoice can be generated for the same partner and period.`}
        confirmLabel="Confirm Invoice"
        onConfirm={handleConfirm}
        isLoading={confirmMut.isPending}
      />
      <ConfirmDialog
        open={showCancel} onOpenChange={setShowCancel}
        title="Cancel this invoice?" variant="destructive"
        description={`This will void invoice ${invoice.invoice_number}. The included items will become available for future invoicing.`}
        confirmLabel="Cancel Invoice"
        onConfirm={handleCancel}
        isLoading={cancelMut.isPending}
      />
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm">{value}</p>
    </div>
  )
}

function SummaryRow({
  label, value, bold, accent,
}: {
  label: string; value: string; bold?: boolean; accent?: boolean
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className={bold ? 'font-medium' : 'text-muted-foreground'}>{label}</span>
      <span className={`font-mono ${bold ? 'font-semibold' : ''} ${accent ? 'text-primary' : ''}`}>
        {value}
      </span>
    </div>
  )
}
