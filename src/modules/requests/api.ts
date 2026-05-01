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

/**
 * Channel through which a result version reached the patient. Mirrors
 * the backend ``PatientSharedChannel`` enum. Empty string surfaces on
 * legacy share rows that pre-date the version-tracking migration.
 */
export type LabReportSharedChannel = 'CYTOVA' | 'EMAIL' | 'SHARE_LINK' | 'MANUAL'

/**
 * One patient-portal share event recorded against a specific lab
 * report version. The dialog renders these as a sub-list under their
 * parent ``ReportHistoryLabVersion`` so the operator can see "this
 * version was sent on date X, via channel Y, and is the current
 * version on the patient's side".
 *
 * Server contract: ``patient_account_id`` is the global Cytova account
 * id — already known to the lab from the share form, so re-exposing
 * it here doesn't introduce a new identifier surface. Patient PII
 * (name, email, DOB) is NEVER part of this payload.
 */
export interface ReportHistoryShareEvent {
  shared_result_id: string
  shared_at: string
  shared_channel: LabReportSharedChannel | ''
  /**
   * Patient-portal lifecycle status: ``ACTIVE`` once shared,
   * ``HIDDEN_BY_PATIENT`` if the patient hid the row themselves,
   * ``REVOKED`` if the lab revoked it. Lab can see all three (the
   * patient-portal view filters HIDDEN/REVOKED out).
   */
  share_status: 'ACTIVE' | 'HIDDEN_BY_PATIENT' | 'REVOKED'
  is_current_for_patient: boolean
  patient_account_id: string
}

export interface ReportHistoryLabVersion {
  id: string
  version_number: number
  is_current: boolean
  generated_at: string
  generated_by_email: string | null
  downloadable: boolean
  pdf_url: string
  /**
   * Share events that reference this lab version. Empty when the
   * version was generated internally but never shared with the
   * patient — the patient-portal contract requires that lab-only
   * versions stay invisible client-side.
   */
  shared_with_patient: ReportHistoryShareEvent[]
}

export interface ReportHistoryPayload {
  request_id: string
  request_number: string
  request_status: string
  issued_at: string | null
  issued_by_email: string | null
  reopened_at: string | null
  reopened_by_email: string | null
  reopen_reason: string
  lab_versions: ReportHistoryLabVersion[]
  /**
   * Pre-Phase-1 share rows whose ``report_version_number`` is null —
   * they couldn't be bucketed under a specific lab version. The
   * dialog surfaces them in their own group so they aren't silently
   * dropped from the operator's view.
   */
  unversioned_shares: ReportHistoryShareEvent[]
  /** Sorted distinct channels used across patient-share events. */
  channels_used: LabReportSharedChannel[]
}

export function useReportHistory(requestId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['requests', requestId, 'report-history'],
    enabled,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ReportHistoryPayload>>(
        `/requests/${requestId}/report-history/`,
      )
      return data.data
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
    // Same ``force_resend`` contract as ``useNotifyPatientByEmail``:
    // post-issuance, the backend rejects with 409 unless the flag is
    // set. The frontend confirms with the user before retrying.
    mutationFn: async (
      payload: { force_resend?: boolean } = {},
    ): Promise<AccessTokenState> => {
      const { data } = await api.post<ApiResponse<AccessTokenState>>(
        `/requests/${requestId}/access-token/regenerate/`,
        payload,
      )
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({
      queryKey: ['requests', requestId, 'access-token'],
    }),
  })
}

// ---------------------------------------------------------------------------
// Reopen result — controlled correction flow (biologist / lab admin)
// ---------------------------------------------------------------------------

export interface ReopenResultResponse {
  status: 'VALIDATED'
  reopened_at: string
  superseded_report_versions: number
  message: string
}

export function useReopenResult(requestId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { reason: string }): Promise<ReopenResultResponse> => {
      const { data } = await api.post<ApiResponse<ReopenResultResponse>>(
        `/requests/${requestId}/reopen-result/`,
        payload,
      )
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requests', requestId] })
      qc.invalidateQueries({ queryKey: ['requests', 'list'] })
      qc.invalidateQueries({ queryKey: ['requests', requestId, 'access-token'] })
    },
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

export function useMarkRequestDelivered(requestId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (): Promise<RequestDetail> => {
      const { data } = await api.post<ApiResponse<RequestDetail>>(
        `/requests/${requestId}/mark-delivered/`,
      )
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requests', requestId] })
      qc.invalidateQueries({ queryKey: ['requests', 'list'] })
    },
  })
}

export function useArchiveRequest(requestId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (): Promise<RequestDetail> => {
      const { data } = await api.post<ApiResponse<RequestDetail>>(
        `/requests/${requestId}/archive/`,
      )
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requests', requestId] })
      qc.invalidateQueries({ queryKey: ['requests', 'list'] })
    },
  })
}

export function useNotifyPatientByEmail(requestId: string) {
  const qc = useQueryClient()
  return useMutation({
    // ``force_resend`` opts past the post-issuance lock — the
    // backend returns 409 ALREADY_ISSUED otherwise, and the UI
    // surfaces a confirmation modal that supplies the flag.
    mutationFn: async (
      payload: { force_resend?: boolean } = {},
    ): Promise<NotifyPatientResponse> => {
      const { data } = await api.post<ApiResponse<NotifyPatientResponse>>(
        `/requests/${requestId}/notify-patient/`,
        payload,
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


// ---------------------------------------------------------------------------
// Notify Cytova — share a result with a global patient portal account
// ---------------------------------------------------------------------------

export interface NotifyCytovaPayload {
  cytova_patient_id: string
  first_name: string
  last_name: string
  date_of_birth: string  // YYYY-MM-DD
  /** Override the one-shot rule. Backend rejects with
   *  ``CYTOVA_ALREADY_SHARED`` (409) unless this flag is true AND
   *  the caller has the LAB_ADMIN or BIOLOGIST role. */
  force_share?: boolean
}

export interface NotifyCytovaResponse {
  shared_result_id: string
  /** Email-notification outcome — best-effort. The share itself
   *  succeeded either way; FAILED means the lab user should follow
   *  up with the patient out-of-band. */
  email_notification: 'SENT' | 'FAILED'
  message: string
}

/**
 * POST /api/v1/requests/{id}/notify-cytova/
 *
 * The backend gates on identity: name + DOB must match the global
 * patient account behind the supplied Cytova ID. On any mismatch the
 * server returns 400 with a single non-distinguishing error code
 * (`IDENTITY_VERIFICATION_FAILED`) — the UI surface MUST mirror that
 * and never tell the lab user which field was wrong.
 */
export function useNotifyCytova(requestId: string) {
  return useMutation({
    mutationFn: async (payload: NotifyCytovaPayload): Promise<NotifyCytovaResponse> => {
      const { data } = await api.post<ApiResponse<NotifyCytovaResponse>>(
        `/requests/${requestId}/notify-cytova/`,
        payload,
      )
      return data.data
    },
  })
}


// ---------------------------------------------------------------------------
// Cytova share lifecycle (status lookup + revoke)
// ---------------------------------------------------------------------------

export type CytovaShareStatus = 'ACTIVE' | 'HIDDEN_BY_PATIENT' | 'REVOKED'

export interface CytovaShareState {
  status: CytovaShareStatus | null
  shared_result_id: string | null
  /** Snapshot of when the share was created. ``null`` if never shared. */
  created_at?: string
  /** Snapshot of when the share was revoked, if it has been. */
  revoked_at?: string | null
  /** ``'SENT' | 'FAILED' | null`` — the original notify-time outcome. */
  email_notification_status?: string | null
}

export const cytovaShareKey = (requestId: string) =>
  ['requests', requestId, 'cytova-share'] as const

/**
 * Lab-side polling lookup that drives the "Shared with Cytova patient"
 * badge + revoke button on Request Detail. ``status`` is ``null`` for
 * requests never shared to Cytova.
 */
export function useCytovaShareStatus(requestId: string, enabled = true) {
  return useQuery({
    queryKey: cytovaShareKey(requestId),
    queryFn: async (): Promise<CytovaShareState> => {
      const { data } = await api.get<ApiResponse<CytovaShareState>>(
        `/requests/${requestId}/cytova-share/`,
      )
      return data.data
    },
    enabled: enabled && !!requestId,
    staleTime: 30_000,
  })
}

export interface RevokeCytovaShareResponse {
  revoked_count: number
  message: string
}

export function useRevokeCytovaShare(requestId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (): Promise<RevokeCytovaShareResponse> => {
      const { data } = await api.post<ApiResponse<RevokeCytovaShareResponse>>(
        `/requests/${requestId}/revoke-cytova-share/`,
      )
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cytovaShareKey(requestId) })
    },
  })
}
