import type { RouteObject } from 'react-router-dom'
import { PublicLayout } from '@/layouts/PublicLayout'
import { HomePage } from '@/pages/public/HomePage'
import { PricingPage } from '@/pages/public/PricingPage'
import { AboutPage } from '@/pages/public/AboutPage'
import { ContactPage } from '@/pages/public/ContactPage'
import { SignupChoicePage } from '@/pages/public/SignupChoicePage'
import { SignupPage } from '@/pages/public/SignupPage'
import { PatientSignupPage } from '@/pages/public/PatientSignupPage'
import { PatientLoginPage } from '@/pages/public/PatientLoginPage'
import { VerifyEmailPage } from '@/pages/public/VerifyEmailPage'
import { ROUTES } from '@/config/routes'

export const publicRoutes: RouteObject[] = [
  {
    element: <PublicLayout />,
    children: [
      { path: ROUTES.HOME, element: <HomePage /> },
      { path: ROUTES.PRICING, element: <PricingPage /> },
      { path: ROUTES.ABOUT, element: <AboutPage /> },
      { path: ROUTES.CONTACT, element: <ContactPage /> },
      // /signup is now an account-type chooser. The original lab
      // signup flow lives at /signup/lab — only the URL moved, the
      // page component is unchanged so there is no behaviour
      // regression for tenant onboarding.
      { path: ROUTES.SIGNUP, element: <SignupChoicePage /> },
      { path: ROUTES.SIGNUP_LAB, element: <SignupPage /> },
      { path: ROUTES.SIGNUP_PATIENT, element: <PatientSignupPage /> },
      // Patient portal authentication — login + email verification.
      // ``/login`` (staff) is unchanged; patients sign in at the
      // dedicated ``/login/patient`` URL so the two stores never see
      // each other's credentials.
      { path: ROUTES.LOGIN_PATIENT, element: <PatientLoginPage /> },
      { path: ROUTES.VERIFY_EMAIL, element: <VerifyEmailPage /> },
    ],
  },
]
