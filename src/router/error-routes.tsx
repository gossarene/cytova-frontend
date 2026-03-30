import type { RouteObject } from 'react-router-dom'
import { NotFoundPage } from '@/pages/errors/NotFoundPage'
import { ForbiddenPage } from '@/pages/errors/ForbiddenPage'
import { ROUTES } from '@/config/routes'

export const errorRoutes: RouteObject[] = [
  { path: ROUTES.FORBIDDEN, element: <ForbiddenPage /> },
  { path: '*', element: <NotFoundPage /> },
]
