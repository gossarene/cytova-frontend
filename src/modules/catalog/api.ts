import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import type { ApiResponse } from '@/lib/api/types'
import type {
  ExamFamilyItem, ExamSubFamilyItem,
  TubeTypeItem, ExamTechniqueItem, SampleTypeOption,
  ExamDefinitionListItem, ExamDefinitionDetail,
  PricingRule, LabExamSettings,
} from './types'

// ============================================================
// Families — canonical endpoint /catalog/families/
// ============================================================

export function useFamilies(params?: { is_active?: string; search?: string }) {
  return useQuery({
    queryKey: ['catalog', 'families', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ExamFamilyItem[]>>('/catalog/families/', { params })
      return data
    },
  })
}

export function useFamily(id: string) {
  return useQuery({
    queryKey: ['catalog', 'families', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ExamFamilyItem>>(`/catalog/families/${id}/`)
      return data.data
    },
    enabled: !!id,
  })
}

export function useCreateFamily() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name: string; description?: string; display_order?: number }) => {
      const { data } = await api.post<ApiResponse<ExamFamilyItem>>('/catalog/families/', payload)
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'families'] }),
  })
}

export function useUpdateFamily(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name?: string; description?: string; display_order?: number }) => {
      const { data } = await api.patch<ApiResponse<ExamFamilyItem>>(`/catalog/families/${id}/`, payload)
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'families'] }),
  })
}

export function useDeactivateFamily(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await api.post(`/catalog/families/${id}/deactivate/`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'families'] }),
  })
}

export function useReactivateFamily(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await api.post(`/catalog/families/${id}/reactivate/`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'families'] }),
  })
}

// ============================================================
// Sub-families — canonical endpoint /catalog/sub-families/
// family_id filter is first-class and drives the cascading dropdown.
// ============================================================

/**
 * @param familyId   Optional — restricts results to sub-families of that family.
 * @param activeOnly Defaults to ``true`` so the cascading dropdown in the
 *                   Exam Definition dialog never proposes an inactive option.
 *                   Management screens that need to show deactivated
 *                   sub-families (for reactivation) must pass ``false``.
 */
export function useSubFamilies(familyId?: string, activeOnly = true) {
  return useQuery({
    queryKey: ['catalog', 'sub-families', familyId ?? 'all', activeOnly],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (activeOnly) params.is_active = 'true'
      if (familyId) params.family_id = familyId
      const { data } = await api.get<ApiResponse<ExamSubFamilyItem[]>>(
        '/catalog/sub-families/', { params },
      )
      return data.data ?? []
    },
  })
}

/**
 * Management-screen variant of useSubFamilies that exposes ``is_active`` and
 * ``search`` as explicit query params. Distinct from ``useSubFamilies`` so
 * the Exam Definition cascading dropdown (which needs the safe activeOnly
 * default) stays untouched. Cache key lives under the same
 * ``['catalog', 'sub-families']`` prefix, so existing mutation invalidations
 * refresh both hooks.
 */
export function useSubFamiliesList(params?: {
  family_id?: string
  is_active?: string
  search?: string
}) {
  return useQuery({
    queryKey: ['catalog', 'sub-families', 'list', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ExamSubFamilyItem[]>>(
        '/catalog/sub-families/', { params },
      )
      return data.data ?? []
    },
  })
}

export function useCreateSubFamily() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { family_id: string; name: string }) => {
      const { data } = await api.post<ApiResponse<ExamSubFamilyItem>>(
        '/catalog/sub-families/', payload,
      )
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'sub-families'] }),
  })
}

export function useUpdateSubFamily(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name?: string }) => {
      const { data } = await api.patch<ApiResponse<ExamSubFamilyItem>>(
        `/catalog/sub-families/${id}/`, payload,
      )
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'sub-families'] }),
  })
}

export function useDeactivateSubFamily(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await api.post(`/catalog/sub-families/${id}/deactivate/`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'sub-families'] }),
  })
}

export function useReactivateSubFamily(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await api.post(`/catalog/sub-families/${id}/reactivate/`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'sub-families'] }),
  })
}

// ============================================================
// Tube types — canonical endpoint /catalog/tube-types/
// ============================================================

export function useTubeTypes(params?: { is_active?: string; search?: string }) {
  return useQuery({
    queryKey: ['catalog', 'tube-types', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<TubeTypeItem[]>>(
        '/catalog/tube-types/', { params },
      )
      return data.data ?? []
    },
  })
}

export function useCreateTubeType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name: string; description?: string }) => {
      const { data } = await api.post<ApiResponse<TubeTypeItem>>(
        '/catalog/tube-types/', payload,
      )
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'tube-types'] }),
  })
}

export function useUpdateTubeType(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name?: string; description?: string }) => {
      const { data } = await api.patch<ApiResponse<TubeTypeItem>>(
        `/catalog/tube-types/${id}/`, payload,
      )
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'tube-types'] }),
  })
}

export function useDeactivateTubeType(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await api.post(`/catalog/tube-types/${id}/deactivate/`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'tube-types'] }),
  })
}

export function useReactivateTubeType(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await api.post(`/catalog/tube-types/${id}/reactivate/`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'tube-types'] }),
  })
}

// ============================================================
// Techniques — canonical endpoint /catalog/techniques/
// ============================================================

export function useTechniques(params?: { is_active?: string; search?: string }) {
  return useQuery({
    queryKey: ['catalog', 'techniques', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ExamTechniqueItem[]>>(
        '/catalog/techniques/', { params },
      )
      return data.data ?? []
    },
  })
}

export function useCreateTechnique() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name: string; description?: string }) => {
      const { data } = await api.post<ApiResponse<ExamTechniqueItem>>(
        '/catalog/techniques/', payload,
      )
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'techniques'] }),
  })
}

export function useUpdateTechnique(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name?: string; description?: string }) => {
      const { data } = await api.patch<ApiResponse<ExamTechniqueItem>>(
        `/catalog/techniques/${id}/`, payload,
      )
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'techniques'] }),
  })
}

export function useDeactivateTechnique(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await api.post(`/catalog/techniques/${id}/deactivate/`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'techniques'] }),
  })
}

export function useReactivateTechnique(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await api.post(`/catalog/techniques/${id}/reactivate/`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'techniques'] }),
  })
}

// ============================================================
// Sample types — read-only enumeration exposed by the backend.
// ============================================================

export function useSampleTypes() {
  return useQuery({
    queryKey: ['catalog', 'sample-types'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<SampleTypeOption[]>>(
        '/catalog/sample-types/',
      )
      return data.data ?? []
    },
    staleTime: 60 * 60 * 1000, // 1h — the taxonomy only changes on a backend deploy
  })
}

// ============================================================
// Exam Definitions
// ============================================================

export interface ExamListParams {
  search?: string
  family_id?: string
  sub_family_id?: string
  tube_type_id?: string
  technique_id?: string
  sample_type?: string
  is_active?: string
  is_enabled?: string
  fasting_required?: string
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
    mutationFn: async (payload: Record<string, unknown>) => {
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
  const queryParams = params?.exam_definition_id ? undefined : params
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
