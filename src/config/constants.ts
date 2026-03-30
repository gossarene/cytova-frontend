export const PAGINATION_DEFAULT_PAGE_SIZE = 20
export const PAGINATION_SIZE_OPTIONS = [20, 50, 100]
export const TOKEN_REFRESH_BUFFER_MS = 60_000
export const DEBOUNCE_SEARCH_MS = 300
export const TOAST_SUCCESS_DURATION = 4_000
export const TOAST_ERROR_DURATION = Infinity
export const TOAST_WARNING_DURATION = 6_000

export const LOCAL_STORAGE_KEYS = {
  ACCESS_TOKEN: 'cytova_auth_access',
  REFRESH_TOKEN: 'cytova_auth_refresh',
} as const
