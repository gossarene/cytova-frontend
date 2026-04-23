import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import type { ApiResponse } from '@/lib/api/types'
import type {
  LabelDefaults, LabelPrintMode, LabelPrintPreset,
  LabSettings, LabSettingsUpdate,
} from './types'

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

// ============================================================
// Label printing — presets + per-mode defaults
//
// Presets are a platform-managed read-only catalog for the lab.
// Defaults back the "apply sensible values" behaviour when the
// user switches print modes without yet picking a preset.
// ============================================================

export function useLabelPresets() {
  return useQuery({
    queryKey: ['lab-settings', 'label-presets'],
    queryFn: async (): Promise<LabelPrintPreset[]> => {
      const { data } = await api.get<ApiResponse<{ results: LabelPrintPreset[] }>>(
        '/lab-settings/label-presets/',
      )
      return data.data?.results ?? []
    },
    staleTime: 5 * 60_000,
  })
}

export function useLabelDefaults() {
  return useQuery({
    queryKey: ['lab-settings', 'label-defaults'],
    queryFn: async (): Promise<Record<LabelPrintMode, LabelDefaults>> => {
      const { data } = await api.get<ApiResponse<{ defaults: Record<LabelPrintMode, LabelDefaults> }>>(
        '/lab-settings/label-defaults/',
      )
      return data.data?.defaults ?? ({} as Record<LabelPrintMode, LabelDefaults>)
    },
    staleTime: 60 * 60_000,
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
