export type Gender = 'MALE' | 'FEMALE'

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
]

export type DocumentType =
  | 'NATIONAL_ID_CARD'
  | 'PASSPORT'
  | 'CIP'
  | 'RESIDENCE_PERMIT'
  | 'OTHER'

export const DOCUMENT_TYPE_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: 'NATIONAL_ID_CARD', label: 'National ID Card' },
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'CIP', label: 'CIP' },
  { value: 'RESIDENCE_PERMIT', label: 'Residence Permit' },
  { value: 'OTHER', label: 'Other' },
]

// List serializer shape
export interface PatientListItem {
  id: string
  document_type: DocumentType
  document_number: string
  first_name: string
  last_name: string
  full_name: string
  date_of_birth: string
  gender: Gender
  nationality: string
  is_active: boolean
  has_portal_account: boolean
  created_at: string
}

// Detail serializer shape
export interface PatientDetail {
  id: string
  document_type: DocumentType
  document_number: string
  first_name: string
  last_name: string
  full_name: string
  date_of_birth: string
  gender: Gender
  nationality: string
  phone: string
  email: string
  city_of_residence: string
  address: string
  insurance_number: string
  is_active: boolean
  portal_account: PortalAccount | null
  created_by: { id: string; email: string } | null
  created_at: string
  updated_at: string
  // ---- Cytova patient-identity link (Phase C exposure) ----------
  // Read-only summary of the lab → global Cytova link, scoped to
  // what the lab UI legitimately needs to render the linked-state
  // badge + recovery actions. Mirrors the backend serializer's
  // field-level rationale in apps/patients/serializers.py.
  //
  // The backend deliberately does NOT expose:
  //   - cytova_patient_account_id  (internal cross-schema snapshot)
  //   - any field from the global PatientAccount (email/name/DOB)
  // — so this type doesn't carry them either. The link is a
  // *snapshot*, not a join.
  has_cytova_identity: boolean
  cytova_patient_id: string
  cytova_identity_verified_at: string | null
  cytova_identity_verified_by_display: string | null
  cytova_identity_unlinked_at: string | null
}

export interface PortalAccount {
  id: string
  email: string
  is_active: boolean
  created_at: string
  last_login: string | null
}

// Create request
export interface PatientCreateRequest {
  document_type: DocumentType
  document_number: string
  first_name: string
  last_name: string
  date_of_birth: string
  gender: Gender
  nationality?: string
  phone?: string
  email?: string
  city_of_residence?: string
  address?: string
  insurance_number?: string
}

// Update request (all optional except what's sent)
export interface PatientUpdateRequest {
  first_name?: string
  last_name?: string
  date_of_birth?: string
  gender?: Gender
  nationality?: string
  phone?: string
  email?: string
  city_of_residence?: string
  address?: string
  insurance_number?: string
}
