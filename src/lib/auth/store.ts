import { create } from 'zustand'
import { LOCAL_STORAGE_KEYS } from '@/config/constants'
import { decodeAccessToken, isTokenExpired } from './tokens'
import type { AuthUser, LoginResponse, TenantRole } from './types'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: AuthUser | null
  permissions: Set<string>
  isAuthenticated: boolean

  login: (response: LoginResponse) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  logout: () => void
  updatePermissions: (permissions: string[]) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  permissions: new Set(),
  isAuthenticated: false,

  login: (response: LoginResponse) => {
    const { access_token, refresh_token, user } = response

    localStorage.setItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, access_token)
    localStorage.setItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN, refresh_token)

    const decoded = decodeAccessToken(access_token)

    set({
      accessToken: access_token,
      refreshToken: refresh_token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
      },
      permissions: new Set(decoded.permissions),
      isAuthenticated: true,
    })
  },

  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, accessToken)
    localStorage.setItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN, refreshToken)

    const decoded = decodeAccessToken(accessToken)

    set((state) => ({
      accessToken,
      refreshToken,
      user: state.user
        ? { ...state.user, role: decoded.role as TenantRole }
        : null,
      permissions: new Set(decoded.permissions),
      isAuthenticated: true,
    }))
  },

  logout: () => {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN)
    localStorage.removeItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN)

    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      permissions: new Set(),
      isAuthenticated: false,
    })
  },

  updatePermissions: (permissions: string[]) => {
    set({ permissions: new Set(permissions) })
  },
}))

/**
 * Hydrate auth store from localStorage on app startup.
 * Call this before rendering the app.
 */
export function hydrateAuth(): void {
  const accessToken = localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN)
  const refreshToken = localStorage.getItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN)

  if (!accessToken || !refreshToken) return

  if (isTokenExpired(accessToken)) {
    // Token expired — will be refreshed on first API call via interceptor.
    // Store the refresh token so the interceptor can use it.
    useAuthStore.setState({ refreshToken })
    return
  }

  try {
    const decoded = decodeAccessToken(accessToken)
    useAuthStore.setState({
      accessToken,
      refreshToken,
      user: {
        id: decoded.sub,
        email: decoded.email,
        firstName: '', // Will be populated from /users/me/ later
        lastName: '',
        role: decoded.role as TenantRole,
      },
      permissions: new Set(decoded.permissions),
      isAuthenticated: true,
    })
  } catch {
    // Invalid token — clear everything
    localStorage.removeItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN)
    localStorage.removeItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN)
  }
}
