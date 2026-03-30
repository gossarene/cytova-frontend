import { Navigate, Outlet } from 'react-router-dom'
import { usePermission } from '@/lib/permissions/hooks'
import { ROUTES } from '@/config/routes'

interface PermissionGuardProps {
  permission: string
}

export function PermissionGuard({ permission }: PermissionGuardProps) {
  const hasPermission = usePermission(permission)

  if (!hasPermission) {
    return <Navigate to={ROUTES.FORBIDDEN} replace />
  }

  return <Outlet />
}
