import { createBrowserRouter } from 'react-router-dom'
import { RouteError } from '@/components/shared/RouteError'
import { publicRoutes } from './public-routes'
import { authRoutes } from './auth-routes'
import { tenantRoutes } from './tenant-routes'
import { platformRoutes } from './platform-routes'
import { errorRoutes } from './error-routes'

export const router = createBrowserRouter([
  {
    errorElement: <RouteError />,
    children: [
      ...publicRoutes,
      ...authRoutes,
      ...tenantRoutes,
      ...platformRoutes,
      ...errorRoutes,
    ],
  },
])
