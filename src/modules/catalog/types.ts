// -- Sample types --

export type SampleType = 'BLOOD' | 'URINE' | 'STOOL' | 'CSF' | 'SWAB' | 'SALIVA' | 'TISSUE' | 'OTHER'

export const SAMPLE_TYPE_OPTIONS: { value: SampleType; label: string }[] = [
  { value: 'BLOOD', label: 'Blood' },
  { value: 'URINE', label: 'Urine' },
  { value: 'STOOL', label: 'Stool' },
  { value: 'CSF', label: 'Cerebrospinal Fluid' },
  { value: 'SWAB', label: 'Swab' },
  { value: 'SALIVA', label: 'Saliva' },
  { value: 'TISSUE', label: 'Tissue' },
  { value: 'OTHER', label: 'Other' },
]

// -- Categories --

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

export interface ExamDefinitionListItem {
  id: string
  code: string
  name: string
  category_id: string
  category_name: string
  sample_type: SampleType
  turnaround_hours: number | null
  unit_price: string
  is_active: boolean
  is_enabled: boolean
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
  category: ExamCategoryListItem
  sample_type: SampleType
  turnaround_hours: number | null
  description: string
  unit_price: string
  is_active: boolean
  lab_settings: LabExamSettings | null
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
