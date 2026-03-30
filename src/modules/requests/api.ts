import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import type { ApiResponse } from '@/lib/api/types'
import type {
  RequestListItem, RequestDetail, RequestItemDetail,
  RequestCreatePayload, RequestItemInput,
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
