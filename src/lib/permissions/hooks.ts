import { useAuthStore } from '@/lib/auth/store'
import type { TenantRole } from '@/lib/auth/types'

/**
 * Check a single permission. Returns boolean.
 * Usage: const canCreate = usePermission('patients.create')
 */
export function usePermission(code: string): boolean {
  return useAuthStore((s) => s.permissions.has(code))
}

/**
 * Check if user has ANY of the listed permissions.
 * Used for sidebar sections visible when user has access to at least one item.
 */
export function useHasAnyPermission(codes: string[]): boolean {
  return useAuthStore((s) => codes.some((c) => s.permissions.has(c)))
}

/**
 * Check if user has ALL of the listed permissions.
 * Used for complex actions requiring multiple permissions.
 */
export function useHasAllPermissions(codes: string[]): boolean {
  return useAuthStore((s) => codes.every((c) => s.permissions.has(c)))
}

/**
 * Get the current user's role.
 */
export function useRole(): TenantRole | null {
  return useAuthStore((s) => s.user?.role ?? null)
}
