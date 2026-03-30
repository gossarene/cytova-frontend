import axios from 'axios'
import { env } from '@/config/env'
import type { ApiResponse } from '@/lib/api/types'

/**
 * Dedicated Axios instance for public onboarding endpoints.
 * No authentication required — these are public API calls.
 */
const onboardingApi = axios.create({
  baseURL: env.onboardingApiBaseUrl,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

// -- Types --

export interface SignupRequest {
  laboratory_name: string
  slug?: string
  admin_email: string
  admin_first_name: string
  admin_last_name: string
  admin_password: string
}

export interface SignupResponse {
  tenant_id: string
  laboratory_name: string
  slug: string
  domain: string
  admin_email: string
}

export interface SlugCheckResponse {
  available: boolean
  slug: string
  reason: string | null
}

// -- API calls --

export async function signup(data: SignupRequest): Promise<SignupResponse> {
  const response = await onboardingApi.post<ApiResponse<SignupResponse>>('/signup/', data)
  return response.data.data
}

export async function checkSlugAvailability(slug: string): Promise<SlugCheckResponse> {
  const response = await onboardingApi.get<ApiResponse<SlugCheckResponse>>('/check-slug/', {
    params: { slug },
  })
  return response.data.data
}
