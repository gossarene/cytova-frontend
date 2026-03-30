// GET /dashboard/overview/
export interface DashboardOverview {
  patients: {
    total_active: number
    registered_this_month: number
  }
  requests: {
    active: number
    created_this_month: number
    total: number
    from_partners: number
    from_direct: number
  }
  results: {
    pending_validation: number
    published_this_month: number
  }
  stock: {
    below_threshold: number
    out_of_stock: number
    expiring_soon: number
  }
  alerts: {
    total_open: number
    critical: number
  }
  procurement: {
    pending_orders: number
  }
}

// GET /dashboard/patients/
export interface DashboardPatients {
  total: number
  active: number
  inactive: number
  registered_today: number
  registered_this_week: number
  registered_this_month: number
}

// GET /dashboard/requests/
export interface DashboardRequests {
  by_status: Record<string, number>
  total: number
  created_today: number
  created_this_week: number
  created_this_month: number
  by_source_type: Record<string, number>
  by_billing_mode: Record<string, number>
  items: {
    by_status: Record<string, number>
    by_execution_mode: Record<string, number>
  }
}

// GET /dashboard/results/
export interface DashboardResults {
  by_status: Record<string, number>
  total: number
  abnormal_published: number
  published_today: number
  published_this_week: number
  published_this_month: number
}

// GET /dashboard/stock/
export interface DashboardStock {
  total_active_items: number
  below_threshold: number
  out_of_stock: number
  total_active_lots: number
  expiring_soon: number
  expiring_soon_window_days: number
  expired: number
}

// GET /dashboard/alerts/
export interface DashboardAlerts {
  total_open: number
  by_type: Record<string, number>
  by_severity: Record<string, number>
  by_status: Record<string, number>
}

// GET /dashboard/procurement/
export interface DashboardProcurement {
  orders_by_status: Record<string, number>
  orders_total: number
  pending_reception: number
  overdue: number
  receptions_this_month: number
  receptions_with_discrepancy_this_month: number
}
