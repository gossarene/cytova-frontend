import type { ReactNode } from 'react'
import { useHasAnyPermission, useHasAllPermissions } from './hooks'

interface CanProps {
  /** Single permission code or array of codes */
  permission: string | string[]
  /** 'any' = user needs at least one; 'all' = user needs every one. Default: 'all' */
  mode?: 'any' | 'all'
  /** Content to render if permission check fails. Default: null (hidden) */
  fallback?: ReactNode
  children: ReactNode
}

/**
 * Declarative permission gate component.
 *
 * Usage:
 *   <Can permission="results.publish">
 *     <Button>Publish</Button>
 *   </Can>
 *
 *   <Can permission={['results.validate', 'results.publish']} mode="any">
 *     <ValidationPanel />
 *   </Can>
 */
export function Can({ permission, mode = 'all', fallback = null, children }: CanProps) {
  const codes = Array.isArray(permission) ? permission : [permission]
  const check = mode === 'any' ? useHasAnyPermission : useHasAllPermissions
  const hasAccess = check(codes)
  return hasAccess ? <>{children}</> : <>{fallback}</>
}
