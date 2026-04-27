export type LabelPrintMode = 'A4_SHEET' | 'THERMAL_ROLL'

export interface LabelPrintPreset {
  id: string
  code: string
  name: string
  print_mode: LabelPrintMode
  is_system: boolean
  page_width_mm: number
  page_height_mm: number
  label_width_mm: number
  label_height_mm: number
  margin_top_mm: number
  margin_left_mm: number
  horizontal_gap_mm: number
  vertical_gap_mm: number
  thermal_gap_mm: number
  show_barcode: boolean
  show_numeric_code: boolean
}

export interface LabelDefaults {
  page_width_mm: number
  page_height_mm: number
  label_width_mm: number
  label_height_mm: number
  margin_top_mm: number
  margin_left_mm: number
  horizontal_gap_mm: number
  vertical_gap_mm: number
  thermal_gap_mm: number
  show_barcode: boolean
  show_numeric_code: boolean
}

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

  // Result PDF protection
  lab_secret_code: string
  result_pdf_password_enabled: boolean
  result_pdf_password_mode: string
  result_pdf_password_hint: string

  // Notification channels
  notification_enable_secure_link: boolean
  notification_enable_whatsapp_share: boolean
  notification_enable_email: boolean
  notification_enable_sms: boolean

  // Billing
  financial_document_mode: 'INVOICE_ONLY' | 'STATEMENT_ONLY' | 'BOTH'
  default_invoice_vat_rate: number | null

  // Label printing — effective config (frozen snapshot; see backend)
  label_print_mode: LabelPrintMode
  label_preset: string | null
  label_page_width_mm: number
  label_page_height_mm: number
  label_label_width_mm: number
  label_label_height_mm: number
  label_margin_top_mm: number
  label_margin_left_mm: number
  label_horizontal_gap_mm: number
  label_vertical_gap_mm: number
  label_thermal_gap_mm: number
  label_show_barcode: boolean
  label_show_numeric_code: boolean

  updated_at: string
}

export type LabSettingsUpdate = Partial<Omit<LabSettings, 'updated_at'>>
