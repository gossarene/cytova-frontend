export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  platformApiBaseUrl: import.meta.env.VITE_PLATFORM_API_BASE_URL,
  onboardingApiBaseUrl: import.meta.env.VITE_ONBOARDING_API_BASE_URL || import.meta.env.VITE_PLATFORM_API_BASE_URL?.replace('/platform', '/onboarding') || '/api/v1/onboarding',
  appName: import.meta.env.VITE_APP_NAME || 'Cytova',
  domain: import.meta.env.VITE_DOMAIN || 'cytova.io',
} as const
