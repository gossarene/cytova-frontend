/**
 * Permission codes mirroring the backend registry (common/permissions_registry.py).
 * Use these instead of raw strings for type safety and refactoring support.
 */
export const P = {
  // Patients
  PATIENTS_VIEW: 'patients.view',
  PATIENTS_CREATE: 'patients.create',
  PATIENTS_UPDATE: 'patients.update',
  PATIENTS_DEACTIVATE: 'patients.deactivate',
  PATIENTS_UPDATE_IDENTITY: 'patients.update_identity',
  PATIENTS_MANAGE_PORTAL: 'patients.manage_portal',

  // Catalog
  CATALOG_VIEW: 'catalog.view',
  CATALOG_MANAGE: 'catalog.manage',

  // Pricing
  PRICING_VIEW: 'pricing.view',
  PRICING_MANAGE: 'pricing.manage',

  // Analysis Requests
  REQUESTS_VIEW: 'requests.view',
  REQUESTS_CREATE: 'requests.create',
  REQUESTS_UPDATE: 'requests.update',
  REQUESTS_CONFIRM: 'requests.confirm',
  REQUESTS_CANCEL: 'requests.cancel',
  REQUESTS_FINALIZE: 'requests.finalize_validation',

  // Results
  RESULTS_VIEW: 'results.view',
  RESULTS_CREATE: 'results.create',
  RESULTS_UPDATE: 'results.update',
  RESULTS_SUBMIT: 'results.submit',
  RESULTS_VALIDATE: 'results.validate',
  RESULTS_REJECT: 'results.reject',
  RESULTS_PUBLISH: 'results.publish',

  // Partners
  PARTNERS_VIEW: 'partners.view',
  PARTNERS_MANAGE: 'partners.manage',

  // Stock
  STOCK_VIEW: 'stock.view',
  STOCK_MANAGE: 'stock.manage',

  // Suppliers
  SUPPLIERS_VIEW: 'suppliers.view',
  SUPPLIERS_MANAGE: 'suppliers.manage',

  // Procurement
  PROCUREMENT_VIEW: 'procurement.view',
  PROCUREMENT_MANAGE: 'procurement.manage',

  // Alerts
  ALERTS_VIEW: 'alerts.view',
  ALERTS_ACKNOWLEDGE: 'alerts.acknowledge',

  // Users
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DEACTIVATE: 'users.deactivate',
  USERS_ACTIVATE: 'users.activate',
  USERS_ASSIGN_ROLE: 'users.assign_role',
  USERS_MANAGE_PERMISSIONS: 'users.manage_permissions',

  // Audit
  AUDIT_VIEW: 'audit.view',

  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',

  // Files
  FILES_VIEW: 'files.view',
  FILES_UPLOAD: 'files.upload',

  // Billing
  BILLING_VIEW: 'billing.view',
  BILLING_MANAGE: 'billing.manage',

  // Inventory
  INVENTORY_REPORTS: 'inventory.reports',

  // Settings
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_MANAGE: 'settings.manage',
} as const

export type PermissionCode = (typeof P)[keyof typeof P]
