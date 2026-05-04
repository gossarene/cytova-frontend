/**
 * Cytova — Safe placeholder substitution for operator-customisable
 * patient notification email templates (TypeScript port).
 *
 * One-for-one mirror of ``common/email/safe_template.py``. Both
 * sides MUST stay aligned: the UI uses these helpers for the live
 * preview + client-side validation hint, and the backend enforces
 * the same rules at save (serializer validator) and at render
 * (email service). Drift would either let an unsafe template ship
 * or render different output between preview and the real email.
 *
 * Why no template engine
 * ----------------------
 * The product requirement is "string substitution with four named
 * slots." Anything more powerful (filters, conditionals, attribute
 * access) is unnecessary expressive power that would have to be
 * sandboxed against medical-content leakage. The regex below
 * matches strict identifier names only — anything outside that
 * shape (``{{ var.attr }}``, ``{{ var | upper }}``, ``{{ f() }}``)
 * is left literal in the output and the renderer never executes
 * any code path through it.
 */

/**
 * Allow-list of placeholders an operator may use in patient-result
 * notification emails. Adding to this set is a deliberate model
 * change — every variable here flows into a tenant-customisable
 * email body and must clear the confidentiality review documented
 * in the backend module's docstring (no medical content, no raw
 * tokens, no password hashes).
 *
 * Pinned to exactly four names: spec §2 authorises these and only
 * these. Mirrors the backend ``PATIENT_NOTIFICATION_ALLOWED_VARS``.
 */
export const PATIENT_NOTIFICATION_ALLOWED_VARS: ReadonlySet<string> = new Set([
  'patient_first_name',
  'lab_name',
  'result_link',
  'request_reference',
])


// Regex matching ``{{ var }}`` with optional whitespace inside the
// braces. The variable name must be a Python-style identifier
// (letters, digits, underscore; cannot start with a digit). Filter
// pipes (``{{ var | upper }}``) and attribute access
// (``{{ var.attr }}``) deliberately fail to match — the whole
// expression is treated as literal text and renders verbatim.
//
// Global flag is essential — without it, ``replace`` and
// ``matchAll`` would only touch the first occurrence.
const PLACEHOLDER_RE = /\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g


/**
 * Return the sorted distinct list of placeholder names referenced
 * in ``template`` that are NOT in ``allowed``.
 *
 * Empty / all-allowed templates return ``[]`` — the UI treats that
 * as "preview is safe to render" and does NOT show the warning
 * banner.
 *
 * Deduplicated + sorted so the warning UI is deterministic across
 * renders (an operator typing the same bad placeholder twice sees
 * one entry, not two; the order doesn't shuffle when they correct
 * one of them).
 */
export function findDisallowedVariables(
  template: string,
  allowed: ReadonlySet<string> = PATIENT_NOTIFICATION_ALLOWED_VARS,
): string[] {
  if (!template) return []
  const found = new Set<string>()
  // ``matchAll`` consumes the whole template in one pass, even when
  // the regex has the global flag (``replace`` with the global flag
  // would also work but ``matchAll`` reads cleaner — we want the
  // names, not the substitution).
  for (const match of template.matchAll(PLACEHOLDER_RE)) {
    found.add(match[1])
  }
  const result: string[] = []
  for (const name of found) {
    if (!allowed.has(name)) result.push(name)
  }
  result.sort()
  return result
}


/**
 * HTML-escape per ``html.escape(value, quote=True)`` semantics.
 *
 * Why custom (vs. a dependency)
 * -----------------------------
 * The five-character substitution is small enough that a dependency
 * would be heavier than the code itself. The sequence MUST escape
 * ``&`` first — otherwise the subsequent escapes' own ``&`` would
 * get re-escaped (``<`` → ``&lt;`` → ``&amp;lt;``).
 */
function _escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}


/**
 * Substitute allow-listed placeholders with values from ``context``.
 *
 * Behaviour (mirrors backend exactly)
 * -----------------------------------
 * - Only names in ``PATIENT_NOTIFICATION_ALLOWED_VARS`` are
 *   substituted. Unknown placeholders are left **unchanged** in
 *   the output (visible-typo principle — typos surface in the
 *   preview so the operator self-corrects). The save-time
 *   validator catches them on the standard path; this is the
 *   safety net.
 * - Allow-listed names missing from ``context`` render as the
 *   empty string. The UI passes a complete sample context for
 *   the preview, so this branch is rare in practice — but if a
 *   future caller forgets a key, the output stays clean instead
 *   of showing ``"undefined"``.
 * - When ``escapeHtml=true`` substituted values are HTML-escaped.
 *   Use this for the HTML preview block; use ``false`` for the
 *   plain-text preview block.
 */
export function renderSafeNotificationTemplate(
  template: string,
  context: Readonly<Record<string, string>>,
  options: { escapeHtml?: boolean } = {},
): string {
  if (!template) return ''
  const escapeHtml = options.escapeHtml ?? false
  return template.replace(PLACEHOLDER_RE, (whole, name: string) => {
    if (!PATIENT_NOTIFICATION_ALLOWED_VARS.has(name)) {
      // Unknown placeholder — leave the original ``{{ ... }}`` in
      // place. The preview shows the literal so the operator can
      // see what they typed.
      return whole
    }
    const raw = context[name] ?? ''
    return escapeHtml ? _escapeHtml(raw) : raw
  })
}
