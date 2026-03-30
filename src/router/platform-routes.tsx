import type { RouteObject } from 'react-router-dom'
import { PlatformAuthGuard } from '@/guards/PlatformAuthGuard'

import { PlatformLayout } from '@/layouts/PlatformLayout'

import { PlatformLoginPage } from '@/pages/platform/PlatformLoginPage'
import { PlatformDashboardPage } from '@/pages/platform/PlatformDashboardPage'
import { TenantsListPage } from '@/pages/platform/TenantsListPage'
import { TenantDetailPage } from '@/pages/platform/TenantDetailPage'
import { SubscriptionsPage } from '@/pages/platform/SubscriptionsPage'
import { SubscriptionDetailPage } from '@/pages/platform/SubscriptionDetailPage'
import { PlansPage } from '@/pages/platform/PlansPage'
import { ROUTES } from '@/config/routes'

export const platformRoutes: RouteObject[] = [
  // Platform login (separate from tenant auth)
  {
    path: ROUTES.PLATFORM_LOGIN,
    element: <PlatformLoginPage />,
  },

  // Authenticated platform admin routes
  {
    element: <PlatformAuthGuard />,
    children: [
      {
        element: <PlatformLayout />,
        children: [
          { path: ROUTES.PLATFORM_DASHBOARD, element: <PlatformDashboardPage /> },
          { path: ROUTES.PLATFORM_TENANTS, element: <TenantsListPage /> },
          { path: ROUTES.PLATFORM_TENANT_DETAIL, element: <TenantDetailPage /> },
          { path: ROUTES.PLATFORM_SUBSCRIPTIONS, element: <SubscriptionsPage /> },
          { path: ROUTES.PLATFORM_SUBSCRIPTION_DETAIL, element: <SubscriptionDetailPage /> },
          { path: ROUTES.PLATFORM_PLANS, element: <PlansPage /> },
        ],
      },
    ],
  },
]
