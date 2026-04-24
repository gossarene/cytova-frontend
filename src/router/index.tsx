import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { RouteError } from '@/components/shared/RouteError'
import { publicRoutes } from './public-routes'
import { authRoutes } from './auth-routes'
import { tenantRoutes } from './tenant-routes'
import { platformRoutes } from './platform-routes'
import { errorRoutes } from './error-routes'

const ResultAccessPage = lazy(() =>
  import('@/pages/ResultAccessPage').then((m) => ({ default: m.ResultAccessPage })),
)

export const router = createBrowserRouter([
  {
    errorElement: <RouteError />,
    children: [
      {
        path: '/results/access/:token',
        element: (
          <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p>Loading...</p></div>}>
            <ResultAccessPage />
          </Suspense>
        ),
      },
      ...publicRoutes,
      ...authRoutes,
      ...tenantRoutes,
      ...platformRoutes,
      ...errorRoutes,
    ],
  },
])
