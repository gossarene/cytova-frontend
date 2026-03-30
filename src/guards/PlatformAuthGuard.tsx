import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { usePlatformAuthStore } from '@/lib/auth/platform-store'
import { ROUTES } from '@/config/routes'

export function PlatformAuthGuard() {
  const isAuthenticated = usePlatformAuthStore((s) => s.isAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.PLATFORM_LOGIN} state={{ from: location }} replace />
  }

  return <Outlet />
}
