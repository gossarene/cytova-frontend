import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import type { ApiResponse } from '@/lib/api/types'
import type { LabSettings, LabSettingsUpdate } from './types'

const QK = ['lab-settings'] as const

export function useLabSettings() {
  return useQuery({
    queryKey: QK,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<LabSettings>>('/lab-settings/')
      return data.data
    },
  })
}

export function useUpdateLabSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: LabSettingsUpdate) => {
      const { data } = await api.patch<ApiResponse<LabSettings>>('/lab-settings/', payload)
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  })
}

export function useUploadLabLogo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      const { data } = await api.post<ApiResponse<LabSettings>>(
        '/lab-settings/logo/',
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  })
}

export function useLabLogoPreview(enabled: boolean) {
  return useQuery({
    queryKey: [...QK, 'logo-preview'],
    enabled,
    staleTime: 0,
    queryFn: async () => {
      const resp = await api.get<Blob>('/lab-settings/logo/', { responseType: 'blob' })
      return URL.createObjectURL(resp.data)
    },
  })
}

export function useDeleteLabLogo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.delete<ApiResponse<LabSettings>>('/lab-settings/logo/')
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  })
}
