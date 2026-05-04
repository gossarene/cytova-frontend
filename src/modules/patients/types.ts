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
  | 'UNKNOWN'

export const DOCUMENT_TYPE_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: 'NATIONAL_ID_CARD', label: 'National ID Card' },
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'CIP', label: 'CIP' },
  { value: 'RESIDENCE_PERMIT', label: 'Residence Permit' },
  { value: 'OTHER', label: 'Other' },
  // Explicit "no document on file" choice. When picked, the document
  // number input is hidden — the backend auto-generates an
  // ``AUTO-PT-…`` placeholder and stamps
  // ``identity_number_auto_generated=true`` so we can render it as a
  // placeholder rather than a real ID. Distinct from ``OTHER`` (which
  // still expects a real-but-uncategorised number).
  { value: 'UNKNOWN', label: 'Unknown / not provided' },
]

// List serializer shape
export interface PatientListItem {
  id: string
  document_type: DocumentType
  document_number: string
  // True when the backend generated the document number (because the
  // operator picked ``UNKNOWN`` and left the field blank). The list UI
  // can use this to render the value as a placeholder instead of a
  // real ID.
  identity_number_auto_generated: boolean
  first_name: string
  last_name: string
  full_name: string
  // Nullable since the flexible-identity rollout. Null only when
  // ``date_of_birth_unknown`` is true; the backend rejects a null DOB
  // without the explicit flag.
  date_of_birth: string | null
  date_of_birth_unknown: boolean
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
  // See PatientListItem for the rationale — surfaced read-only so the
  // UI can render the document number as a placeholder when the
  // operator never supplied one.
  identity_number_auto_generated: boolean
  first_name: string
  last_name: string
  full_name: string
  date_of_birth: string | null
  date_of_birth_unknown: boolean
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

// Create request — flexible-identity rollout:
//  - ``document_number`` is optional (omitted/blank when type=UNKNOWN;
//    backend generates a placeholder).
//  - ``date_of_birth`` is optional/nullable, but only when paired with
//    ``date_of_birth_unknown=true``. The backend rejects a null DOB
//    without the explicit flag, so a forgotten field can't silently
//    land null.
export interface PatientCreateRequest {
  document_type: DocumentType
  document_number?: string
  first_name: string
  last_name: string
  date_of_birth?: string | null
  date_of_birth_unknown?: boolean
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
  date_of_birth?: string | null
  date_of_birth_unknown?: boolean
  gender?: Gender
  nationality?: string
  phone?: string
  email?: string
  city_of_residence?: string
  address?: string
  insurance_number?: string
}
