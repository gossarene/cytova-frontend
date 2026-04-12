export type RequestStatus = 'DRAFT' | 'CONFIRMED' | 'COLLECTION_IN_PROGRESS' | 'IN_ANALYSIS' | 'AWAITING_REVIEW' | 'RETEST_REQUIRED' | 'READY_FOR_RELEASE' | 'VALIDATED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
export type ItemStatus = 'PENDING' | 'COLLECTED' | 'RESULT_ENTERED' | 'UNDER_REVIEW' | 'VALIDATED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED'
export type ExecutionMode = 'INTERNAL' | 'SUBCONTRACTED' | 'REJECTED'
export type SourceType = 'DIRECT_PATIENT' | 'PARTNER_ORGANIZATION'
export type RequestBillingMode = 'DIRECT_PAYMENT' | 'PARTNER_BILLING'
export type PriceSource =
  | 'DEFAULT_PRICE'
  | 'PARTNER_AGREED_PRICE'
  | 'PRICING_RULE'
  | 'MANUAL_OVERRIDE'

export const SOURCE_TYPE_OPTIONS: { value: SourceType; label: string }[] = [
  { value: 'DIRECT_PATIENT', label: 'Direct Patient' },
  { value: 'PARTNER_ORGANIZATION', label: 'Partner Organization' },
]

export const BILLING_MODE_OPTIONS: { value: RequestBillingMode; label: string }[] = [
  { value: 'DIRECT_PAYMENT', label: 'Direct Payment' },
  { value: 'PARTNER_BILLING', label: 'Partner Billing' },
]

export const EXECUTION_MODE_OPTIONS: { value: ExecutionMode; label: string }[] = [
  { value: 'INTERNAL', label: 'Internal' },
  { value: 'SUBCONTRACTED', label: 'Subcontracted' },
  { value: 'REJECTED', label: 'Rejected' },
]

export const PRICE_SOURCE_LABELS: Record<PriceSource, string> = {
  DEFAULT_PRICE: 'Catalog default',
  PARTNER_AGREED_PRICE: 'Partner agreed price',
  PRICING_RULE: 'Pricing rule',
  MANUAL_OVERRIDE: 'Manual override',
}

/**
 * Shape returned by the backend pricing preview endpoint
 * (``POST /api/v1/requests/preview-pricing/``). The exam id order in the
 * response mirrors the order of ``exam_definition_ids`` the client sent.
 */
export interface ResolvedItemPrice {
  exam_definition_id: string
  exam_code: string
  exam_name: string
  unit_price: string
  billed_price: string
  price_source: PriceSource
}

// -- List item --

export interface RequestListItem {
  id: string
  request_number: string
  patient_id: string
  patient_name: string
  status: RequestStatus
  source_type: SourceType
  billing_mode: RequestBillingMode
  partner_organization_id: string | null
  partner_organization_name: string | null
  items_count: number
  created_by_email: string | null
  created_at: string
}

// -- Request item --

export interface RequestItemBrief {
  id: string
  exam_definition_id: string
  exam_code: string
  exam_name: string
  status: ItemStatus
  execution_mode: ExecutionMode
  rejection_reason: string
  external_partner_name: string
  notes: string
  unit_price: string
  billed_price: string
  price_source: PriceSource
  collected_at: string | null
  collected_by_email: string | null
  collection_notes: string
  created_at: string
}

export interface ExamTraceability {
  sample_received_at: string | null
  sample_received_by: { id: string; email: string } | null
  analysis_completed_at: string | null
  performed_by: { id: string; email: string } | null
}

export interface RequestItemDetail extends RequestItemBrief {
  analysis_request_id: string
  pricing_rule_id: string | null
  traceability: ExamTraceability | null
  updated_at: string
}

// -- Detail --

export interface RequestDetail {
  id: string
  request_number: string
  patient_id: string
  status: RequestStatus
  notes: string
  source_type: SourceType
  billing_mode: RequestBillingMode
  partner_organization_id: string | null
  partner_organization_name: string | null
  partner_organization_code: string | null
  external_reference: string
  source_notes: string
  confirmed_at: string | null
  confirmed_by_email: string | null
  cancelled_at: string | null
  cancelled_by_email: string | null
  created_by_email: string | null
  items: RequestItemBrief[]
  created_at: string
  updated_at: string
}

// -- Create payload --

export interface RequestItemInput {
  exam_definition_id: string
  execution_mode?: ExecutionMode
  external_partner_name?: string
  notes?: string
  billed_price?: string | null
}

// -- Request Labels --

export interface RequestLabel {
  id: string
  barcode_value: string
  label_index: number
  family_name: string
}

export interface RequestLabelBatch {
  id: string
  analysis_request_id: string
  label_count: number
  family_count: number
  generated_at: string
  generated_by_email: string | null
  pdf_url: string | null
  labels: RequestLabel[]
}

export interface RequestCreatePayload {
  patient_id: string
  notes?: string
  source_type?: SourceType
  partner_organization_id?: string | null
  external_reference?: string
  billing_mode?: RequestBillingMode
  source_notes?: string
  items?: RequestItemInput[]
  /**
   * When true, the backend creates the request AND transitions it to
   * CONFIRMED in a single atomic transaction. Used by the 3-step wizard
   * whose final button semantically means "commit this request". Omit
   * (or send false) for the legacy draft-edit flow.
   */
  confirm?: boolean
}
