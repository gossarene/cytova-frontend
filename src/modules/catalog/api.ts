import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import type { ApiResponse } from '@/lib/api/types'
import type {
  ExamCategoryListItem, ExamDefinitionListItem, ExamDefinitionDetail,
  PricingRule, LabExamSettings,
} from './types'

// ============================================================
// Categories
// ============================================================

export function useCategories(params?: { is_active?: string; search?: string }) {
  return useQuery({
    queryKey: ['catalog', 'categories', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ExamCategoryListItem[]>>('/catalog/categories/', { params })
      return data
    },
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name: string; description?: string; display_order?: number }) => {
      const { data } = await api.post<ApiResponse<ExamCategoryListItem>>('/catalog/categories/', payload)
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'categories'] }),
  })
}

export function useUpdateCategory(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name?: string; description?: string; display_order?: number }) => {
      const { data } = await api.patch<ApiResponse<ExamCategoryListItem>>(`/catalog/categories/${id}/`, payload)
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog'] }),
  })
}

export function useDeactivateCategory(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await api.post(`/catalog/categories/${id}/deactivate/`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog'] }),
  })
}

// ============================================================
// Exam Definitions
// ============================================================

export interface ExamListParams {
  search?: string
  category_id?: string
  sample_type?: string
  is_active?: string
  is_enabled?: string
}

export function useExamDefinitions(params: ExamListParams = {}) {
  return useQuery({
    queryKey: ['catalog', 'exams', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ExamDefinitionListItem[]>>('/catalog/exams/', { params })
      return data
    },
  })
}

export function useExamDefinition(id: string) {
  return useQuery({
    queryKey: ['catalog', 'exams', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ExamDefinitionDetail>>(`/catalog/exams/${id}/`)
      return data.data
    },
    enabled: !!id,
  })
}

export function useCreateExamDefinition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      category_id: string; code: string; name: string; sample_type: string
      turnaround_hours?: number | null; description?: string; unit_price?: string
    }) => {
      const { data } = await api.post<ApiResponse<ExamDefinitionDetail>>('/catalog/exams/', payload)
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'exams'] }),
  })
}

export function useUpdateExamDefinition(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.patch<ApiResponse<ExamDefinitionDetail>>(`/catalog/exams/${id}/`, payload)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalog', 'exams', id] })
      qc.invalidateQueries({ queryKey: ['catalog', 'exams'] })
    },
  })
}

export function useDeactivateExamDefinition(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await api.post(`/catalog/exams/${id}/deactivate/`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog'] }),
  })
}

// ============================================================
// Lab Exam Settings
// ============================================================

export function useLabExamSettings(examId: string) {
  return useQuery({
    queryKey: ['catalog', 'exams', examId, 'settings'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<LabExamSettings | Record<string, never>>>(`/catalog/exams/${examId}/settings/`)
      return data.data
    },
    enabled: !!examId,
  })
}

export function useUpsertLabSettings(examId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      reference_range?: string; turnaround_hours_override?: number | null
      is_enabled?: boolean; internal_notes?: string
    }) => {
      const { data } = await api.put<ApiResponse<LabExamSettings>>(`/catalog/exams/${examId}/settings/`, payload)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalog', 'exams', examId] })
      qc.invalidateQueries({ queryKey: ['catalog', 'exams'] })
    },
  })
}

// ============================================================
// Pricing Rules
// ============================================================

export function usePricingRules(params?: { exam_definition_id?: string }) {
  const queryParams = params?.exam_definition_id
    ? undefined // Use nested endpoint
    : params

  const url = params?.exam_definition_id
    ? `/catalog/exams/${params.exam_definition_id}/pricing-rules/`
    : '/catalog/pricing-rules/'

  return useQuery({
    queryKey: ['catalog', 'pricing-rules', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PricingRule[]>>(url, { params: queryParams })
      return data
    },
  })
}

export function useCreatePricingRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post<ApiResponse<PricingRule>>('/catalog/pricing-rules/', payload)
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'pricing-rules'] }),
  })
}

export function useUpdatePricingRule(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.patch<ApiResponse<PricingRule>>(`/catalog/pricing-rules/${id}/`, payload)
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'pricing-rules'] }),
  })
}

export function useDeactivatePricingRule(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await api.post(`/catalog/pricing-rules/${id}/deactivate/`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'pricing-rules'] }),
  })
}
