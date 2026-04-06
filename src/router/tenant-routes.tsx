import { lazy, Suspense } from 'react'
import type { RouteObject } from 'react-router-dom'
import { AuthGuard } from '@/guards/AuthGuard'
import { SubscriptionGuard } from '@/guards/SubscriptionGuard'
import { PermissionGuard } from '@/guards/PermissionGuard'
import { TenantLayout } from '@/layouts/TenantLayout'
import { P } from '@/lib/permissions/constants'
import { ROUTES } from '@/config/routes'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'

// Lazy-loaded module pages
const DashboardPage = lazy(() =>
  import('@/modules/dashboard/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const PatientListPage = lazy(() =>
  import('@/modules/patients/pages/PatientListPage').then((m) => ({ default: m.PatientListPage })),
)
const PatientCreatePage = lazy(() =>
  import('@/modules/patients/pages/PatientCreatePage').then((m) => ({ default: m.PatientCreatePage })),
)
const CatalogPage = lazy(() =>
  import('@/modules/catalog/pages/CatalogPage').then((m) => ({ default: m.CatalogPage })),
)
const ExamDetailPage = lazy(() =>
  import('@/modules/catalog/pages/ExamDetailPage').then((m) => ({ default: m.ExamDetailPage })),
)
const PatientDetailPage = lazy(() =>
  import('@/modules/patients/pages/PatientDetailPage').then((m) => ({ default: m.PatientDetailPage })),
)
const PartnerListPage = lazy(() =>
  import('@/modules/partners/pages/PartnerListPage').then((m) => ({ default: m.PartnerListPage })),
)
const PartnerCreatePage = lazy(() =>
  import('@/modules/partners/pages/PartnerCreatePage').then((m) => ({ default: m.PartnerCreatePage })),
)
const PartnerDetailPage = lazy(() =>
  import('@/modules/partners/pages/PartnerDetailPage').then((m) => ({ default: m.PartnerDetailPage })),
)
const RequestListPage = lazy(() =>
  import('@/modules/requests/pages/RequestListPage').then((m) => ({ default: m.RequestListPage })),
)
const RequestCreatePage = lazy(() =>
  import('@/modules/requests/pages/RequestCreatePage').then((m) => ({ default: m.RequestCreatePage })),
)
const RequestDetailPage = lazy(() =>
  import('@/modules/requests/pages/RequestDetailPage').then((m) => ({ default: m.RequestDetailPage })),
)
const ResultListPage = lazy(() =>
  import('@/modules/results/pages/ResultListPage').then((m) => ({ default: m.ResultListPage })),
)
const ResultDetailPage = lazy(() =>
  import('@/modules/results/pages/ResultDetailPage').then((m) => ({ default: m.ResultDetailPage })),
)
const StockListPage = lazy(() =>
  import('@/modules/stock/pages/StockListPage').then((m) => ({ default: m.StockListPage })),
)
const StockItemDetailPage = lazy(() =>
  import('@/modules/stock/pages/StockItemDetailPage').then((m) => ({ default: m.StockItemDetailPage })),
)
const MovementsPage = lazy(() =>
  import('@/modules/stock/pages/MovementsPage').then((m) => ({ default: m.MovementsPage })),
)
const SupplierListPage = lazy(() =>
  import('@/modules/suppliers/pages/SupplierListPage').then((m) => ({ default: m.SupplierListPage })),
)
const SupplierDetailPage = lazy(() =>
  import('@/modules/suppliers/pages/SupplierDetailPage').then((m) => ({ default: m.SupplierDetailPage })),
)
const POListPage = lazy(() =>
  import('@/modules/suppliers/pages/POListPage').then((m) => ({ default: m.POListPage })),
)
const PODetailPage = lazy(() =>
  import('@/modules/suppliers/pages/PODetailPage').then((m) => ({ default: m.PODetailPage })),
)
const AlertListPage = lazy(() =>
  import('@/modules/alerts/pages/AlertListPage').then((m) => ({ default: m.AlertListPage })),
)
const UserListPage = lazy(() =>
  import('@/modules/users/pages/UserListPage').then((m) => ({ default: m.UserListPage })),
)
const UserCreatePage = lazy(() =>
  import('@/modules/users/pages/UserCreatePage').then((m) => ({ default: m.UserCreatePage })),
)
const UserDetailPage = lazy(() =>
  import('@/modules/users/pages/UserDetailPage').then((m) => ({ default: m.UserDetailPage })),
)
const AuditLogPage = lazy(() =>
  import('@/modules/audit/pages/AuditLogPage').then((m) => ({ default: m.AuditLogPage })),
)
const SettingsPage = lazy(() =>
  import('@/modules/settings/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
)
const ProfilePage = lazy(() =>
  import('@/pages/auth/ProfilePage').then((m) => ({ default: m.ProfilePage })),
)

function Loading() {
  return (
    <div className="p-6">
      <TableSkeleton />
    </div>
  )
}

function lazyPage(Component: React.LazyExoticComponent<React.ComponentType>) {
  return (
    <Suspense fallback={<Loading />}>
      <Component />
    </Suspense>
  )
}

export const tenantRoutes: RouteObject[] = [
  {
    element: <AuthGuard />,
    children: [
      {
        element: <SubscriptionGuard />,
        children: [
          {
            element: <TenantLayout />,
            children: [
              // Dashboard — accessible to all authenticated users
              { path: ROUTES.DASHBOARD, element: lazyPage(DashboardPage) },

              // Profile — accessible to all authenticated users (personal account, not admin)
              { path: ROUTES.PROFILE, element: lazyPage(ProfilePage) },

              // Patients
              {
                element: <PermissionGuard permission={P.PATIENTS_VIEW} />,
                children: [
                  { path: ROUTES.PATIENTS, element: lazyPage(PatientListPage) },
                  { path: ROUTES.PATIENT_DETAIL, element: lazyPage(PatientDetailPage) },
                ],
              },
              {
                element: <PermissionGuard permission={P.PATIENTS_CREATE} />,
                children: [
                  { path: ROUTES.PATIENT_NEW, element: lazyPage(PatientCreatePage) },
                ],
              },

              // Requests
              {
                element: <PermissionGuard permission={P.REQUESTS_VIEW} />,
                children: [
                  { path: ROUTES.REQUESTS, element: lazyPage(RequestListPage) },
                  { path: ROUTES.REQUEST_DETAIL, element: lazyPage(RequestDetailPage) },
                ],
              },
              {
                element: <PermissionGuard permission={P.REQUESTS_CREATE} />,
                children: [
                  { path: ROUTES.REQUEST_NEW, element: lazyPage(RequestCreatePage) },
                ],
              },

              // Results
              {
                element: <PermissionGuard permission={P.RESULTS_VIEW} />,
                children: [
                  { path: ROUTES.RESULTS, element: lazyPage(ResultListPage) },
                  { path: ROUTES.RESULT_DETAIL, element: lazyPage(ResultDetailPage) },
                ],
              },

              // Catalog
              {
                element: <PermissionGuard permission={P.CATALOG_VIEW} />,
                children: [
                  { path: ROUTES.CATALOG, element: lazyPage(CatalogPage) },
                  { path: ROUTES.CATALOG_EXAM, element: lazyPage(ExamDetailPage) },
                ],
              },

              // Stock
              {
                element: <PermissionGuard permission={P.STOCK_VIEW} />,
                children: [
                  { path: ROUTES.STOCK, element: lazyPage(StockListPage) },
                  { path: ROUTES.STOCK_DETAIL, element: lazyPage(StockItemDetailPage) },
                  { path: ROUTES.STOCK_MOVEMENTS, element: lazyPage(MovementsPage) },
                ],
              },

              // Suppliers
              {
                element: <PermissionGuard permission={P.SUPPLIERS_VIEW} />,
                children: [
                  { path: ROUTES.SUPPLIERS, element: lazyPage(SupplierListPage) },
                  { path: ROUTES.SUPPLIER_DETAIL, element: lazyPage(SupplierDetailPage) },
                ],
              },

              // Procurement
              {
                element: <PermissionGuard permission={P.PROCUREMENT_VIEW} />,
                children: [
                  { path: ROUTES.PROCUREMENT, element: lazyPage(POListPage) },
                  { path: ROUTES.PROCUREMENT_DETAIL, element: lazyPage(PODetailPage) },
                ],
              },

              // Partners
              {
                element: <PermissionGuard permission={P.PARTNERS_VIEW} />,
                children: [
                  { path: ROUTES.PARTNERS, element: lazyPage(PartnerListPage) },
                  { path: ROUTES.PARTNER_DETAIL, element: lazyPage(PartnerDetailPage) },
                ],
              },
              {
                element: <PermissionGuard permission={P.PARTNERS_MANAGE} />,
                children: [
                  { path: ROUTES.PARTNER_NEW, element: lazyPage(PartnerCreatePage) },
                ],
              },

              // Alerts
              {
                element: <PermissionGuard permission={P.ALERTS_VIEW} />,
                children: [
                  { path: ROUTES.ALERTS, element: lazyPage(AlertListPage) },
                ],
              },

              // Users
              {
                element: <PermissionGuard permission={P.USERS_VIEW} />,
                children: [
                  { path: ROUTES.USERS, element: lazyPage(UserListPage) },
                  { path: ROUTES.USER_DETAIL, element: lazyPage(UserDetailPage) },
                ],
              },
              {
                element: <PermissionGuard permission={P.USERS_CREATE} />,
                children: [
                  { path: ROUTES.USER_NEW, element: lazyPage(UserCreatePage) },
                ],
              },

              // Audit
              {
                element: <PermissionGuard permission={P.AUDIT_VIEW} />,
                children: [
                  { path: ROUTES.AUDIT, element: lazyPage(AuditLogPage) },
                ],
              },

              // Settings
              {
                element: <PermissionGuard permission={P.SETTINGS_VIEW} />,
                children: [
                  { path: ROUTES.SETTINGS, element: lazyPage(SettingsPage) },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]

