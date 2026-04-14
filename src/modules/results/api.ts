import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import type { ApiResponse } from '@/lib/api/types'
import type { ResultListItem, ResultDetail, ResultFile, SignedDownloadURL } from './types'

// -- Result Versions --

export function useResults(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['results', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ResultListItem[]>>('/results/', { params })
      return data
    },
  })
}

export function useResult(id: string) {
  return useQuery({
    queryKey: ['results', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ResultDetail>>(`/results/${id}/`)
      return data.data
    },
    enabled: !!id,
  })
}

export function useItemCurrentResult(itemId: string) {
  return useQuery({
    queryKey: ['results', 'item', itemId, 'current'],
    queryFn: async (): Promise<ResultDetail | null> => {
      const { data } = await api.get<ApiResponse<ResultListItem[]>>('/results/', {
        params: { item_id: itemId, is_current: 'true' },
      })
      const list = data.data
      if (!list || list.length === 0) return null
      const detail = await api.get<ApiResponse<ResultDetail>>(`/results/${list[0].id}/`)
      return detail.data.data
    },
    enabled: !!itemId,
  })
}

export function useCreateResult() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      item_id: string; result_value?: string; result_unit?: string
      reference_range?: string; is_abnormal?: boolean
      comments?: string; internal_notes?: string; notes?: string
    }) => {
      const { data } = await api.post<ApiResponse<ResultDetail>>('/results/', payload)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['results'] })
      qc.invalidateQueries({ queryKey: ['requests'] })
    },
  })
}

export function useUpdateResult(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.patch<ApiResponse<ResultDetail>>(`/results/${id}/`, payload)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['results', id] })
      qc.invalidateQueries({ queryKey: ['results'] })
    },
  })
}

export function useSubmitResult(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiResponse<ResultDetail>>(`/results/${id}/submit/`)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['results'] })
      qc.invalidateQueries({ queryKey: ['requests'] })
    },
  })
}

export function useUpdateReviewComments(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { comments?: string; validation_notes?: string }) => {
      const { data } = await api.patch<ApiResponse<ResultDetail>>(
        `/results/${id}/review-comments/`, payload,
      )
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['results'] })
    },
  })
}

export function useValidateResult(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (notes?: string) => {
      const { data } = await api.post<ApiResponse<ResultDetail>>(`/results/${id}/validate/`, {
        validation_notes: notes ?? '',
      })
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['results'] })
      qc.invalidateQueries({ queryKey: ['requests'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useRejectResult(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (notes: string) => {
      const { data } = await api.post<ApiResponse<ResultDetail>>(`/results/${id}/reject/`, {
        rejection_notes: notes,
      })
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['results'] })
      qc.invalidateQueries({ queryKey: ['requests'] })
    },
  })
}

export function usePublishResult(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiResponse<ResultDetail>>(`/results/${id}/publish/`)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['results'] })
      qc.invalidateQueries({ queryKey: ['requests'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// -- Files --

export function useResultFiles(resultId: string) {
  return useQuery({
    queryKey: ['results', resultId, 'files'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ResultFile[]>>(`/results/${resultId}/files/`)
      return data.data
    },
    enabled: !!resultId,
  })
}

export function useUploadResultFile(resultId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await api.post<ApiResponse<ResultFile>>(
        `/results/${resultId}/files/`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['results', resultId] })
    },
  })
}

export function useDeleteResultFile(resultId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (fileId: string) => {
      await api.delete(`/results/${resultId}/files/${fileId}/`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['results', resultId] })
    },
  })
}

export async function getFileDownloadUrl(resultId: string, fileId: string): Promise<SignedDownloadURL> {
  const { data } = await api.get<ApiResponse<SignedDownloadURL>>(
    `/results/${resultId}/files/${fileId}/download/`,
  )
  return data.data
}
