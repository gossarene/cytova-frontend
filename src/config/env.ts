/**
 * Resolve the tenant API base URL.
 *
 * Resolution order:
 *
 *   1. `VITE_API_BASE_URL` — explicit override. Honoured when set, so existing
 *      dev `.env` files (and CI/test setups that pin the URL) keep working.
 *
 *   2. Browser-derived from `window.location.hostname`. Matches the current
 *      tenant subdomain automatically:
 *        - Dev (`import.meta.env.DEV`): frontend serves on 3000, backend on
 *          8000, so derive `<protocol>//<hostname>:8000/api/v1`.
 *          Example: `http://veno-lab.cytova.io:3000` → tenant API at
 *          `http://veno-lab.cytova.io:8000/api/v1`.
 *        - Prod: same-origin behind a reverse proxy, no explicit port.
 *          Example: `https://veno-lab.cytova.io` → tenant API at
 *          `https://veno-lab.cytova.io/api/v1`.
 *
 *   3. Last-resort `'/api/v1'` for environments without `window` (SSR/tests).
 *
 * The platform/onboarding API is intentionally NOT subdomain-aware — it lives
 * on a fixed host (admin/onboarding) and is configured via
 * `VITE_PLATFORM_API_BASE_URL`. Do not derive it from the current hostname.
 */
function getTenantApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL
  if (fromEnv) return fromEnv

  if (typeof window !== 'undefined' && window.location?.hostname) {
    const { protocol, hostname } = window.location
    if (import.meta.env.DEV) {
      return `${protocol}//${hostname}:8000/api/v1`
    }
    return `${protocol}//${hostname}/api/v1`
  }

  return '/api/v1'
}

// Onboarding lives under the platform host at /api/v1/platform/onboarding/.
// Default to the platform base URL with the onboarding suffix appended.
const platformBase = import.meta.env.VITE_PLATFORM_API_BASE_URL
const defaultOnboardingBase = platformBase ? `${platformBase}/onboarding` : '/api/v1/platform/onboarding'

// Patient portal lives at /api/v1/patient-portal/ — same host as the
// platform API but NOT under the /platform/ prefix (the patient surface
// is global, not platform-admin scoped). Strip a trailing /platform
// from the configured base if present so a single
// VITE_PLATFORM_API_BASE_URL feeds both clients.
function buildPatientPortalBase(): string {
  const explicit = import.meta.env.VITE_PATIENT_PORTAL_API_BASE_URL
  if (explicit) return explicit
  if (platformBase) {
    return platformBase.replace(/\/platform\/?$/, '') + '/patient-portal'
  }
  return '/api/v1/patient-portal'
}

export const env = {
  apiBaseUrl: getTenantApiBaseUrl(),
  platformApiBaseUrl: platformBase,
  onboardingApiBaseUrl: import.meta.env.VITE_ONBOARDING_API_BASE_URL || defaultOnboardingBase,
  patientPortalApiBaseUrl: buildPatientPortalBase(),
  appName: import.meta.env.VITE_APP_NAME || 'Cytova',
  domain: import.meta.env.VITE_DOMAIN || 'cytova.io',
} as const
