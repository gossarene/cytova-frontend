import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import type { ApiResponse } from '@/lib/api/types'
import type {
  DashboardOverview, DashboardPatients, DashboardRequests,
  DashboardResults, DashboardStock, DashboardAlerts, DashboardProcurement,
  DashboardCockpit, DashboardAnalytics, DashboardSetupProgress,
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

export function useDashboardCockpit() {
  return useDashboardQuery<DashboardCockpit>('cockpit', 'cockpit')
}

export function useDashboardAnalytics() {
  return useDashboardQuery<DashboardAnalytics>('analytics', 'analytics')
}

/** Stable query key for the setup-progress endpoint. Exported so
 *  mutations across modules (lab settings, catalog, partners, users)
 *  can call ``qc.invalidateQueries({ queryKey: SETUP_PROGRESS_QUERY_KEY })``
 *  after a write — the OnboardingBanner observes this query and
 *  re-renders automatically when it refetches. */
export const SETUP_PROGRESS_QUERY_KEY = ['dashboard', 'setup-progress'] as const

/** Returns ``null`` for non-LAB_ADMIN users — the hook surfaces that
 *  through ``data === null``, so the consumer can branch on it. */
export function useDashboardSetupProgress() {
  return useDashboardQuery<DashboardSetupProgress | null>(
    'setup-progress',
    'setup-progress',
  )
}
