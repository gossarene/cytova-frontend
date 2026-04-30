export type InvoiceStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED'

export interface InvoicePreviewLine {
  patient_display_name: string
  public_reference_snapshot: string
  exam_code_snapshot: string
  exam_name_snapshot: string
  performed_date: string | null
  unit_price_snapshot: string
  billed_price_snapshot: string
  line_amount: string
}

export interface InvoicePreview {
  partner_id: string
  partner_name: string
  period_start: string
  period_end: string
  line_count: number
  lines: InvoicePreviewLine[]
  gross_total: string
  discount_rate: string
  discount_amount: string
  subtotal_after_discount: string
  vat_rate: string
  vat_amount: string
  net_total: string
}

export interface InvoiceLine {
  id: string
  request_number_snapshot: string
  public_reference_snapshot: string
  patient_display_name: string
  exam_code_snapshot: string
  exam_name_snapshot: string
  performed_date: string | null
  unit_price_snapshot: string
  billed_price_snapshot: string
  line_amount: string
}

export interface InvoiceListItem {
  id: string
  invoice_number: string
  status: InvoiceStatus
  partner_id: string
  partner_name: string
  partner_code: string
  period_start: string
  period_end: string
  gross_total: string
  discount_rate_snapshot: string
  discount_amount: string
  subtotal_after_discount: string
  vat_rate_snapshot: string
  vat_amount: string
  net_total: string
  line_count: number
  generated_at: string
  confirmed_at: string | null
}

export interface InvoiceDetail extends InvoiceListItem {
  currency: string
  generated_by_email: string | null
  generated_by_display: string | null
  confirmed_by_email: string | null
  confirmed_by_display: string | null
  cancelled_at: string | null
  notes: string
  has_pdf: boolean
  pdf_url: string | null
  has_statement: boolean
  statement_url: string | null
  lines: InvoiceLine[]
  created_at: string
}
