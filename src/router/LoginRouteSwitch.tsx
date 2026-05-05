import { Navigate, useLocation } from 'react-router-dom'
import { isPublicHost } from '@/lib/host/is-public-host'
import { useAuthStore } from '@/lib/auth/store'
import { usePatientAuthStore } from '@/lib/auth/patient-store'
import { LoginPage } from '@/pages/auth/LoginPage'
import { PatientLoginPage } from '@/pages/public/PatientLoginPage'
import { ROUTES } from '@/config/routes'

/**
 * Picks the right login page for the current host.
 *
 * The same ``/login`` URL is meaningful on two audiences:
 *
 *   - Public/main domain (``cytova.io``)        → patient login
 *   - Tenant subdomain (``<lab>.cytova.io``)    → staff login
 *
 * Both branches honour the equivalent of ``GuestGuard``: an
 * already-authenticated user is bounced past the login form into
 * their respective dashboard. The two auth stores are independent
 * (different token sets, different roles), so we check the *right*
 * store for the *right* branch — a logged-in patient on a tenant
 * subdomain still sees the staff login form (and vice versa) so
 * staff/patient flows never collide.
 *
 * The host check runs at render time. SSR / no-window environments
 * fall back to the staff-login branch — there is no SSR in this
 * codebase, but the defensive default keeps things sane if a test
 * harness mounts the route without a DOM.
 */
export function LoginRouteSwitch() {
  const location = useLocation()
  const isStaffAuthed = useAuthStore((s) => s.isAuthenticated)
  const isPatientAuthed = usePatientAuthStore((s) => s.isAuthenticated)

  const hostname =
    typeof window !== 'undefined' ? window.location.hostname : ''
  const onPublicHost = !!hostname && isPublicHost(hostname)

  if (onPublicHost) {
    // Public/main domain → patient login. If already signed in as a
    // patient, skip the form and land directly on the patient
    // dashboard (mirrors the staff GuestGuard's behaviour).
    if (isPatientAuthed) {
      return <Navigate to={ROUTES.PATIENT_DASHBOARD} replace />
    }
    return <PatientLoginPage />
  }

  // Tenant subdomain → staff login. Same GuestGuard semantics:
  // already-signed-in staff are redirected to the dashboard,
  // preserving any ``state.from`` so the existing return-to-where-
  // you-were behaviour keeps working through ``LoginPage``.
  if (isStaffAuthed) {
    return <Navigate to={ROUTES.DASHBOARD} state={location.state} replace />
  }
  return <LoginPage />
}
