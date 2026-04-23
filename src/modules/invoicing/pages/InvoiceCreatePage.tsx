import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Loader2, FileText, CheckCircle2, ArrowRight, ArrowLeft, Receipt,
} from 'lucide-react'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/components/shared/PageHeader'
import { FormField } from '@/components/shared/FormField'
import { useActivePartners } from '@/modules/partners/api'
import { useInvoicePreview, useCreateInvoice } from '../api'
import type { InvoicePreview } from '../types'
import { formatCurrency } from '@/lib/utils/currency'
import { ROUTES } from '@/config/routes'


const STEPS = [
  { number: 1, label: 'Invoice criteria' },
  { number: 2, label: 'Preview & generate' },
]


export function InvoiceCreatePage() {
  const navigate = useNavigate()
  const { data: partnersData } = useActivePartners()
  const partners = partnersData ?? []
  const previewMut = useInvoicePreview()
  const createMut = useCreateInvoice()

  const [step, setStep] = useState(1)
  const [partnerId, setPartnerId] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [preview, setPreview] = useState<InvoicePreview | null>(null)

  const selectedPartner = useMemo(
    () => partners.find((p) => p.id === partnerId),
    [partners, partnerId],
  )

  const step1Valid = !!(partnerId && periodStart && periodEnd && periodStart <= periodEnd)

  async function handleLoadPreview() {
    try {
      const result = await previewMut.mutateAsync({
        partner_id: partnerId,
        period_start: periodStart,
        period_end: periodEnd,
      })
      setPreview(result)
      setStep(2)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { errors?: { message?: string }[] } } })
        ?.response?.data?.errors?.[0]?.message
      toast.error(msg || 'Failed to load invoice preview.')
    }
  }

  async function handleGenerate() {
    try {
      const invoice = await createMut.mutateAsync({
        partner_id: partnerId,
        period_start: periodStart,
        period_end: periodEnd,
      })
      toast.success(`Invoice ${invoice.invoice_number} generated.`)
      navigate(`/invoices/${invoice.id}`)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { errors?: { message?: string }[] } } })
        ?.response?.data?.errors?.[0]?.message
      toast.error(msg || 'Failed to generate invoice.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Invoice"
        breadcrumbs={[
          { label: 'Invoices', href: ROUTES.INVOICES },
          { label: 'New' },
        ]}
      />

      {/* Step indicator */}
      <div className="flex items-center gap-3">
        {STEPS.map((s, i) => (
          <div key={s.number} className="flex items-center gap-2">
            {i > 0 && <div className="h-px w-8 bg-border" />}
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                step > s.number
                  ? 'bg-primary text-primary-foreground'
                  : step === s.number
                    ? 'bg-primary text-primary-foreground'
                    : 'border bg-muted text-muted-foreground'
              }`}
            >
              {step > s.number ? <CheckCircle2 className="h-4 w-4" /> : s.number}
            </div>
            <span
              className={`text-sm ${
                step === s.number ? 'font-medium' : 'text-muted-foreground'
              }`}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1 — Criteria */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Invoice Criteria
            </CardTitle>
            <CardDescription>
              Select the partner and the billing period.
              Only finalized requests within this period will be included.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Partner" htmlFor="inv-partner" required>
                <Select
                  value={partnerId}
                  onValueChange={(v) => { if (v) setPartnerId(v) }}
                >
                  <SelectTrigger id="inv-partner">
                    <SelectValue placeholder="Select partner" />
                  </SelectTrigger>
                  <SelectContent>
                    {partners.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                        <span className="ml-2 text-xs text-muted-foreground">
                          {p.code}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              {selectedPartner && (
                <div className="flex items-end pb-1">
                  <div className="text-sm text-muted-foreground">
                    Partner discount:{' '}
                    <span className="font-medium text-foreground">
                      {selectedPartner.invoice_discount_rate
                        ? `${selectedPartner.invoice_discount_rate}%`
                        : '0%'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Period start" htmlFor="inv-start" required>
                <Input
                  id="inv-start" type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                />
              </FormField>
              <FormField label="Period end" htmlFor="inv-end" required>
                <Input
                  id="inv-end" type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                />
              </FormField>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleLoadPreview}
                disabled={!step1Valid || previewMut.isPending}
                className="gap-2"
              >
                {previewMut.isPending
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <ArrowRight className="h-4 w-4" />}
                Preview Invoice
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2 — Preview + Generate */}
      {step === 2 && preview && (
        <>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost" size="sm"
              onClick={() => setStep(1)}
              className="gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Lines table */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">
                  Invoice preview — {preview.partner_name}
                </CardTitle>
                <CardDescription>
                  {preview.period_start} to {preview.period_end}
                  {' · '}
                  {preview.line_count} billable{' '}
                  {preview.line_count === 1 ? 'item' : 'items'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {preview.line_count === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No billable items found for this partner and period.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Patient</TableHead>
                          <TableHead>Request</TableHead>
                          <TableHead>Exam</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {preview.lines.map((line, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-sm font-medium">
                              {line.patient_display_name}
                            </TableCell>
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
                            <TableCell className="text-right font-mono text-sm font-semibold">
                              {formatCurrency(line.line_amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <SummaryRow label="Gross total" value={formatCurrency(preview.gross_total)} bold />
                {parseFloat(preview.discount_rate) > 0 && (
                  <SummaryRow
                    label={`Discount (${preview.discount_rate}%)`}
                    value={`- ${formatCurrency(preview.discount_amount)}`}
                  />
                )}
                <SummaryRow
                  label="Subtotal"
                  value={formatCurrency(preview.subtotal_after_discount)}
                />
                {parseFloat(preview.vat_rate) > 0 && (
                  <SummaryRow
                    label={`VAT (${preview.vat_rate}%)`}
                    value={`+ ${formatCurrency(preview.vat_amount)}`}
                  />
                )}
                <Separator />
                <SummaryRow label="Net total" value={formatCurrency(preview.net_total)} bold accent />

                <div className="pt-2 text-xs text-muted-foreground">
                  <p>{preview.line_count} billable items</p>
                  <p>Period: {preview.period_start} — {preview.period_end}</p>
                </div>

                <Separator />

                <Button
                  className="w-full gap-2"
                  onClick={handleGenerate}
                  disabled={createMut.isPending || preview.line_count === 0}
                >
                  {createMut.isPending
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <FileText className="h-4 w-4" />}
                  Generate Invoice
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
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
