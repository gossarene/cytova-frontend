import { create } from 'zustand'
import { LOCAL_STORAGE_KEYS } from '@/config/constants'

/**
 * Patient portal auth store — parallel to ``useAuthStore`` for staff.
 *
 * Patient sessions are deliberately kept separate from staff sessions:
 *   - distinct localStorage namespace (``cytova_patient_*``) so an
 *     admin testing the patient flow doesn't lose their lab session;
 *   - distinct in-memory store so guards / interceptors check the
 *     right side without conditional logic;
 *   - no ``role`` / ``permissions`` shape — patient tokens carry only
 *     identity, no RBAC claims.
 */
export interface PatientUser {
  id: string
  email: string
  cytovaPatientId: string
  firstName: string
  lastName: string
}

export interface PatientLoginResponse {
  access_token: string
  refresh_token: string
  patient: {
    id: string
    email: string
    cytova_patient_id: string
    first_name: string
    last_name: string
  }
}

interface PatientAuthState {
  accessToken: string | null
  refreshToken: string | null
  patient: PatientUser | null
  isAuthenticated: boolean

  login: (response: PatientLoginResponse) => void
  setPatient: (patient: PatientUser) => void
  logout: () => void
}

export const usePatientAuthStore = create<PatientAuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  patient: null,
  isAuthenticated: false,

  login: (response) => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.PATIENT_ACCESS_TOKEN, response.access_token)
    localStorage.setItem(LOCAL_STORAGE_KEYS.PATIENT_REFRESH_TOKEN, response.refresh_token)
    set({
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      patient: {
        id: response.patient.id,
        email: response.patient.email,
        cytovaPatientId: response.patient.cytova_patient_id,
        firstName: response.patient.first_name,
        lastName: response.patient.last_name,
      },
      isAuthenticated: true,
    })
  },

  setPatient: (patient) => set({ patient }),

  logout: () => {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.PATIENT_ACCESS_TOKEN)
    localStorage.removeItem(LOCAL_STORAGE_KEYS.PATIENT_REFRESH_TOKEN)
    set({
      accessToken: null,
      refreshToken: null,
      patient: null,
      isAuthenticated: false,
    })
  },
}))

/**
 * Hydrate the patient store from localStorage on app start. Mirrors
 * ``hydrateAuth()`` for the staff store but reads the patient namespace
 * keys. Profile fields are populated lazily by the dashboard via
 * ``GET /me/`` on first paint — token alone is enough to mark the
 * session active so guards don't bounce the user mid-flight.
 */
export function hydratePatientAuth(): void {
  const accessToken = localStorage.getItem(LOCAL_STORAGE_KEYS.PATIENT_ACCESS_TOKEN)
  const refreshToken = localStorage.getItem(LOCAL_STORAGE_KEYS.PATIENT_REFRESH_TOKEN)
  if (!accessToken || !refreshToken) return
  usePatientAuthStore.setState({
    accessToken,
    refreshToken,
    isAuthenticated: true,
  })
}
