import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/lib/auth/store'
import { ROUTES } from '@/config/routes'

export function GuestGuard() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  return <Outlet />
}
