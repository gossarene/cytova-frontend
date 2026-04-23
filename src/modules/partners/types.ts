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
