import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import type { ApiResponse } from '@/lib/api/types'
import type { AuditLogPage } from './types'

/** Fetch one page of audit logs. Uses ``keepPreviousData`` so paging
 *  + filter changes don't blank the table out — the previous page
 *  stays visible until the new one loads. */
export function useAuditLogs(params?: Record<string, string | number | undefined>) {
  // Strip ``undefined`` / empty params before sending so the server
  // sees a clean shape (e.g. omit the ``search`` key when empty rather
  // than ``search=``, which would otherwise still hit the search filter).
  const cleaned: Record<string, string> = {}
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v === undefined || v === null) continue
    const s = String(v)
    if (s === '') continue
    cleaned[k] = s
  }
  return useQuery({
    queryKey: ['audit', cleaned],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AuditLogPage>>('/audit/', { params: cleaned })
      return data
    },
    placeholderData: keepPreviousData,
  })
}
