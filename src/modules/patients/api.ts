import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import type { ApiResponse } from '@/lib/api/types'
import type {
  PatientListItem, PatientDetail,
  PatientCreateRequest, PatientUpdateRequest, PortalAccount,
} from './types'

// -- List --

export interface PatientListParams {
  search?: string
  is_active?: string
  gender?: string
  has_portal_account?: string
  ordering?: string
  cursor?: string
  page_size?: number
}

export function usePatients(params: PatientListParams = {}) {
  return useQuery({
    queryKey: ['patients', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PatientListItem[]>>('/patients/', { params })
      return data
    },
  })
}

// -- Detail --

export function usePatient(id: string) {
  return useQuery({
    queryKey: ['patients', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PatientDetail>>(`/patients/${id}/`)
      return data.data
    },
    enabled: !!id,
  })
}

// -- Create --

/** Normalise a patient payload at the wire boundary.
 *
 *  React Hook Form represents an empty date input as ``""``, but DRF's
 *  ``DateField(allow_null=True)`` rejects empty strings with "Date has
 *  wrong format" — only ``null`` is accepted. The form's "DOB unknown"
 *  checkbox clears the date input to ``""``, so without this
 *  normaliser the receptionist gets a 400 when they submit a patient
 *  with no DOB on file. We coerce empty-string DOB to ``null``
 *  whenever we ship the payload, regardless of the unknown flag,
 *  because there's no legitimate reason to send an empty-string date
 *  to a date field. Same treatment for any future date field added
 *  to the patient API.
 */
function normalisePatientPayload<T extends { date_of_birth?: string | null }>(payload: T): T {
  if (payload.date_of_birth === '') {
    return { ...payload, date_of_birth: null }
  }
  return payload
}

export function useCreatePatient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: PatientCreateRequest) => {
      const { data } = await api.post<ApiResponse<PatientDetail>>(
        '/patients/', normalisePatientPayload(payload),
      )
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  })
}

// -- Update --

export function useUpdatePatient(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: PatientUpdateRequest) => {
      const { data } = await api.patch<ApiResponse<PatientDetail>>(
        `/patients/${id}/`, normalisePatientPayload(payload),
      )
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patients', id] })
      qc.invalidateQueries({ queryKey: ['patients'] })
    },
  })
}

// -- Deactivate --

export function useDeactivatePatient(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiResponse<PatientDetail>>(`/patients/${id}/deactivate/`)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patients', id] })
      qc.invalidateQueries({ queryKey: ['patients'] })
    },
  })
}

// -- Patient requests --

export interface PatientRequestItem {
  id: string
  request_number: string
  status: string
  source_type: string
  partner_organization_name: string | null
  items_count: number
  created_at: string
}

export interface PatientRequestStats {
  total_requests: number
  requests_by_status: Record<string, number>
  requests_by_source: Record<string, number>
}

export function usePatientRequests(patientId: string, limit = 5) {
  return useQuery({
    queryKey: ['patients', patientId, 'requests', limit],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PatientRequestItem[]>>(
        `/patients/${patientId}/requests/`,
        { params: { limit } },
      )
      return data.data ?? []
    },
    enabled: !!patientId,
  })
}

export function usePatientRequestStats(patientId: string) {
  return useQuery({
    queryKey: ['patients', patientId, 'request-stats'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PatientRequestStats>>(
        `/patients/${patientId}/request-stats/`,
      )
      return data.data
    },
    enabled: !!patientId,
  })
}

// -- Portal account --

export function useCreatePortalAccount(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (email: string) => {
      const { data } = await api.post<ApiResponse<PortalAccount>>(
        `/patients/${patientId}/portal-account/`,
        { email },
      )
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients', patientId] }),
  })
}

export function useDeletePortalAccount(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await api.delete(`/patients/${patientId}/portal-account/`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients', patientId] }),
  })
}


// ---------------------------------------------------------------------------
// Cytova patient-identity link
// ---------------------------------------------------------------------------

/**
 * Input shape for ``POST /patients/{id}/link-cytova-identity/``.
 *
 * The form prefills ``first_name`` / ``last_name`` / ``date_of_birth``
 * from the local patient record so the operator only re-types the
 * Cytova ID. Backend re-runs the full identity check against the
 * global ``PatientAccount`` — local prefill is convenience only,
 * not a security trust boundary.
 */
export interface LinkCytovaIdentityRequest {
  cytova_patient_id: string
  first_name: string
  last_name: string
  date_of_birth: string
}

/**
 * Link the local patient to a global Cytova identity. On success the
 * detail payload comes back with ``has_cytova_identity=true`` + the
 * snapshot fields populated; the cache invalidation flips every
 * dependent badge across the app (Cytova card, Notify Cytova action
 * in the Phase F drawer).
 *
 * Failure surface (backend codes the UI maps):
 *   - 400 ``IDENTITY_VERIFICATION_FAILED`` — generic mismatch. The
 *     dialog surfaces a non-distinguishing error so the lab user
 *     never learns which field was wrong (no enumeration oracle
 *     against global patient identity).
 *   - 409 ``ALREADY_LINKED`` — operator must unlink first. Should
 *     not normally fire from the UI: the link CTA is hidden when
 *     ``has_cytova_identity=true``. Defensive branch only.
 */
export function useLinkCytovaIdentity(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: LinkCytovaIdentityRequest): Promise<PatientDetail> => {
      const { data } = await api.post<ApiResponse<PatientDetail>>(
        `/patients/${patientId}/link-cytova-identity/`,
        payload,
      )
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patients', patientId] })
      qc.invalidateQueries({ queryKey: ['patients'] })
    },
  })
}

/**
 * Clear the Cytova identity link snapshot. Idempotent on the backend
 * (no-op on already-unlinked patients) so the UI can fire-and-forget
 * without tracking local state.
 */
export function useUnlinkCytovaIdentity(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (): Promise<PatientDetail> => {
      const { data } = await api.post<ApiResponse<PatientDetail>>(
        `/patients/${patientId}/unlink-cytova-identity/`,
      )
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patients', patientId] })
      qc.invalidateQueries({ queryKey: ['patients'] })
    },
  })
}
