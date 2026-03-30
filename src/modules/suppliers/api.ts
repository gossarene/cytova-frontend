import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import type { ApiResponse } from '@/lib/api/types'
import type {
  SupplierListItem, SupplierDetail,
  POListItem, PODetail, POItemRead,
  ReceptionListItem, ReceptionDetail,
} from './types'

// ============================================================
// Suppliers
// ============================================================

export function useSuppliers(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['suppliers', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<SupplierListItem[]>>('/suppliers/', { params })
      return data
    },
  })
}

export function useSupplier(id: string) {
  return useQuery({
    queryKey: ['suppliers', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<SupplierDetail>>(`/suppliers/${id}/`)
      return data.data
    },
    enabled: !!id,
  })
}

export function useCreateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (p: Record<string, unknown>) => {
      const { data } = await api.post<ApiResponse<SupplierDetail>>('/suppliers/', p)
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  })
}

export function useUpdateSupplier(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (p: Record<string, unknown>) => {
      const { data } = await api.patch<ApiResponse<SupplierDetail>>(`/suppliers/${id}/`, p)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers', id] })
      qc.invalidateQueries({ queryKey: ['suppliers'] })
    },
  })
}

export function useDeactivateSupplier(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => { await api.post(`/suppliers/${id}/deactivate/`) },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  })
}

export function useActiveSuppliers() {
  return useQuery({
    queryKey: ['suppliers', 'active'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<SupplierListItem[]>>('/suppliers/', { params: { is_active: 'true' } })
      return data.data
    },
    staleTime: 5 * 60_000,
  })
}

// ============================================================
// Purchase Orders
// ============================================================

export function usePurchaseOrders(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['purchase-orders', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<POListItem[]>>('/purchase-orders/', { params })
      return data
    },
  })
}

export function usePurchaseOrder(id: string) {
  return useQuery({
    queryKey: ['purchase-orders', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PODetail>>(`/purchase-orders/${id}/`)
      return data.data
    },
    enabled: !!id,
  })
}

export function useCreatePurchaseOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (p: Record<string, unknown>) => {
      const { data } = await api.post<ApiResponse<PODetail>>('/purchase-orders/', p)
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase-orders'] }),
  })
}

export function useConfirmPO(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiResponse<PODetail>>(`/purchase-orders/${id}/confirm/`)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders', id] })
      qc.invalidateQueries({ queryKey: ['purchase-orders'] })
    },
  })
}

export function useCancelPO(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiResponse<PODetail>>(`/purchase-orders/${id}/cancel/`)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders', id] })
      qc.invalidateQueries({ queryKey: ['purchase-orders'] })
    },
  })
}

export function useClosePO(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiResponse<PODetail>>(`/purchase-orders/${id}/close/`)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders', id] })
      qc.invalidateQueries({ queryKey: ['purchase-orders'] })
    },
  })
}

// -- PO Items --

export function useAddPOItem(orderId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (p: { stock_item_id: string; ordered_quantity: string; unit_price?: string; notes?: string }) => {
      const { data } = await api.post<ApiResponse<POItemRead>>(`/purchase-orders/${orderId}/items/`, p)
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase-orders', orderId] }),
  })
}

export function useRemovePOItem(orderId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (itemId: string) => {
      await api.delete(`/purchase-orders/${orderId}/items/${itemId}/`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase-orders', orderId] }),
  })
}

// ============================================================
// Receptions
// ============================================================

export function useReceptions(orderId: string) {
  return useQuery({
    queryKey: ['purchase-orders', orderId, 'receptions'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ReceptionListItem[]>>(`/purchase-orders/${orderId}/receptions/`)
      return data
    },
    enabled: !!orderId,
  })
}

export function useReception(orderId: string, receptionId: string) {
  return useQuery({
    queryKey: ['purchase-orders', orderId, 'receptions', receptionId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ReceptionDetail>>(`/purchase-orders/${orderId}/receptions/${receptionId}/`)
      return data.data
    },
    enabled: !!orderId && !!receptionId,
  })
}

export function useCreateReception(orderId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (p: Record<string, unknown>) => {
      const { data } = await api.post<ApiResponse<ReceptionDetail>>(`/purchase-orders/${orderId}/receptions/`, p)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders', orderId] })
      qc.invalidateQueries({ queryKey: ['purchase-orders'] })
      qc.invalidateQueries({ queryKey: ['stock'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
