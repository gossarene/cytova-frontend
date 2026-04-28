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


// ---------------------------------------------------------------------------
// GET /dashboard/cockpit/
// Role-aware payload — KPIs/actions vary per role; chart series are global.
// ---------------------------------------------------------------------------

export type DashboardTone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral'

export interface DashboardKpi {
  key: string
  label: string
  value: number | string  // string for monetary values (e.g. "1234.56")
  icon: string            // semantic name; resolved by frontend → Lucide
  tone: DashboardTone
  href: string | null
}

export interface DashboardAction {
  key: string
  title: string
  count: number
  description: string
  cta: string
  href: string
  tone: DashboardTone
}

// ---------------------------------------------------------------------------
// GET /dashboard/setup-progress/
// LAB_ADMIN-only onboarding checklist. Returns ``null`` for other roles.
// ---------------------------------------------------------------------------

export interface SetupProgressTask {
  key: string
  label: string
  description: string
  completed: boolean
  required: boolean
  href: string
}

export interface SetupNextStep {
  /** Stable key — same vocabulary as ``SetupProgressTask.key``. */
  key: string
  /** Imperative CTA label, e.g. "Add your first exam". */
  label: string
  /** Target route. */
  url: string
}

export interface DashboardSetupProgress {
  /** Required-task completion only — recommended tasks cannot block 100%. */
  percentage: number
  /** Across all tasks (incl. recommended). */
  completed_count: number
  total_count: number
  tasks: SetupProgressTask[]
  /** First incomplete required task; falls back to first incomplete
   *  recommended once required is done. ``null`` when everything is green
   *  — the frontend uses null as the trigger for the go-live state. */
  next_step: SetupNextStep | null
}


// ---------------------------------------------------------------------------
// GET /dashboard/analytics/
// Ranked insights for the Analytics row (top exams / top partners / abnormal).
// All series are scoped to the current month on the backend.
// ---------------------------------------------------------------------------

export interface RankedExam {
  code: string
  name: string
  count: number
}

export interface RankedPartner {
  name: string
  /** Total billed in the period — sent as a string-encoded decimal. */
  amount: string
  /** Distinct request count in the period. */
  requests: number
}

export interface AbnormalExam {
  code: string
  name: string
  /** Number of abnormal published results this period. */
  count: number
  /** Total published results for this exam this period (denominator). */
  total: number
}

export interface DashboardAnalytics {
  top_exams: RankedExam[]
  top_partners: RankedPartner[]
  abnormal_exams: AbnormalExam[]
}


export interface DashboardCockpit {
  role: string
  greeting_name: string
  kpis: DashboardKpi[]
  actions: DashboardAction[]
  charts: {
    requests_over_time: { date: string; count: number }[]
    requests_by_status: { status: string; count: number }[]
    requests_by_source: { source: string; count: number }[]
    results_pipeline:   { status: string; count: number }[]
  }
}
