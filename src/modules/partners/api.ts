import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import type { ApiResponse } from '@/lib/api/types'
import type { PartnerListItem, PartnerDetail } from './types'

export function usePartners(params?: { search?: string; organization_type?: string; is_active?: string }) {
  return useQuery({
    queryKey: ['partners', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PartnerListItem[]>>('/partners/', { params })
      return data
    },
  })
}

export function usePartner(id: string) {
  return useQuery({
    queryKey: ['partners', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PartnerDetail>>(`/partners/${id}/`)
      return data.data
    },
    enabled: !!id,
  })
}

export function useCreatePartner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post<ApiResponse<PartnerDetail>>('/partners/', payload)
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partners'] }),
  })
}

export function useUpdatePartner(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.patch<ApiResponse<PartnerDetail>>(`/partners/${id}/`, payload)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partners', id] })
      qc.invalidateQueries({ queryKey: ['partners'] })
    },
  })
}

export function useDeactivatePartner(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await api.post(`/partners/${id}/deactivate/`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partners'] }),
  })
}

/** Fetch active partners for select dropdowns (e.g., in request forms) */
export function useActivePartners() {
  return useQuery({
    queryKey: ['partners', 'active'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PartnerListItem[]>>('/partners/', {
        params: { is_active: 'true', page_size: 100 },
      })
      return data.data
    },
    staleTime: 5 * 60_000,
  })
}
