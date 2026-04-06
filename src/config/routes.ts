export const ROUTES = {
  // Public
  HOME: '/',
  PRICING: '/pricing',
  ABOUT: '/about',
  CONTACT: '/contact',
  SIGNUP: '/signup',

  // Auth
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  // Tenant App
  DASHBOARD: '/dashboard',
  PATIENTS: '/patients',
  PATIENT_NEW: '/patients/new',
  PATIENT_DETAIL: '/patients/:id',
  REQUESTS: '/requests',
  REQUEST_NEW: '/requests/new',
  REQUEST_DETAIL: '/requests/:id',
  RESULTS: '/results',
  RESULT_DETAIL: '/results/:id',
  CATALOG: '/catalog',
  CATALOG_EXAM: '/catalog/exams/:id',
  STOCK: '/stock',
  STOCK_DETAIL: '/stock/:id',
  STOCK_MOVEMENTS: '/stock/movements',
  SUPPLIERS: '/suppliers',
  SUPPLIER_NEW: '/suppliers/new',
  SUPPLIER_DETAIL: '/suppliers/:id',
  PROCUREMENT: '/procurement',
  PROCUREMENT_NEW: '/procurement/new',
  PROCUREMENT_DETAIL: '/procurement/:id',
  PARTNERS: '/partners',
  PARTNER_NEW: '/partners/new',
  PARTNER_DETAIL: '/partners/:id',
  ALERTS: '/alerts',
  USERS: '/users',
  USER_NEW: '/users/new',
  USER_DETAIL: '/users/:id',
  AUDIT: '/audit',
  SETTINGS: '/settings',
  PROFILE: '/profile',

  // Platform Admin
  PLATFORM_LOGIN: '/platform/login',
  PLATFORM_DASHBOARD: '/platform/dashboard',
  PLATFORM_TENANTS: '/platform/tenants',
  PLATFORM_TENANT_DETAIL: '/platform/tenants/:id',
  PLATFORM_PLANS: '/platform/plans',
  PLATFORM_SUBSCRIPTIONS: '/platform/subscriptions',
  PLATFORM_SUBSCRIPTION_DETAIL: '/platform/subscriptions/:id',

  // Errors
  FORBIDDEN: '/403',
} as const
