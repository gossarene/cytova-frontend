import type { RouteObject } from 'react-router-dom'
import { PatientAuthGuard } from '@/guards/PatientAuthGuard'
import { PatientDashboardPage } from '@/pages/patient/PatientDashboardPage'
import { PatientResultsPage } from '@/pages/patient/PatientResultsPage'
import { ROUTES } from '@/config/routes'

/**
 * Routes for the authenticated patient portal.
 *
 * Mounted at top-level (no shared layout) so the patient experience
 * is visually distinct from the lab tenant app — each page brings its
 * own header. The guard sits at the segment root so adding future
 * patient-only pages under ``/patient/...`` automatically inherits the
 * auth check.
 */
export const patientRoutes: RouteObject[] = [
  {
    element: <PatientAuthGuard />,
    children: [
      { path: ROUTES.PATIENT_DASHBOARD, element: <PatientDashboardPage /> },
      { path: ROUTES.PATIENT_RESULTS, element: <PatientResultsPage /> },
    ],
  },
]
