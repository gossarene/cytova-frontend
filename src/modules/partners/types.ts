export type OrganizationType = 'CLINIC' | 'HOSPITAL' | 'LABORATORY' | 'MEDICAL_CENTER' | 'OTHER'
export type BillingMode = 'PREPAID' | 'ON_ACCOUNT' | 'PER_REQUEST'

export const ORG_TYPE_OPTIONS: { value: OrganizationType; label: string }[] = [
  { value: 'CLINIC', label: 'Clinic' },
  { value: 'HOSPITAL', label: 'Hospital' },
  { value: 'LABORATORY', label: 'Laboratory' },
  { value: 'MEDICAL_CENTER', label: 'Medical Center' },
  { value: 'OTHER', label: 'Other' },
]

export const BILLING_MODE_OPTIONS: { value: BillingMode; label: string }[] = [
  { value: 'PREPAID', label: 'Prepaid' },
  { value: 'ON_ACCOUNT', label: 'On Account' },
  { value: 'PER_REQUEST', label: 'Per Request' },
]

export interface PartnerListItem {
  id: string
  code: string
  name: string
  organization_type: OrganizationType
  contact_person: string
  phone: string
  email: string
  invoice_discount_rate: string | null
  is_active: boolean
  created_at: string
}

export interface PartnerDetail extends PartnerListItem {
  address: string
  default_billing_mode: BillingMode | null
  payment_terms_days: number | null
  billing_notes: string
  notes: string
  updated_at: string
  // -- Optional report branding (per-partner) --
  custom_report_branding_enabled: boolean
  report_header_name: string
  report_header_subtitle: string
  report_header_address: string
  report_header_phone: string
  report_header_email: string
  /** URL to the uploaded logo (or empty string when none uploaded). */
  report_header_logo: string
  report_footer_text: string
}

/**
 * Payload accepted by ``useUpdatePartnerBranding``.
 *
 * - When ``logo_file`` is a ``File`` it is uploaded; when ``null`` the
 *   field is omitted (existing logo unchanged).
 * - Set ``clear_logo: true`` to remove the existing logo without
 *   uploading a replacement. Mutually exclusive with ``logo_file``.
 */
export interface PartnerBrandingUpdate {
  custom_report_branding_enabled?: boolean
  report_header_name?: string
  report_header_subtitle?: string
  report_header_address?: string
  report_header_phone?: string
  report_header_email?: string
  report_footer_text?: string
  logo_file?: File | null
  clear_logo?: boolean
}

/**
 * Row shape returned by the nested endpoints at
 * /api/v1/partners/{partner_id}/exam-prices/ — both list and write
 * responses use this shape (the backend has one serializer for both).
 *
 * Prices are serialised as strings to preserve decimal precision across
 * the wire; formatting is done at render time.
 */
export interface PartnerExamPriceItem {
  id: string
  partner_id: string
  partner_code: string
  partner_name: string
  exam_definition_id: string
  exam_code: string
  exam_name: string
  reference_unit_price: string
  agreed_price: string
  notes: string
  is_active: boolean
  created_at: string
  updated_at: string
}
