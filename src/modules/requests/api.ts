import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import type { ApiResponse } from '@/lib/api/types'
import type {
  RequestListItem, RequestDetail, RequestItemDetail,
  RequestCreatePayload, RequestItemInput,
  ResolvedItemPrice, SourceType,
  RequestLabelBatch,
} from './types'

// -- Requests --

export function useRequests(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['requests', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<RequestListItem[]>>('/requests/', { params })
      return data
    },
  })
}

export function useRequest(id: string) {
  return useQuery({
    queryKey: ['requests', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<RequestDetail>>(`/requests/${id}/`)
      return data.data
    },
    enabled: !!id,
  })
}

export function useCreateRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: RequestCreatePayload) => {
      const { data } = await api.post<ApiResponse<RequestDetail>>('/requests/', payload)
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['requests'] }),
  })
}

/**
 * Resolve pricing for a tentative (source, partner, exams) tuple WITHOUT
 * persisting anything. Used by the Step 3 recap of the request creation
 * wizard — both this hook and the final ``useCreateRequest`` call hit the
 * same backend ``RequestPricingResolver``, so the recap matches what will
 * be snapshotted into request items on confirmation.
 *
 * ``useQuery`` is used (not ``useMutation``) because the preview is
 * idempotent and we want React Query to cache per-parameter so that
 * going back to Step 2 and returning to Step 3 with the same selections
 * hits the cache instead of re-fetching.
 */
export function usePricingPreview(
  params: {
    source_type: SourceType
    partner_organization_id?: string | null
    exam_definition_ids: string[]
  },
  options?: { enabled?: boolean },
) {
  const sortedIds = [...params.exam_definition_ids].sort()
  return useQuery({
    queryKey: [
      'requests', 'preview-pricing',
      params.source_type,
      params.partner_organization_id ?? null,
      sortedIds,
    ],
    queryFn: async () => {
      const { data } = await api.post<ApiResponse<{ items: ResolvedItemPrice[] }>>(
        '/requests/preview-pricing/',
        {
          source_type: params.source_type,
          partner_organization_id: params.partner_organization_id || null,
          exam_definition_ids: params.exam_definition_ids,
        },
      )
      return data.data
    },
    enabled:
      (options?.enabled ?? true)
      && params.exam_definition_ids.length > 0
      && (
        params.source_type === 'DIRECT_PATIENT'
        || !!params.partner_organization_id
      ),
    staleTime: 30_000,
  })
}

export function useUpdateRequest(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.patch<ApiResponse<RequestDetail>>(`/requests/${id}/`, payload)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requests', id] })
      qc.invalidateQueries({ queryKey: ['requests'] })
    },
  })
}

export function useConfirmRequest(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiResponse<RequestDetail>>(`/requests/${id}/confirm/`)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requests', id] })
      qc.invalidateQueries({ queryKey: ['requests'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useFinalizeValidation(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiResponse<RequestDetail>>(`/requests/${id}/finalize-validation/`)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requests', id] })
      qc.invalidateQueries({ queryKey: ['requests'] })
      qc.invalidateQueries({ queryKey: ['results'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useCancelRequest(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiResponse<RequestDetail>>(`/requests/${id}/cancel/`)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requests', id] })
      qc.invalidateQueries({ queryKey: ['requests'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// -- Request items --

export function useRequestItems(requestId: string) {
  return useQuery({
    queryKey: ['requests', requestId, 'items'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<RequestItemDetail[]>>(`/requests/${requestId}/items/`)
      return data.data
    },
    enabled: !!requestId,
  })
}

export function useAddRequestItem(requestId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: RequestItemInput) => {
      const { data } = await api.post<ApiResponse<RequestItemDetail>>(
        `/requests/${requestId}/items/`, payload,
      )
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requests', requestId] })
    },
  })
}

export function useRemoveRequestItem(requestId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (itemId: string) => {
      await api.delete(`/requests/${requestId}/items/${itemId}/`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requests', requestId] })
    },
  })
}

export function useStartItem(requestId: string, itemId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiResponse<RequestItemDetail>>(
        `/requests/${requestId}/items/${itemId}/start/`,
      )
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['requests', requestId] }),
  })
}

export function useCompleteItem(requestId: string, itemId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiResponse<RequestItemDetail>>(
        `/requests/${requestId}/items/${itemId}/complete/`,
      )
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['requests', requestId] }),
  })
}

export function useMarkItemCollected(requestId: string, itemId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload?: { collection_notes?: string }) => {
      const { data } = await api.post<ApiResponse<RequestItemDetail>>(
        `/requests/${requestId}/items/${itemId}/mark-collected/`,
        payload ?? {},
      )
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requests', requestId] })
    },
  })
}

export function useRejectItem(requestId: string, itemId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (reason: string) => {
      const { data } = await api.post<ApiResponse<RequestItemDetail>>(
        `/requests/${requestId}/items/${itemId}/reject/`,
        { rejection_reason: reason },
      )
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['requests', requestId] }),
  })
}

// ============================================================
// Request Labels
//   GET  /requests/:id/labels/  → existing batch or 404
//   POST /requests/:id/labels/  → idempotent generate-or-get
//
// Both endpoints return the same Cytova envelope shape; the read hook
// treats a 404 as "no batch yet" and resolves to ``null`` so the UI
// can distinguish "not generated" from "loading" without swallowing
// other errors.
// ============================================================

export function useRequestLabels(requestId: string) {
  return useQuery({
    queryKey: ['requests', requestId, 'labels'],
    queryFn: async (): Promise<RequestLabelBatch | null> => {
      try {
        const { data } = await api.get<ApiResponse<RequestLabelBatch>>(
          `/requests/${requestId}/labels/`,
        )
        return data.data
      } catch (err) {
        const status = (err as { response?: { status?: number } })
          ?.response?.status
        if (status === 404) return null
        throw err
      }
    },
    enabled: !!requestId,
    // Signed URL in the response body has a short TTL — keep the query
    // result fresh so a click-to-download always uses a valid URL.
    staleTime: 60_000,
  })
}

export function useGenerateRequestLabels(requestId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (): Promise<RequestLabelBatch> => {
      const { data } = await api.post<ApiResponse<RequestLabelBatch>>(
        `/requests/${requestId}/labels/`,
      )
      return data.data
    },
    onSuccess: (batch) => {
      qc.setQueryData(['requests', requestId, 'labels'], batch)
      qc.invalidateQueries({ queryKey: ['requests', requestId, 'labels'] })
    },
  })
}

// ============================================================
// Final Patient Report
//   POST /requests/:id/report/           → generate-or-get
//   GET  /requests/:id/report/download/  → secure PDF stream
// ============================================================

export interface RequestReport {
  id: string
  version_number: number
  is_current: boolean
  generated_at: string
  generated_by_email: string | null
  pdf_url: string
}

export function useGenerateRequestReport(requestId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (): Promise<RequestReport> => {
      const { data } = await api.post<ApiResponse<RequestReport>>(
        `/requests/${requestId}/report/`,
      )
      return data.data
    },
    // Invalidate the detail query so ``has_report`` / ``current_report``
    // on the request payload reflect the new state without an extra
    // manual round-trip.
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requests', requestId] })
    },
  })
}

export interface ReportVersionListItem {
  id: string
  version_number: number
  is_current: boolean
  generated_at: string
  generated_by_email: string | null
  downloadable: boolean
  pdf_url: string
}

export function useReportVersions(requestId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['requests', requestId, 'report', 'versions'],
    enabled,
    queryFn: async () => {
      const { data } = await api.get<
        ApiResponse<{ results: ReportVersionListItem[] }>
      >(`/requests/${requestId}/report/versions/`)
      return data.data.results
    },
    staleTime: 30_000,
  })
}

export function useRegenerateRequestReport(requestId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (): Promise<RequestReport> => {
      const { data } = await api.post<ApiResponse<RequestReport>>(
        `/requests/${requestId}/report/regenerate/`,
      )
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requests', requestId] })
    },
  })
}

// ============================================================
// Patient access token
// ============================================================

export interface AccessTokenState {
  status: 'not_generated' | 'active' | 'expired' | 'revoked'
  token?: string
  expires_at?: string
  access_url?: string
  download_url?: string
}

export function useAccessTokenState(requestId: string) {
  return useQuery({
    queryKey: ['requests', requestId, 'access-token'],
    queryFn: async (): Promise<AccessTokenState> => {
      const { data } = await api.get<ApiResponse<AccessTokenState>>(
        `/requests/${requestId}/access-token/`,
      )
      return data.data
    },
    staleTime: 30_000,
  })
}

export function useCreateAccessToken(requestId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (): Promise<AccessTokenState> => {
      const { data } = await api.post<ApiResponse<AccessTokenState>>(
        `/requests/${requestId}/access-token/`,
      )
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({
      queryKey: ['requests', requestId, 'access-token'],
    }),
  })
}

export function useRegenerateAccessToken(requestId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (): Promise<AccessTokenState> => {
      const { data } = await api.post<ApiResponse<AccessTokenState>>(
        `/requests/${requestId}/access-token/regenerate/`,
      )
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({
      queryKey: ['requests', requestId, 'access-token'],
    }),
  })
}

export interface ChannelOutcome {
  channel: 'EMAIL'
  status: 'FAILED'
  provider: string | null
  error: string | null
}

export interface NotifyPatientResponse {
  secure_link: string
  expires_at: string
  channels_attempted: string[]
  channels_succeeded: string[]
  channels_failed: ChannelOutcome[]
}

export function useNotifyPatientByEmail(requestId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (): Promise<NotifyPatientResponse> => {
      const { data } = await api.post<ApiResponse<NotifyPatientResponse>>(
        `/requests/${requestId}/notify-patient/`,
      )
      return data.data
    },
    onSuccess: (res) => {
      // Backend creates-or-reuses the secure link; promote the returned
      // values into the access-token cache so the UI reflects the new
      // active link immediately (no flicker, no extra round-trip).
      qc.setQueryData<AccessTokenState>(
        ['requests', requestId, 'access-token'],
        (prev) => ({
          status: 'active',
          // Preserve any existing token/download_url (the notify endpoint
          // doesn't surface them — they remain valid since we reused the
          // same row), but always overwrite access_url + expires_at.
          token: prev?.token,
          download_url: prev?.download_url,
          access_url: res.secure_link,
          expires_at: res.expires_at,
        }),
      )
      // Still invalidate so the next focus refetch reconciles with the
      // canonical /access-token/ payload (token + download_url fields).
      qc.invalidateQueries({
        queryKey: ['requests', requestId, 'access-token'],
      })
    },
  })
}
