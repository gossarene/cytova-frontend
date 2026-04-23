import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import type { ApiResponse } from '@/lib/api/types'
import type { InvoiceDetail, InvoiceListItem, InvoicePreview } from './types'

const QK = ['invoices'] as const

export function useInvoices() {
  return useQuery({
    queryKey: QK,
    queryFn: async (): Promise<InvoiceListItem[]> => {
      const { data } = await api.get<ApiResponse<InvoiceListItem[]>>(
        '/invoicing/',
      )
      return data.data ?? []
    },
  })
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: [...QK, id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<InvoiceDetail>>(
        `/invoicing/${id}/`,
      )
      return data.data
    },
    enabled: !!id,
  })
}

export function useInvoicePreview() {
  return useMutation({
    mutationFn: async (payload: {
      partner_id: string
      period_start: string
      period_end: string
    }) => {
      const { data } = await api.post<ApiResponse<InvoicePreview>>(
        '/invoicing/preview/',
        payload,
      )
      return data.data
    },
  })
}

export function useCreateInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      partner_id: string
      period_start: string
      period_end: string
      notes?: string
    }) => {
      const { data } = await api.post<ApiResponse<InvoiceDetail>>(
        '/invoicing/',
        payload,
      )
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  })
}

export function useConfirmInvoice(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiResponse<InvoiceDetail>>(
        `/invoicing/${id}/confirm/`,
      )
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  })
}

export function useCancelInvoice(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiResponse<InvoiceDetail>>(
        `/invoicing/${id}/cancel/`,
      )
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  })
}

export function useGenerateInvoicePdf(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiResponse<InvoiceDetail>>(
        `/invoicing/${id}/generate-pdf/`,
      )
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...QK, id] })
    },
  })
}

export function useGenerateStatement(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiResponse<InvoiceDetail>>(
        `/invoicing/${id}/generate-statement/`,
      )
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...QK, id] })
    },
  })
}
