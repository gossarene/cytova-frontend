import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import type { ApiResponse } from '@/lib/api/types'
import type { PartnerListItem, PartnerDetail, PartnerExamPriceItem } from './types'

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

// ============================================================
// Partner Exam Prices — nested under a partner
//   GET    /partners/:partner_id/exam-prices/
//   POST   /partners/:partner_id/exam-prices/
//   PATCH  /partners/:partner_id/exam-prices/:id/
//   POST   /partners/:partner_id/exam-prices/:id/deactivate/
//   POST   /partners/:partner_id/exam-prices/:id/reactivate/
//
// All hooks invalidate the same ``['partners', partnerId, 'exam-prices']``
// prefix so any mutation refreshes every active list view for that partner.
// ============================================================

export interface PartnerExamPriceListParams {
  is_active?: string
  search?: string
}

export function usePartnerExamPrices(
  partnerId: string,
  params?: PartnerExamPriceListParams,
) {
  return useQuery({
    queryKey: ['partners', partnerId, 'exam-prices', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PartnerExamPriceItem[]>>(
        `/partners/${partnerId}/exam-prices/`,
        { params },
      )
      return data.data ?? []
    },
    enabled: !!partnerId,
  })
}

export function useCreatePartnerExamPrice(partnerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      exam_definition_id: string
      agreed_price: string
      notes?: string
    }) => {
      const { data } = await api.post<ApiResponse<PartnerExamPriceItem>>(
        `/partners/${partnerId}/exam-prices/`,
        payload,
      )
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partners', partnerId, 'exam-prices'] }),
  })
}

export function useUpdatePartnerExamPrice(partnerId: string, priceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { agreed_price?: string; notes?: string }) => {
      const { data } = await api.patch<ApiResponse<PartnerExamPriceItem>>(
        `/partners/${partnerId}/exam-prices/${priceId}/`,
        payload,
      )
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partners', partnerId, 'exam-prices'] }),
  })
}

export function useDeactivatePartnerExamPrice(partnerId: string, priceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await api.post(`/partners/${partnerId}/exam-prices/${priceId}/deactivate/`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partners', partnerId, 'exam-prices'] }),
  })
}

export function useReactivatePartnerExamPrice(partnerId: string, priceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await api.post(`/partners/${partnerId}/exam-prices/${priceId}/reactivate/`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partners', partnerId, 'exam-prices'] }),
  })
}
