import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { usePatientAuthStore } from '@/lib/auth/patient-store'
import { ROUTES } from '@/config/routes'

/**
 * Gate for the ``/patient/*`` routes — redirects unauthenticated
 * visitors to the patient login page.
 *
 * Independent of the staff ``AuthGuard``: a logged-in lab admin still
 * needs to sign in as a patient to access patient pages, because the
 * two stores hold separate token sets and there is no patient
 * equivalent of staff role/permissions.
 */
export function PatientAuthGuard() {
  const isAuthenticated = usePatientAuthStore((s) => s.isAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    // Patient login is now served from ``/login`` on the public
    // host (``LoginRouteSwitch`` dispatches to ``PatientLoginPage``).
    // ``state.from`` carries the requested URL so PatientLoginPage's
    // post-login navigate honours the original intent.
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }

  return <Outlet />
}
