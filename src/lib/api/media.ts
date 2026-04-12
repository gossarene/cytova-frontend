import { env } from '@/config/env'

/**
 * Resolve a backend media URL to an absolute URL the browser can open
 * directly, regardless of deployment topology.
 *
 * Motivation
 * ----------
 * In production, Cytova uses S3/MinIO for file storage and the backend
 * returns fully-qualified signed URLs (``https://bucket.../...?sig=...``).
 * Those work as-is.
 *
 * In local development, the backend falls back to Django's
 * ``default_storage.url(file_key)`` which returns a path-relative URL
 * like ``/media/request-labels/.../batch.pdf`` — no origin. If the
 * frontend passes this straight to ``window.open``, the browser
 * resolves it against ``window.location.origin`` (the frontend dev
 * server), producing a 404 because the frontend has no /media route.
 *
 * Resolution rules
 * ----------------
 * 1. ``null``/``undefined``/empty → ``null`` (caller decides how to handle).
 * 2. Already absolute (``http://`` or ``https://``) → return as-is, no mutation.
 * 3. Path-relative + API base URL is absolute → prepend the API base
 *    URL's **origin** (scheme + host + port), so e.g.
 *    ``/media/foo.pdf`` with base ``http://localhost:8000/api/v1``
 *    becomes ``http://localhost:8000/media/foo.pdf``.
 * 4. Path-relative + API base URL is also relative (same-origin deploy,
 *    e.g. ``/api/v1``) → return the path unchanged. Browser will
 *    resolve against the frontend origin, which in a same-origin
 *    deployment is also the backend origin — correct by construction.
 *
 * Never uses ``window.location.origin`` for backend media files — that
 * is precisely what produces the dev-mode 404.
 */
export function resolveMediaUrl(
  url: string | null | undefined,
): string | null {
  if (!url) return null

  // Already absolute — trust it (includes S3/MinIO signed URLs).
  if (/^https?:\/\//i.test(url)) return url

  const base = env.apiBaseUrl
  // Same-origin deployment: the relative path will resolve correctly
  // against the frontend origin (== backend origin). Return unchanged.
  if (!base || !/^https?:\/\//i.test(base)) return url

  try {
    const origin = new URL(base).origin
    const path = url.startsWith('/') ? url : `/${url}`
    return `${origin}${path}`
  } catch {
    // URL parsing failed — fall back to the raw value so nothing
    // silently vanishes. The caller's download button will at least
    // trigger a visible 404 instead of opening about:blank.
    return url
  }
}
