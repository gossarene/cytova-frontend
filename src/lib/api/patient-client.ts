import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { env } from '@/config/env'
import { usePatientAuthStore } from '@/lib/auth/patient-store'

/**
 * Axios instance for authenticated patient portal calls.
 *
 * Distinct from the staff tenant client (``@/lib/api/client``) so:
 *   - the Authorization header is sourced from the patient store (not
 *     the staff store), keeping the two sessions independent;
 *   - the 401 → refresh → retry cycle hits the dedicated patient
 *     refresh endpoint (``/api/v1/patient-portal/refresh/``) and
 *     never touches the staff JWT machinery;
 *   - on refresh failure the patient is logged out locally so the
 *     auth guard immediately bounces them to the login page.
 *
 * Public patient endpoints (signup, verify-email, login, refresh)
 * use the dedicated unauthenticated client at
 * ``@/pages/public/patient/api`` — the two clients differ only in
 * whether they inject an Authorization header.
 */
export const patientApi = axios.create({
  baseURL: env.patientPortalApiBaseUrl,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

patientApi.interceptors.request.use((config) => {
  const { accessToken } = usePatientAuthStore.getState()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// ---------------------------------------------------------------------------
// 401 → refresh → retry, with a single in-flight refresh + queue.
//
// Mirrors the staff-side interceptor but talks to the patient
// refresh endpoint and patient store.
// ---------------------------------------------------------------------------

interface QueuedRequest {
  resolve: (token: string) => void
  reject: (err: Error) => void
}

let isRefreshing = false
let failedQueue: QueuedRequest[] = []

function processQueue(error: Error | null, token: string | null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)))
  failedQueue = []
}

patientApi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined

    if (
      error.response?.status !== 401
      || !originalRequest
      || originalRequest._retry
    ) {
      return Promise.reject(error)
    }

    // Don't try to refresh if we don't have a refresh token to begin
    // with — drop the session and bubble the 401 so the guard
    // redirects.
    const { refreshToken } = usePatientAuthStore.getState()
    if (!refreshToken) {
      usePatientAuthStore.getState().logout()
      return Promise.reject(error)
    }

    if (isRefreshing) {
      // Already refreshing — queue this call until the in-flight
      // refresh resolves, then re-issue with the new token.
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({
          resolve: (newToken) => {
            originalRequest.headers.set('Authorization', `Bearer ${newToken}`)
            resolve(patientApi(originalRequest) as unknown as string)
          },
          reject,
        })
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      // Use a raw axios call (no interceptor) to avoid recursion.
      const { data } = await axios.post(
        `${env.patientPortalApiBaseUrl}/refresh/`,
        { refresh_token: refreshToken },
      )
      const next = data.data
      // Patient store's ``login`` action stamps both tokens + the
      // patient profile snapshot — same payload shape as
      // ``POST /login/``.
      usePatientAuthStore.getState().login(next)
      processQueue(null, next.access_token)
      originalRequest.headers.set('Authorization', `Bearer ${next.access_token}`)
      return patientApi(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError as Error, null)
      // Refresh token rejected (expired / blacklisted / unknown). Drop
      // the local session so the guard redirects on the next render —
      // the patient logs in again.
      usePatientAuthStore.getState().logout()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)
