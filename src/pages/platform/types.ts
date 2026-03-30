// -- Tenant --

export interface TenantListItem {
  id: string
  name: string
  subdomain: string
  plan: string
  is_active: boolean
  subscription_status: string | null
  subscription_plan: string | null
  created_at: string
}

export interface TenantDomain {
  domain: string
  is_primary: boolean
}

export interface TenantSubscription {
  id: string
  plan_code: string
  plan_name: string
  status: SubscriptionStatus
  started_at: string
  trial_end_date: string | null
  current_period_end: string | null
  trial_days_remaining: number | null
  is_usable: boolean
}

export interface TenantDetail {
  id: string
  name: string
  subdomain: string
  schema_name: string
  plan: string
  is_active: boolean
  created_at: string
  activated_at: string | null
  suspended_at: string | null
  domains: TenantDomain[]
  active_subscription: TenantSubscription | null
}

export interface TenantCreateRequest {
  name: string
  subdomain: string
  plan?: string
}

// -- Subscription --

export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED'

export interface SubscriptionListItem {
  id: string
  tenant_id: string
  tenant_name: string
  tenant_subdomain: string
  plan_id: string
  plan_code: string
  plan_name: string
  status: SubscriptionStatus
  started_at: string
  trial_end_date: string | null
  current_period_end: string | null
  trial_days_remaining: number | null
  created_at: string
}

export interface SubscriptionPlanInline {
  id: string
  code: string
  name: string
  description: string
  is_trial: boolean
  is_public: boolean
  trial_duration_days: number | null
  monthly_price: string | null
  yearly_price: string | null
  display_order: number
  is_active: boolean
  created_at: string
}

export interface SubscriptionDetail {
  id: string
  tenant_id: string
  tenant_name: string
  tenant_subdomain: string
  plan: SubscriptionPlanInline
  status: SubscriptionStatus
  started_at: string
  trial_end_date: string | null
  current_period_end: string | null
  activated_at: string | null
  suspended_at: string | null
  cancelled_at: string | null
  cancelled_by: string
  trial_days_remaining: number | null
  is_usable: boolean
  notes: string
  created_at: string
  updated_at: string
}

// -- Plans --

export interface PlanListItem {
  id: string
  code: string
  name: string
  description: string
  is_trial: boolean
  is_public: boolean
  trial_duration_days: number | null
  monthly_price: string | null
  yearly_price: string | null
  display_order: number
  is_active: boolean
  created_at: string
}

// -- Dashboard --

export interface PlatformDashboardData {
  tenants: {
    total: number
    active: number
    suspended: number
  }
  subscriptions: {
    by_status: Record<SubscriptionStatus, number>
    no_subscription: number
    trials_expiring_soon: number
  }
  plan_distribution: Record<string, number>
}
