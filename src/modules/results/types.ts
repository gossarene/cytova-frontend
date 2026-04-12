export type ResultStatus = 'DRAFT' | 'SUBMITTED' | 'REJECTED' | 'VALIDATED' | 'PUBLISHED'

export const RESULT_STATUS_LABELS: Record<ResultStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  REJECTED: 'Rejected',
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
  version_number: number
  is_current: boolean
  status: ResultStatus
  is_abnormal: boolean
  result_value: string
  result_unit: string
  entered_by_email: string | null
  entered_at: string
  submitted_at: string | null
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
  version_number: number
  is_current: boolean
  status: ResultStatus
  result_value: string
  result_unit: string
  reference_range: string
  is_abnormal: boolean
  comments: string
  internal_notes: string
  notes: string
  entered_by_email: string | null
  entered_at: string
  submitted_by_email: string | null
  submitted_at: string | null
  validation_notes: string
  validated_by_email: string | null
  validated_at: string | null
  rejection_notes: string
  rejected_by_email: string | null
  rejected_at: string | null
  published_by_email: string | null
  published_at: string | null
  files: ResultFile[]
  created_at: string
  updated_at: string
}

export interface SignedDownloadURL {
  url: string
  expires_in: number
  filename: string
}
