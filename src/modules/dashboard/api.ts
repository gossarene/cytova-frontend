import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import type { ApiResponse } from '@/lib/api/types'
import type {
  DashboardOverview, DashboardPatients, DashboardRequests,
  DashboardResults, DashboardStock, DashboardAlerts, DashboardProcurement,
} from './types'

function useDashboardQuery<T>(key: string, path: string) {
  return useQuery({
    queryKey: ['dashboard', key],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<T>>(`/dashboard/${path}/`)
      return data.data
    },
    staleTime: 60_000, // 1 minute — dashboard data doesn't need sub-second freshness
    refetchOnWindowFocus: true,
  })
}

export function useDashboardOverview() {
  return useDashboardQuery<DashboardOverview>('overview', 'overview')
}

export function useDashboardPatients() {
  return useDashboardQuery<DashboardPatients>('patients', 'patients')
}

export function useDashboardRequests() {
  return useDashboardQuery<DashboardRequests>('requests', 'requests')
}

export function useDashboardResults() {
  return useDashboardQuery<DashboardResults>('results', 'results')
}

export function useDashboardStock() {
  return useDashboardQuery<DashboardStock>('stock', 'stock')
}

export function useDashboardAlerts() {
  return useDashboardQuery<DashboardAlerts>('alerts', 'alerts')
}

export function useDashboardProcurement() {
  return useDashboardQuery<DashboardProcurement>('procurement', 'procurement')
}
