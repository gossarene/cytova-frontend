export type RequestStatus =
  | 'DRAFT' | 'CONFIRMED' | 'COLLECTION_IN_PROGRESS' | 'IN_ANALYSIS'
  | 'AWAITING_REVIEW' | 'RETEST_REQUIRED' | 'READY_FOR_RELEASE'
  | 'VALIDATED'
  // Locked finality state — set on the first patient-facing
  // notification (email / share link / Cytova). Result + report
  // are immutable while in this state; resends require explicit
  // ``force_resend``, corrections require the ``reopen-result`` flow.
  | 'RESULT_ISSUED'
  | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

/** Post-processing closure state, orthogonal to workflow ``status``. */
export type ClosureStatus = 'OPEN' | 'DELIVERED' | 'ARCHIVED'

/** Lifecycle filter values for the request list. */
export type LifecyclePreset = 'active' | 'delivered' | 'archived' | 'all'
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
  public_reference: string
  patient_id: string
  patient_name: string
  status: RequestStatus
  closure_status: ClosureStatus
  source_type: SourceType
  billing_mode: RequestBillingMode
  partner_organization_id: string | null
  partner_organization_name: string | null
  items_count: number
  created_by_email: string | null
  created_at: string
  /** Notification tracking — surfaced for list-row badges. */
  notified_by_email_at: string | null
  notification_count: number
  last_patient_notification_channel: string
}

export interface PatientSummary {
  id: string
  full_name: string
  first_name: string
  last_name: string
  document_number: string
  phone: string
  email: string
  /** Phase F: surfaced on the request detail so the
   *  PatientDeliveryDrawer can gate the "Send to Cytova" CTA on
   *  link state without a second round-trip to /patients/{id}/.
   *  Mirrors the same fields exposed on the patient detail
   *  serializer; never carries the internal account_id snapshot. */
  has_cytova_identity: boolean
  cytova_patient_id: string
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

export interface CurrentReportMeta {
  id: string
  version_number: number
  generated_at: string
  generated_by_email: string | null
  pdf_url: string
  downloadable: boolean
}

export interface RequestDetail {
  id: string
  request_number: string
  public_reference: string
  patient_id: string
  /** UX hint for "Notify by email" affordance. Empty string means
      patient has no email on file — backend still revalidates. */
  patient_email: string
  status: RequestStatus
  closure_status: ClosureStatus
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
  /** Display-name fallback companion to confirmed_by_email. ``null`` when
   *  the actor record is gone (frontend falls back to email). */
  confirmed_by_display: string | null
  cancelled_at: string | null
  cancelled_by_email: string | null
  cancelled_by_display: string | null
  created_by_email: string | null
  created_by_display: string | null
  items: RequestItemBrief[]
  // Report availability is served directly on the detail payload so the
  // UI survives reload without needing a separate round-trip.
  has_report: boolean
  current_report: CurrentReportMeta | null
  /** Aggregated patient identity for the detail header card.
      Same shape as the patients API exposes to staff. */
  patient_summary: PatientSummary | null
  // Notification tracking
  notified_by_email_at: string | null
  notified_by_email_by_email: string | null
  notified_by_email_by_display: string | null
  notification_count: number
  last_patient_notification_channel: string
  // Lifecycle marker stamps
  delivered_at: string | null
  delivered_by_email: string | null
  delivered_by_display: string | null
  archived_at: string | null
  archived_by_email: string | null
  archived_by_display: string | null
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
  // Download tracking — drives the Mark Collected gate. The backend
  // refuses ``mark-collected`` until ``has_been_downloaded`` is true,
  // so the UI mirrors that rule to disable the control before the
  // round-trip and surface the recovery path inline.
  has_been_downloaded: boolean
  download_count: number
  downloaded_at: string | null
  downloaded_by_email: string | null
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
