// -- Sample types --
//
// The canonical source of truth is the backend /catalog/sample-types/ endpoint
// (see useSampleTypes()). The literal union below is kept only as a TypeScript
// narrow so exam-detail payloads stay strictly typed; the fallback array is used
// when the hook is not available (e.g. during initial render). Do not extend
// without a matching backend migration.

export type SampleType = 'BLOOD' | 'URINE' | 'STOOL' | 'CSF' | 'SWAB' | 'SALIVA' | 'TISSUE' | 'OTHER'

export interface SampleTypeOption {
  value: string
  label: string
}

export const SAMPLE_TYPE_FALLBACK: SampleTypeOption[] = [
  { value: 'BLOOD', label: 'Blood' },
  { value: 'URINE', label: 'Urine' },
  { value: 'STOOL', label: 'Stool' },
  { value: 'CSF', label: 'Cerebrospinal Fluid' },
  { value: 'SWAB', label: 'Swab' },
  { value: 'SALIVA', label: 'Saliva' },
  { value: 'TISSUE', label: 'Tissue' },
  { value: 'OTHER', label: 'Other' },
]

/**
 * @deprecated Use `useSampleTypes()` instead. Kept as an alias so existing
 * imports compile while the migration proceeds.
 */
export const SAMPLE_TYPE_OPTIONS = SAMPLE_TYPE_FALLBACK

// -- Reference data --

export interface ExamFamilyItem {
  id: string
  name: string
  description: string
  display_order: number
  is_active: boolean
  created_at: string
}

export interface ExamSubFamilyItem {
  id: string
  family_id: string
  family_name?: string
  name: string
  is_active: boolean
  created_at: string
}

export interface TubeTypeItem {
  id: string
  name: string
  description: string
  is_active: boolean
  created_at: string
}

export interface ExamTechniqueItem {
  id: string
  name: string
  description: string
  is_active: boolean
  created_at: string
}

// -- Legacy categories (kept for backward compatibility) --

export interface ExamCategoryListItem {
  id: string
  name: string
  description: string
  display_order: number
  is_active: boolean
  created_at: string
}

export interface ExamCategoryDetail extends ExamCategoryListItem {
  updated_at: string
}

// -- Exam Definitions --

export type ResultStructure = 'SINGLE_VALUE' | 'MULTI_PARAMETER'

export const RESULT_STRUCTURE_OPTIONS: { value: ResultStructure; label: string }[] = [
  { value: 'SINGLE_VALUE', label: 'Single Value' },
  { value: 'MULTI_PARAMETER', label: 'Multi-Parameter' },
]

export interface ExamParameterItem {
  id: string
  code: string
  name: string
  unit: string
  reference_range: string
  display_order: number
  is_active: boolean
  created_at: string
}

export interface ExamDefinitionListItem {
  id: string
  code: string
  name: string
  family_id: string | null
  family_name: string | null
  sub_family_id: string | null
  sub_family_name: string | null
  tube_type_id: string | null
  tube_type_name: string | null
  technique_id: string | null
  technique_name: string | null
  fasting_required: boolean
  result_structure: ResultStructure
  unit: string
  reference_range: string
  sample_type: SampleType
  turnaround_hours: number | null
  unit_price: string
  is_active: boolean
  is_enabled: boolean
  parameters_count: number
  category_id: string | null
  category_name: string | null
  created_at: string
}

export interface LabExamSettings {
  id: string
  reference_range: string
  turnaround_hours_override: number | null
  is_enabled: boolean
  internal_notes: string
  updated_at: string
}

export interface ExamDefinitionDetail {
  id: string
  code: string
  name: string
  family: ExamFamilyItem | null
  sub_family: ExamSubFamilyItem | null
  tube_type: TubeTypeItem | null
  technique: ExamTechniqueItem | null
  fasting_required: boolean
  result_structure: ResultStructure
  unit: string
  reference_range: string
  sample_type: SampleType
  turnaround_hours: number | null
  description: string
  unit_price: string
  is_active: boolean
  lab_settings: LabExamSettings | null
  parameters: ExamParameterItem[]
  category: ExamCategoryListItem | null
  created_at: string
  updated_at: string
}

// -- Pricing Rules --

export type PricingType = 'FIXED_PRICE' | 'PERCENTAGE_DISCOUNT'

export const PRICING_TYPE_OPTIONS: { value: PricingType; label: string }[] = [
  { value: 'FIXED_PRICE', label: 'Fixed Price' },
  { value: 'PERCENTAGE_DISCOUNT', label: 'Percentage Discount' },
]

export interface PricingRule {
  id: string
  exam_definition_id: string
  exam_code: string
  exam_name: string
  partner_organization_id: string | null
  partner_organization_name: string | null
  source_type: string
  pricing_type: PricingType
  value: string
  priority: number
  is_active: boolean
  start_date: string | null
  end_date: string | null
  notes: string
  created_by: { id: string; email: string } | null
  created_at: string
  updated_at: string
}
