import { create } from 'zustand'
import { isTokenExpired, decodeAccessToken } from './tokens'
import type { PlatformRole } from './types'

interface PlatformUser {
  id: string
  email: string
  role: PlatformRole
}

interface PlatformAuthState {
  accessToken: string | null
  refreshToken: string | null
  user: PlatformUser | null
  isAuthenticated: boolean

  login: (data: { access_token: string; refresh_token: string; user: PlatformUser }) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  logout: () => void
}

const PLATFORM_ACCESS_KEY = 'cytova_platform_access'
const PLATFORM_REFRESH_KEY = 'cytova_platform_refresh'

export const usePlatformAuthStore = create<PlatformAuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,

  login: (data) => {
    localStorage.setItem(PLATFORM_ACCESS_KEY, data.access_token)
    localStorage.setItem(PLATFORM_REFRESH_KEY, data.refresh_token)
    set({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      user: data.user,
      isAuthenticated: true,
    })
  },

  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem(PLATFORM_ACCESS_KEY, accessToken)
    localStorage.setItem(PLATFORM_REFRESH_KEY, refreshToken)
    set({ accessToken, refreshToken })
  },

  logout: () => {
    localStorage.removeItem(PLATFORM_ACCESS_KEY)
    localStorage.removeItem(PLATFORM_REFRESH_KEY)
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    })
  },
}))

/**
 * Hydrate platform auth store from localStorage on app startup.
 */
export function hydratePlatformAuth(): void {
  const accessToken = localStorage.getItem(PLATFORM_ACCESS_KEY)
  const refreshToken = localStorage.getItem(PLATFORM_REFRESH_KEY)

  if (!accessToken || !refreshToken) return

  if (isTokenExpired(accessToken)) {
    // Platform tokens are long-lived with no refresh — clear and require re-login.
    localStorage.removeItem(PLATFORM_ACCESS_KEY)
    localStorage.removeItem(PLATFORM_REFRESH_KEY)
    return
  }

  try {
    const decoded = decodeAccessToken(accessToken)
    usePlatformAuthStore.setState({
      accessToken,
      refreshToken,
      user: {
        id: decoded.sub,
        email: decoded.email,
        role: (decoded.role || 'PLATFORM_STAFF') as PlatformRole,
      },
      isAuthenticated: true,
    })
  } catch {
    localStorage.removeItem(PLATFORM_ACCESS_KEY)
    localStorage.removeItem(PLATFORM_REFRESH_KEY)
  }
}
