import type { RouteObject } from 'react-router-dom'
import { PublicLayout } from '@/layouts/PublicLayout'
import { HomePage } from '@/pages/public/HomePage'
import { PricingPage } from '@/pages/public/PricingPage'
import { AboutPage } from '@/pages/public/AboutPage'
import { ContactPage } from '@/pages/public/ContactPage'
import { SignupPage } from '@/pages/public/SignupPage'
import { ROUTES } from '@/config/routes'

export const publicRoutes: RouteObject[] = [
  {
    element: <PublicLayout />,
    children: [
      { path: ROUTES.HOME, element: <HomePage /> },
      { path: ROUTES.PRICING, element: <PricingPage /> },
      { path: ROUTES.ABOUT, element: <AboutPage /> },
      { path: ROUTES.CONTACT, element: <ContactPage /> },
      { path: ROUTES.SIGNUP, element: <SignupPage /> },
    ],
  },
]
