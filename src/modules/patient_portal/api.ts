import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { patientApi } from '@/lib/api/patient-client'
import { env } from '@/config/env'
import type { ApiResponse } from '@/lib/api/types'

export interface PatientMe {
  id: string
  email: string
  email_verified_at: string | null
  cytova_patient_id: string
  first_name: string
  last_name: string
  date_of_birth: string
  phone: string
}

export function usePatientMe() {
  return useQuery({
    queryKey: ['patient-portal', 'me'],
    queryFn: async () => {
      const { data } = await patientApi.get<ApiResponse<PatientMe>>('/me/')
      return data.data
    },
    staleTime: 60_000,
    retry: false,
  })
}

// ---------------------------------------------------------------------------
// Shared results
// ---------------------------------------------------------------------------

export interface PatientSharedResultFileRow {
  id: string
  filename: string
  /**
   * Path-only URL relative to the patient portal API base. Built
   * server-side from the opaque ``file_token``; the storage location
   * is never exposed.
   */
  download_url: string
}

export type PatientSharedChannel = 'CYTOVA' | 'EMAIL' | 'SHARE_LINK' | 'MANUAL'

export interface PatientSharedResultRow {
  id: string
  source_type: 'DIRECT' | 'PARTNER'
  source_name: string
  request_reference: string
  request_date: string | null
  result_available_date: string | null
  status: 'ACTIVE' | 'HIDDEN_BY_PATIENT' | 'REVOKED'
  /** Server-resolved friendly text — surface this to patients
   *  (never the raw ``status`` enum). */
  status_label: string
  /** True when never downloaded AND created within the recent window
   *  the backend defines (currently 14 days). Drives the "New" badge. */
  is_new: boolean
  last_downloaded_at: string | null
  download_count: number
  created_at: string
  files: PatientSharedResultFileRow[]
  /**
   * Lab-side internal version_number snapshotted at share time.
   * ``null`` for legacy rows that pre-date the version-tracking
   * migration. The card UI shows "Version N" when this is set, and
   * conditionally surfaces "View versions" when ``> 1`` (i.e. at
   * least one earlier version was also shared with this patient).
   */
  report_version_number: number | null
  shared_at: string | null
  /**
   * Empty string on legacy rows. The version-history dialog renders
   * a friendly label per channel — never the raw enum value.
   */
  shared_channel: PatientSharedChannel | ''
}

interface PatientSharedResultsListPayload {
  results: PatientSharedResultRow[]
}

export const PATIENT_RESULTS_KEY = ['patient-portal', 'results'] as const

export function usePatientResults() {
  return useQuery({
    queryKey: PATIENT_RESULTS_KEY,
    queryFn: async () => {
      const { data } = await patientApi.get<ApiResponse<PatientSharedResultsListPayload>>(
        '/results/',
      )
      return data.data.results
    },
    staleTime: 30_000,
    retry: false,
  })
}

/**
 * Build the absolute URL the browser should hit for a download. The
 * server returns a path-only URL (``/api/v1/...``) so we prefix it
 * with the patient portal API base. The ``file_token`` parameter is
 * the opaque value the server already substituted into ``download_url``;
 * we use it directly to keep the call site intent obvious.
 */
function _absoluteDownloadUrl(pathOnly: string): string {
  // env.patientPortalApiBaseUrl ends with ``/api/v1/patient-portal``;
  // the server-supplied ``download_url`` is the absolute path
  // ``/api/v1/patient-portal/results/files/<token>/download/``. To avoid
  // duplicating the ``/api/v1/patient-portal`` prefix, strip it from
  // the configured base and join with the path.
  const base = env.patientPortalApiBaseUrl.replace(/\/api\/v1\/patient-portal\/?$/, '')
  // Same-origin (no platform host configured) → just return the path.
  if (!base || base.startsWith('/')) return pathOnly
  return `${base}${pathOnly}`
}

/**
 * Trigger a browser download for a shared result file. Uses the
 * authenticated patient client (so the JWT is on the request), then
 * hands the resulting blob to a hidden anchor with ``download``. We
 * deliberately avoid ``window.open(url)`` because that would lose the
 * Authorization header.
 */
export async function downloadPatientResultFile(
  pathOnly: string, suggestedFilename: string,
): Promise<void> {
  const url = _absoluteDownloadUrl(pathOnly)
  const response = await patientApi.get<Blob>(url, { responseType: 'blob' })
  const blob = response.data
  const objectUrl = URL.createObjectURL(blob)
  try {
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = suggestedFilename || 'result.pdf'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  } finally {
    // Some browsers free the object URL on click; revoke after a tick
    // so the download has had a chance to start.
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000)
  }
}

export function useHidePatientResult() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await patientApi.delete(`/results/${id}/`)
      return id
    },
    onSuccess: (id) => {
      // Optimistically drop the row from the cached list; the next
      // refetch reconciles. Keeps the UI responsive without waiting
      // for a round-trip to the list endpoint.
      qc.setQueryData<PatientSharedResultRow[] | undefined>(
        PATIENT_RESULTS_KEY,
        (prev) => (prev ?? []).filter((r) => r.id !== id),
      )
      qc.invalidateQueries({ queryKey: PATIENT_RESULTS_KEY })
    },
  })
}


// ---------------------------------------------------------------------------
// Version history — per-source-request shared-version line
// ---------------------------------------------------------------------------

export interface PatientResultVersionRow {
  id: string
  /**
   * Lab-side internal version number. Always present on rows produced
   * by Notify-Cytova; ``null`` only on legacy rows that pre-date the
   * version-tracking migration.
   */
  version_number: number | null
  shared_at: string | null
  shared_channel: PatientSharedChannel | ''
  /** Per the spec: ``CURRENT`` for the row marked current_for_patient,
   *  ``SUPERSEDED`` for any older patient-visible version. The patient
   *  view never sees REVOKED / HIDDEN rows so two values are enough. */
  status: 'CURRENT' | 'SUPERSEDED'
  /** Path-only download URL — same shape as on the list endpoint.
   *  ``null`` defensively when the version has no file row. */
  download_url: string | null
}

export interface PatientResultCurrentVersion {
  version_number: number | null
  shared_at: string | null
  shared_channel: PatientSharedChannel | ''
  download_url: string | null
}

export interface PatientResultVersionsPayload {
  result_id: string
  current_version: PatientResultCurrentVersion | null
  versions: PatientResultVersionRow[]
}

/**
 * Fetch the patient-visible version history for a single shared
 * result. Enabled only when ``id`` is non-empty so the dialog can
 * mount without immediately firing a query for an unselected row.
 *
 * The backend surfaces ONLY versions actually shared with the
 * authenticated patient — internal lab regenerations that were
 * never shared are structurally invisible (no row exists).
 */
export function useResultVersions(id: string | null) {
  return useQuery({
    queryKey: ['patient-portal', 'results', id, 'versions'],
    enabled: id !== null && id !== '',
    queryFn: async () => {
      const { data } = await patientApi.get<ApiResponse<PatientResultVersionsPayload>>(
        `/results/${id}/versions/`,
      )
      return data.data
    },
    staleTime: 30_000,
    retry: false,
  })
}


// ---------------------------------------------------------------------------
// Logout — server-side blacklist + local session drop
// ---------------------------------------------------------------------------

export interface PatientLogoutOptions {
  /** When true, blacklist every outstanding token for the account
   *  (kills every browser / device the patient is signed in from). */
  all_sessions?: boolean
}

/**
 * Sign out a patient by blacklisting their current tokens server-side
 * AND clearing the local store. Always performs the local clear, even
 * if the network call fails — a stuck server should not leave the
 * patient in a half-signed-in state.
 *
 * Usage: ``await logoutPatient({ all_sessions: true })``.
 */
export async function logoutPatient(
  options: PatientLogoutOptions = {},
): Promise<void> {
  // Pull the refresh token before we wipe the store — sending it
  // lets the backend blacklist the refresh row alongside the access
  // row in one round-trip.
  const { usePatientAuthStore } = await import('@/lib/auth/patient-store')
  const refreshToken = usePatientAuthStore.getState().refreshToken
  try {
    await patientApi.post('/logout/', {
      refresh_token: refreshToken ?? undefined,
      all_sessions: options.all_sessions ?? false,
    })
  } catch {
    // Swallow — local logout still happens. The 401 interceptor
    // would also fire if the access token is already invalid, but
    // we explicitly catch here so the local clear is unconditional.
  } finally {
    usePatientAuthStore.getState().logout()
  }
}
