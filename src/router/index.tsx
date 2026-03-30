import { createBrowserRouter } from 'react-router-dom'
import { publicRoutes } from './public-routes'
import { authRoutes } from './auth-routes'
import { tenantRoutes } from './tenant-routes'
import { platformRoutes } from './platform-routes'
import { errorRoutes } from './error-routes'

export const router = createBrowserRouter([
  ...publicRoutes,
  ...authRoutes,
  ...tenantRoutes,
  ...platformRoutes,
  ...errorRoutes,
])
