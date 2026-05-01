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
  // Patient portal tokens are stored under a distinct namespace so a
  // browser session can hold both staff + patient credentials side by
  // side (e.g. an admin testing the patient flow) without one clobbering
  // the other. Patient endpoints read ONLY these keys.
  PATIENT_ACCESS_TOKEN: 'cytova_patient_access',
  PATIENT_REFRESH_TOKEN: 'cytova_patient_refresh',
} as const
