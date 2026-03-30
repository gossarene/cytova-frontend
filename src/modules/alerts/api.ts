import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import type { ApiResponse } from '@/lib/api/types'
import type { AlertListItem, AlertDetail, AlertSummaryItem } from './types'

export function useAlerts(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['alerts', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AlertListItem[]>>('/alerts/', { params })
      return data
    },
  })
}

export function useAlert(id: string) {
  return useQuery({
    queryKey: ['alerts', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AlertDetail>>(`/alerts/${id}/`)
      return data.data
    },
    enabled: !!id,
  })
}

export function useAlertSummary() {
  return useQuery({
    queryKey: ['alerts', 'summary'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AlertSummaryItem[]>>('/alerts/summary/')
      return data.data
    },
    staleTime: 60_000,
  })
}

export function useAcknowledgeAlert(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiResponse<AlertDetail>>(`/alerts/${id}/acknowledge/`)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useResolveAlert(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiResponse<AlertDetail>>(`/alerts/${id}/resolve/`)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useBulkAcknowledge() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (alertIds: string[]) => {
      const { data } = await api.post<ApiResponse<{ acknowledged: number }>>('/alerts/bulk-acknowledge/', {
        alert_ids: alertIds,
      })
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
