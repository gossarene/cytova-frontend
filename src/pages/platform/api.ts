import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { platformApi } from '@/lib/api/platform-client'
import type { ApiResponse } from '@/lib/api/types'
import type {
  TenantListItem, TenantDetail, TenantCreateRequest,
  SubscriptionListItem, SubscriptionDetail,
  PlanListItem, PlatformDashboardData,
} from './types'

// ============================================================
// Dashboard
// ============================================================

export function usePlatformDashboard() {
  return useQuery({
    queryKey: ['platform', 'dashboard'],
    queryFn: async () => {
      const { data } = await platformApi.get<ApiResponse<PlatformDashboardData>>('/dashboard/')
      return data.data
    },
  })
}

// ============================================================
// Tenants
// ============================================================

export function useTenants(params?: { search?: string; is_active?: string; plan?: string }) {
  return useQuery({
    queryKey: ['platform', 'tenants', params],
    queryFn: async () => {
      const { data } = await platformApi.get<ApiResponse<TenantListItem[]>>('/tenants/', { params })
      return data
    },
  })
}

export function useTenant(id: string) {
  return useQuery({
    queryKey: ['platform', 'tenants', id],
    queryFn: async () => {
      const { data } = await platformApi.get<ApiResponse<TenantDetail>>(`/tenants/${id}/`)
      return data.data
    },
    enabled: !!id,
  })
}

export function useCreateTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: TenantCreateRequest) => {
      const { data } = await platformApi.post<ApiResponse<TenantDetail>>('/tenants/', payload)
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['platform', 'tenants'] }),
  })
}

export function useUpdateTenant(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name?: string; plan?: string }) => {
      const { data } = await platformApi.patch<ApiResponse<TenantDetail>>(`/tenants/${id}/`, payload)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform', 'tenants', id] })
      qc.invalidateQueries({ queryKey: ['platform', 'tenants'] })
    },
  })
}

export function useSuspendTenant(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await platformApi.post<ApiResponse<TenantDetail>>(`/tenants/${id}/suspend/`)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform', 'tenants', id] })
      qc.invalidateQueries({ queryKey: ['platform', 'tenants'] })
    },
  })
}

export function useActivateTenant(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await platformApi.post<ApiResponse<TenantDetail>>(`/tenants/${id}/activate/`)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform', 'tenants', id] })
      qc.invalidateQueries({ queryKey: ['platform', 'tenants'] })
    },
  })
}

// ============================================================
// Subscriptions
// ============================================================

export function useSubscriptions(params?: { status?: string; search?: string; tenant_id?: string }) {
  return useQuery({
    queryKey: ['platform', 'subscriptions', params],
    queryFn: async () => {
      const { data } = await platformApi.get<ApiResponse<SubscriptionListItem[]>>('/subscriptions/', { params })
      return data
    },
  })
}

export function useSubscription(id: string) {
  return useQuery({
    queryKey: ['platform', 'subscriptions', id],
    queryFn: async () => {
      const { data } = await platformApi.get<ApiResponse<SubscriptionDetail>>(`/subscriptions/${id}/`)
      return data.data
    },
    enabled: !!id,
  })
}

export function useActivateSubscription(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { period_months?: number; notes?: string }) => {
      const { data } = await platformApi.post<ApiResponse<SubscriptionDetail>>(`/subscriptions/${id}/activate/`, payload)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform', 'subscriptions'] })
      qc.invalidateQueries({ queryKey: ['platform', 'tenants'] })
      qc.invalidateQueries({ queryKey: ['platform', 'dashboard'] })
    },
  })
}

export function useSuspendSubscription(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload?: { reason?: string }) => {
      const { data } = await platformApi.post<ApiResponse<SubscriptionDetail>>(`/subscriptions/${id}/suspend/`, payload)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform', 'subscriptions'] })
      qc.invalidateQueries({ queryKey: ['platform', 'tenants'] })
      qc.invalidateQueries({ queryKey: ['platform', 'dashboard'] })
    },
  })
}

export function useReactivateSubscription(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await platformApi.post<ApiResponse<SubscriptionDetail>>(`/subscriptions/${id}/reactivate/`)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform', 'subscriptions'] })
      qc.invalidateQueries({ queryKey: ['platform', 'tenants'] })
      qc.invalidateQueries({ queryKey: ['platform', 'dashboard'] })
    },
  })
}

export function useCancelSubscription(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload?: { reason?: string }) => {
      const { data } = await platformApi.post<ApiResponse<SubscriptionDetail>>(`/subscriptions/${id}/cancel/`, payload)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform', 'subscriptions'] })
      qc.invalidateQueries({ queryKey: ['platform', 'tenants'] })
      qc.invalidateQueries({ queryKey: ['platform', 'dashboard'] })
    },
  })
}

export function useChangePlan(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { plan_id: string }) => {
      const { data } = await platformApi.post<ApiResponse<SubscriptionDetail>>(`/subscriptions/${id}/change-plan/`, payload)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform', 'subscriptions'] })
      qc.invalidateQueries({ queryKey: ['platform', 'tenants'] })
    },
  })
}

// ============================================================
// Plans
// ============================================================

export function usePlans(params?: { is_active?: string; search?: string }) {
  return useQuery({
    queryKey: ['platform', 'plans', params],
    queryFn: async () => {
      const { data } = await platformApi.get<ApiResponse<PlanListItem[]>>('/plans/', { params })
      return data
    },
  })
}
