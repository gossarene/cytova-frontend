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
