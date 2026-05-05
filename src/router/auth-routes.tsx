import type { RouteObject } from 'react-router-dom'
import { AuthLayout } from '@/layouts/AuthLayout'
import { GuestGuard } from '@/guards/GuestGuard'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { LoginRouteSwitch } from './LoginRouteSwitch'
import { ROUTES } from '@/config/routes'

// Staff vs patient login dispatch
// --------------------------------
// ``/login`` is host-aware via ``LoginRouteSwitch``:
//   - tenant subdomain  → staff ``LoginPage`` (existing behaviour)
//   - public/main host  → ``PatientLoginPage``
//
// The switch handles the GuestGuard equivalent for both branches
// internally (each branch has its own auth store), so ``/login`` is
// NOT wrapped in the staff-only ``GuestGuard`` — that guard would
// incorrectly redirect away from the public-host patient login the
// moment any leftover staff session existed in storage. The other
// auth pages (forgot/reset password) are staff-only and stay under
// the guard.
export const authRoutes: RouteObject[] = [
  {
    element: <AuthLayout />,
    children: [
      // Host-aware login. Lives outside the staff-only GuestGuard
      // because the public-host branch must work regardless of
      // staff-session state.
      { path: ROUTES.LOGIN, element: <LoginRouteSwitch /> },
      {
        element: <GuestGuard />,
        children: [
          { path: ROUTES.FORGOT_PASSWORD, element: <ForgotPasswordPage /> },
          { path: ROUTES.RESET_PASSWORD, element: <ResetPasswordPage /> },
        ],
      },
    ],
  },
]
