import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import type { ApiResponse } from '@/lib/api/types'
import type {
  StockCategoryListItem, StockItemListItem, StockItemDetail,
  StockLot, StockMovement,
} from './types'

// -- Categories --

export function useStockCategories(params?: { is_active?: string }) {
  return useQuery({
    queryKey: ['stock', 'categories', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<StockCategoryListItem[]>>('/stock/categories/', { params })
      return data
    },
  })
}

export function useCreateStockCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (p: { name: string; description?: string; display_order?: number }) => {
      const { data } = await api.post<ApiResponse<StockCategoryListItem>>('/stock/categories/', p)
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stock', 'categories'] }),
  })
}

// -- Items --

export function useStockItems(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['stock', 'items', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<StockItemListItem[]>>('/stock/items/', { params })
      return data
    },
  })
}

export function useStockItem(id: string) {
  return useQuery({
    queryKey: ['stock', 'items', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<StockItemDetail>>(`/stock/items/${id}/`)
      return data.data
    },
    enabled: !!id,
  })
}

export function useCreateStockItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (p: Record<string, unknown>) => {
      const { data } = await api.post<ApiResponse<StockItemDetail>>('/stock/items/', p)
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stock'] }),
  })
}

export function useUpdateStockItem(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (p: Record<string, unknown>) => {
      const { data } = await api.patch<ApiResponse<StockItemDetail>>(`/stock/items/${id}/`, p)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock', 'items', id] })
      qc.invalidateQueries({ queryKey: ['stock', 'items'] })
    },
  })
}

export function useDeactivateStockItem(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => { await api.post(`/stock/items/${id}/deactivate/`) },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stock'] }),
  })
}

// -- Lots --

export function useStockLots(itemId: string, params?: Record<string, string>) {
  return useQuery({
    queryKey: ['stock', 'items', itemId, 'lots', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<StockLot[]>>(`/stock/items/${itemId}/lots/`, { params })
      return data
    },
    enabled: !!itemId,
  })
}

export function useCreateStockLot(itemId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (p: Record<string, unknown>) => {
      const { data } = await api.post<ApiResponse<StockLot>>(`/stock/items/${itemId}/lots/`, p)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock', 'items', itemId] })
      qc.invalidateQueries({ queryKey: ['stock', 'items'] })
    },
  })
}

// -- Movements --

export function useStockMovements(lotId: string, params?: Record<string, string>) {
  return useQuery({
    queryKey: ['stock', 'lots', lotId, 'movements', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<StockMovement[]>>(`/stock/lots/${lotId}/movements/`, { params })
      return data
    },
    enabled: !!lotId,
  })
}

export function useRecordMovement(lotId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (p: {
      movement_type: string; quantity: string; reason?: string
      reference?: string; reference_type?: string
    }) => {
      const { data } = await api.post<ApiResponse<StockMovement>>(`/stock/lots/${lotId}/movements/`, p)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// -- Movement report (flat) --

export function useMovementReport(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['stock', 'movements', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<StockMovement[]>>('/stock/movements/', { params })
      return data
    },
  })
}
