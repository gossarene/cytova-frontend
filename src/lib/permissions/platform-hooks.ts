import { usePlatformAuthStore } from '@/lib/auth/platform-store'
import type { PlatformRole } from '@/lib/auth/types'

/**
 * Get the current platform admin's role.
 */
export function usePlatformRole(): PlatformRole | null {
  return usePlatformAuthStore((s) => s.user?.role ?? null)
}

/**
 * Check if the current platform admin is a platform owner.
 * Used to gate destructive operations (suspend, cancel tenants).
 */
export function useIsPlatformOwner(): boolean {
  return usePlatformAuthStore((s) => s.user?.role === 'PLATFORM_OWNER')
}
