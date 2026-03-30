export type ResultStatus = 'DRAFT' | 'PENDING_VALIDATION' | 'VALIDATED' | 'PUBLISHED'

export const RESULT_STATUS_LABELS: Record<ResultStatus, string> = {
  DRAFT: 'Draft',
  PENDING_VALIDATION: 'Pending Validation',
  VALIDATED: 'Validated',
  PUBLISHED: 'Published',
}

export interface ResultFile {
  id: string
  original_filename: string
  mime_type: string
  file_size: number
  file_size_kb: number
  uploaded_by_email: string | null
  created_at: string
}

export interface ResultListItem {
  id: string
  item_id: string
  exam_code: string
  exam_name: string
  request_number: string
  status: ResultStatus
  is_abnormal: boolean
  result_value: string
  result_unit: string
  validated_at: string | null
  published_at: string | null
  files_count: number
  created_at: string
}

export interface ResultDetail {
  id: string
  item_id: string
  exam_code: string
  exam_name: string
  request_number: string
  status: ResultStatus
  result_value: string
  result_unit: string
  reference_range: string
  is_abnormal: boolean
  comments: string
  internal_notes: string
  validation_notes: string
  validated_by_email: string | null
  validated_at: string | null
  published_by_email: string | null
  published_at: string | null
  created_by_email: string | null
  files: ResultFile[]
  created_at: string
  updated_at: string
}

export interface SignedDownloadURL {
  url: string
  expires_in: number
  filename: string
}
