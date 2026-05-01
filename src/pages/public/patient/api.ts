import axios from 'axios'
import { env } from '@/config/env'
import type { ApiResponse } from '@/lib/api/types'

/**
 * Dedicated Axios instance for the global patient portal endpoints.
 *
 * The patient portal lives at ``/api/v1/patient-portal/`` on the
 * platform/public host (mirrored on the tenant host for resilience —
 * see ``backend/config/urls.py`` and ``urls_public.py``). It is
 * intentionally NOT served by the tenant API client at
 * ``@/lib/api/client`` because that client is subdomain-aware and
 * would resolve the wrong host when called from the public landing
 * pages (which have no tenant context).
 *
 * No JWT, no refresh logic — the patient signup endpoint is public.
 */
const patientPortalApi = axios.create({
  baseURL: env.patientPortalApiBaseUrl,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

// -- Types -------------------------------------------------------------

export interface PatientSignupRequest {
  email: string
  password: string
  confirm_password: string
  first_name: string
  last_name: string
  date_of_birth: string  // YYYY-MM-DD
  phone?: string
  accept_terms: boolean
}

export interface PatientSignupResponse {
  patient_account_id: string
  cytova_patient_id: string
  email: string
  message: string
}

// -- Login + verify-email shapes ---------------------------------------

export interface PatientLoginRequest {
  email: string
  password: string
}

export interface PatientLoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  patient: {
    id: string
    email: string
    cytova_patient_id: string
    first_name: string
    last_name: string
  }
}

export interface PatientVerifyEmailResponse {
  patient_account_id: string
  email: string
  email_verified_at: string
  message: string
}

// -- API calls ---------------------------------------------------------

export async function signupPatient(
  data: PatientSignupRequest,
): Promise<PatientSignupResponse> {
  const res = await patientPortalApi.post<ApiResponse<PatientSignupResponse>>(
    '/signup/', data,
  )
  return res.data.data
}

export async function loginPatient(
  data: PatientLoginRequest,
): Promise<PatientLoginResponse> {
  const res = await patientPortalApi.post<ApiResponse<PatientLoginResponse>>(
    '/login/', data,
  )
  return res.data.data
}

export async function verifyPatientEmail(
  token: string,
): Promise<PatientVerifyEmailResponse> {
  const res = await patientPortalApi.post<ApiResponse<PatientVerifyEmailResponse>>(
    '/verify-email/', { token },
  )
  return res.data.data
}
