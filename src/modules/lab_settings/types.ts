export interface LabSettings {
  // Laboratory identity
  lab_name: string
  lab_subtitle: string
  logo_file_key: string
  logo_url: string
  has_logo_file: boolean
  logo_preview_url: string | null
  address: string
  phone: string
  email: string
  website: string
  signature_file_key: string
  legal_footer: string

  // Report display options
  show_logo: boolean
  show_lab_address: boolean
  show_prescriber: boolean
  show_collection_datetime: boolean
  show_patient_age: boolean
  show_patient_sex: boolean
  show_exam_technique: boolean
  show_reference_ranges: boolean
  show_patient_comments: boolean
  show_final_conclusion: boolean
  show_signature: boolean
  show_legal_footer: boolean
  show_abnormal_flags: boolean

  updated_at: string
}

export type LabSettingsUpdate = Partial<Omit<LabSettings, 'updated_at'>>
