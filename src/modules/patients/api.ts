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

export function useCreatePatient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: PatientCreateRequest) => {
      const { data } = await api.post<ApiResponse<PatientDetail>>('/patients/', payload)
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
      const { data } = await api.patch<ApiResponse<PatientDetail>>(`/patients/${id}/`, payload)
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
