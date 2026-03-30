export type Gender = 'MALE' | 'FEMALE' | 'OTHER'

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
]

// List serializer shape
export interface PatientListItem {
  id: string
  national_id: string
  first_name: string
  last_name: string
  full_name: string
  date_of_birth: string
  gender: Gender
  is_active: boolean
  has_portal_account: boolean
  created_at: string
}

// Detail serializer shape
export interface PatientDetail {
  id: string
  national_id: string
  first_name: string
  last_name: string
  full_name: string
  date_of_birth: string
  gender: Gender
  phone: string
  email: string
  address: string
  insurance_number: string
  is_active: boolean
  portal_account: PortalAccount | null
  created_by: { id: string; email: string } | null
  created_at: string
  updated_at: string
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
  national_id: string
  first_name: string
  last_name: string
  date_of_birth: string
  gender: Gender
  phone?: string
  email?: string
  address?: string
  insurance_number?: string
}

// Update request (all optional except what's sent)
export interface PatientUpdateRequest {
  first_name?: string
  last_name?: string
  date_of_birth?: string
  gender?: Gender
  phone?: string
  email?: string
  address?: string
  insurance_number?: string
}
