export interface ApiResponse<T> {
  data: T
  meta: ApiMeta | null
  errors: ApiError[]
}

export interface ApiMeta {
  pagination?: CursorPagination
}

export interface CursorPagination {
  count: number
  next_cursor: string | null
  previous_cursor: string | null
  has_next: boolean
  has_previous: boolean
}

export interface ApiError {
  code: string
  message: string
  field: string | null
  detail: Record<string, unknown>
}
