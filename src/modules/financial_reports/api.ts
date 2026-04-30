import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import type { ApiResponse } from '@/lib/api/types'
import type { FinancialReportFilters, FinancialReportResponse } from './types'

/** Run the simulation and get the JSON payload (summary + rows + charts).
 *  Implemented as a mutation rather than a query because it's user-driven
 *  ("Generate preview" button) and not expected to auto-refetch. */
export function useFinancialReportPreview() {
  return useMutation({
    mutationFn: async (payload: FinancialReportFilters) => {
      const { data } = await api.post<ApiResponse<FinancialReportResponse>>(
        '/financial-reports/preview/',
        payload,
      )
      return data.data
    },
  })
}

/** Trigger the PDF export. Returns the raw blob plus a suggested
 *  filename pulled from the Content-Disposition header. */
export function useFinancialReportExport() {
  return useMutation({
    mutationFn: async (payload: FinancialReportFilters) => {
      const resp = await api.post<Blob>(
        '/financial-reports/export/',
        payload,
        { responseType: 'blob' },
      )
      // Pull the filename hint from Content-Disposition; fall back to a
      // sensible default keyed on the period.
      const cd = resp.headers?.['content-disposition'] as string | undefined
      const match = cd?.match(/filename="?([^";]+)"?/i)
      const filename = match?.[1]
        ?? `financial-statement-${payload.period_start}_${payload.period_end}.pdf`
      return { blob: resp.data, filename }
    },
  })
}
