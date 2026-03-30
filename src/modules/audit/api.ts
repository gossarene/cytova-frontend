import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import type { ApiResponse } from '@/lib/api/types'
import type { AuditLogEntry } from './types'

export function useAuditLogs(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['audit', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AuditLogEntry[]>>('/audit/', { params })
      return data
    },
  })
}
