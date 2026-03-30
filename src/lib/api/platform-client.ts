import axios from 'axios'
import { env } from '@/config/env'
import { usePlatformAuthStore } from '@/lib/auth/platform-store'

/**
 * Axios instance for platform admin API calls.
 * Separate from the tenant API client.
 */
export const platformApi = axios.create({
  baseURL: env.platformApiBaseUrl,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

platformApi.interceptors.request.use((config) => {
  const { accessToken } = usePlatformAuthStore.getState()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})
