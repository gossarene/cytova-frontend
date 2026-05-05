/**
 * Public-vs-tenant host detection.
 *
 * The same SPA bundle is served on the platform host
 * (``cytova.io`` / ``www.cytova.io``) AND on every tenant subdomain
 * (``golab-medical.cytova.io``). The two audiences land on different
 * routes for the same URL — most importantly ``/login``:
 *
 *   - Public host  → ``PatientLoginPage`` (sign in to the
 *     patient portal)
 *   - Tenant host  → staff ``LoginPage`` (lab user authentication)
 *
 * Routing decisions read this helper instead of duplicating the
 * hostname check at every callsite. Keeping it single-source means
 * a future "custom tenant domain" feature only needs to extend
 * here.
 *
 * Detection rules
 * ---------------
 *   - The configured root domain (``env.domain``, default
 *     ``cytova.io``) is public. ``www.<domain>`` likewise.
 *   - Any other host that ends with ``.<domain>`` is a tenant
 *     subdomain. Two-segment subdomains
 *     (``branch.golab-medical.cytova.io``) are still considered
 *     tenant — only the literal root and ``www`` are public.
 *   - Local dev: ``localhost`` / ``127.0.0.1`` are public so
 *     ``http://localhost:3000/login`` shows the patient login by
 *     default. Tenant dev hosts are typically reached via
 *     ``<slug>.cytova.io.localhost`` or
 *     ``<slug>.localtest.me`` — both have a leading subdomain
 *     part, so they fall through to the tenant branch.
 *
 * The helper accepts ``hostname`` as a parameter (rather than
 * reading ``window.location`` directly) so it stays trivially
 * testable in pure-Jest contexts without DOM. Production callers
 * pass ``window.location.hostname``.
 */
import { env } from '@/config/env'

const LOCALHOST_HOSTS = new Set(['localhost', '127.0.0.1', '::1'])

export function isPublicHost(hostname: string): boolean {
  const h = hostname.toLowerCase()

  // Local dev with no subdomain → treat as public.
  if (LOCALHOST_HOSTS.has(h)) return true

  const domain = env.domain.toLowerCase()
  if (h === domain) return true
  if (h === `www.${domain}`) return true

  return false
}
