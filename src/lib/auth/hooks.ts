import { useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'
import { api } from '@/lib/api/client'
import { useAuthStore } from './store'
import type { AuthUser, TenantRole } from './types'
import type { ApiResponse } from '@/lib/api/types'

// -- /users/me/ response shape --

interface MeResponse {
  id: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  role: TenantRole
  is_active: boolean
  created_at: string
  updated_at: string
  permissions: string[]
}

/**
 * Fetch the current user's profile from the server.
 * Updates the auth store with fresh user data and permissions.
 * Called once after login to populate names, and periodically to refresh permissions.
 */
export function useCurrentUser() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<MeResponse>>('/users/me/')
      const me = data.data

      // Update store with fresh server data (permissions may have changed)
      useAuthStore.setState({
        user: {
          id: me.id,
          email: me.email,
          firstName: me.first_name,
          lastName: me.last_name,
          role: me.role,
        },
        permissions: new Set(me.permissions),
      })

      return me
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60_000, // 5 minutes — permissions don't change every second
    refetchOnWindowFocus: true, // Refresh when user returns to the tab
  })
}

/**
 * Get the current user from the auth store (synchronous, no network).
 */
export function useUser(): AuthUser | null {
  return useAuthStore((s) => s.user)
}

/**
 * Get whether the user is authenticated.
 */
export function useIsAuthenticated(): boolean {
  return useAuthStore((s) => s.isAuthenticated)
}

/**
 * Imperatively refresh permissions from the server.
 * Useful after a role change or permission override.
 */
export function useRefreshPermissions() {
  return useCallback(async () => {
    try {
      const { data } = await api.get<ApiResponse<MeResponse>>('/users/me/')
      const me = data.data
      useAuthStore.setState({
        user: {
          id: me.id,
          email: me.email,
          firstName: me.first_name,
          lastName: me.last_name,
          role: me.role,
        },
        permissions: new Set(me.permissions),
      })
    } catch {
      // Silently fail — interceptor handles 401
    }
  }, [])
}
