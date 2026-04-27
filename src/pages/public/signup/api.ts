import axios from 'axios'
import { env } from '@/config/env'
import type { ApiResponse } from '@/lib/api/types'

/**
 * Dedicated Axios instance for public onboarding endpoints.
 * No authentication required — these are public API calls served by the
 * platform host (admin.cytova.io) under /api/v1/platform/onboarding/.
 */
const onboardingApi = axios.create({
  baseURL: env.onboardingApiBaseUrl,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

// -- Types -------------------------------------------------------------

export type OnboardingStatus =
  | 'PENDING_EMAIL'
  | 'EMAIL_VERIFIED'
  | 'COMPLETED'
  | 'EXPIRED'

export interface OnboardingRegistration {
  registration_id: string
  email: string
  status: OnboardingStatus
  email_verified_at: string | null
  code_expires_at: string | null
}

export interface StartRequest {
  first_name: string
  last_name: string
  email: string
  phone: string
}

export interface VerifyEmailRequest {
  registration_id: string
  code: string
}

export interface ResendCodeRequest {
  registration_id: string
}

export interface CompleteRequest {
  registration_id: string
  laboratory_name: string
  country: string
  city: string
  slug?: string
  password: string
}

export interface SignupResponse {
  tenant_id: string
  laboratory_name: string
  slug: string
  domain: string
  admin_email: string
  trial_end_date: string | null
  trial_duration_days: number | null
}

export interface SlugCheckResponse {
  available: boolean
  slug: string
  reason: string | null
}

// -- API calls ---------------------------------------------------------

export async function startOnboarding(data: StartRequest): Promise<OnboardingRegistration> {
  const res = await onboardingApi.post<ApiResponse<OnboardingRegistration>>('/start/', data)
  return res.data.data
}

export async function verifyEmail(data: VerifyEmailRequest): Promise<OnboardingRegistration> {
  const res = await onboardingApi.post<ApiResponse<OnboardingRegistration>>('/verify-email/', data)
  return res.data.data
}

export async function resendCode(data: ResendCodeRequest): Promise<OnboardingRegistration> {
  const res = await onboardingApi.post<ApiResponse<OnboardingRegistration>>('/resend-code/', data)
  return res.data.data
}

export async function completeOnboarding(data: CompleteRequest): Promise<SignupResponse> {
  const res = await onboardingApi.post<ApiResponse<SignupResponse>>('/complete/', data)
  return res.data.data
}

export async function checkSlugAvailability(slug: string): Promise<SlugCheckResponse> {
  const res = await onboardingApi.get<ApiResponse<SlugCheckResponse>>('/check-slug/', { params: { slug } })
  return res.data.data
}
