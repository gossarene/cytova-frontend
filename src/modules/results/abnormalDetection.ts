/**
 * Cytova — Reference-range parsing and abnormal-flag detection
 * (TypeScript port).
 *
 * One-for-one mirror of ``apps/results/abnormal_detection.py``. Both
 * sides MUST stay aligned: the UI uses these helpers to drive the
 * auto-flag in real time, and any future server-side recompute
 * (imports, bulk revalidation) goes through the Python helpers. If
 * the two ever drift, the same value would render different abnormal
 * states on the form vs in the database.
 *
 * Inclusivity simplification (mirrors backend docstring)
 * -----------------------------------------------------
 * The spec rule is ``min <= value <= max → normal``. We treat ``<X``
 * and ``>X`` as inclusive bounds (``max=X`` and ``min=X``
 * respectively) because storing the strict-vs-inclusive distinction
 * would balloon the return shape and the operator can always toggle
 * manually. ``<=X`` / ``≤X`` / ``>=X`` / ``≥X`` parse identically.
 */

// Hyphen-like characters we accept as a range separator. The set
// matches the backend exactly.
//   ``-``  ASCII hyphen-minus  (U+002D)
//   ``–``  en-dash             (U+2013)
//   ``—``  em-dash             (U+2014)
const DASH_CLASS = '[-–—]'

// A single decimal number with optional leading sign and optional
// comma-or-dot decimal separator. Captured as one group so the
// caller can normalise the comma to a dot before parseFloat.
const NUMBER = '[+-]?\\d+(?:[.,]\\d+)?'

// Compiled patterns — once at module load. ``^`` anchors so we
// always parse from the start of the trimmed input.
const RE_NUMBER_ONLY = new RegExp(`^\\s*(${NUMBER})\\s*$`)
const RE_RANGE = new RegExp(
  `^\\s*(${NUMBER})\\s*${DASH_CLASS}\\s*(${NUMBER})\\b`,
)
const RE_RANGE_TO = new RegExp(
  `^\\s*(${NUMBER})\\s+to\\s+(${NUMBER})\\b`,
  'i',
)
// Bounded-only patterns. Two-character operators (``<=`` / ``>=``)
// are tested before the bare single-character ones — otherwise
// ``<=5`` would mis-parse as ``<`` plus ``=5``. The Unicode
// ``≤`` (U+2264) and ``≥`` (U+2265) parse identically.
const RE_LE = new RegExp(`^\\s*(?:<=|≤)\\s*(${NUMBER})\\b`)
const RE_GE = new RegExp(`^\\s*(?:>=|≥)\\s*(${NUMBER})\\b`)
const RE_LT = new RegExp(`^\\s*<\\s*(${NUMBER})\\b`)
const RE_GT = new RegExp(`^\\s*>\\s*(${NUMBER})\\b`)


/**
 * Parse a single numeric token to ``number``, or return ``null``
 * when the input doesn't represent a finite number.
 *
 * Conventions
 * -----------
 * - Whitespace is stripped (spec §2 ``"trim spaces"``).
 * - Comma decimals are accepted (spec §2 ``"5,6" → 5.6``). The
 *   original string is NEVER mutated; this helper is comparison-
 *   side only.
 * - Empty / non-numeric input returns ``null`` (the caller maps
 *   this to "don't auto-change").
 * - ``NaN`` / ``Infinity`` are rejected — they'd produce nonsense
 *   comparisons later.
 */
export function parseNumeric(text: string): number | null {
  if (!text) return null
  const candidate = text.trim().replace(',', '.')
  const match = RE_NUMBER_ONLY.exec(candidate)
  if (match === null) return null
  const result = parseFloat(match[1])
  if (!Number.isFinite(result)) return null
  return result
}


/** A two-sided reference-range bound. ``null`` on either side means
 *  "no bound on this side"; ``[null, null]`` means "indeterminate,
 *  caller MUST leave the abnormal flag alone". */
export type ReferenceBounds = readonly [number | null, number | null]


/**
 * Best-effort parser for the freeform ``reference_range`` string.
 * Returns ``[min, max]``; either side can be ``null``.
 *
 * Recognised shapes (mirrors backend exactly):
 *   ``"70-100"`` / ``"12.0–16.0"`` / ``"12,0-16,0"`` / ``"5 - 15"``
 *   ``"5 to 15"`` / ``"5-15 mg/dL"`` (trailing unit ignored)
 *   ``"<5"`` / ``"<=5"`` / ``"≤5"`` → ``[null, 5]``
 *   ``">100"`` / ``">=100"`` / ``"≥100"`` → ``[100, null]``
 *
 * Indeterminate (``[null, null]``):
 *   - empty string
 *   - qualitative text (``"Positive"``, ``"Negative"``)
 *   - unrecognised separators (``"5..15"``, ``"5 / 10"``)
 *   - parsed pair where ``min > max`` (operator data-entry error;
 *     refuse rather than auto-flag against a nonsensical bound).
 */
export function parseReferenceRange(text: string): ReferenceBounds {
  if (!text) return [null, null]

  // Two-sided dash form. ``"5-15 mg/dL"`` matches because the
  // regex anchors to a word boundary after the second number —
  // trailing text is silently dropped.
  let match = RE_RANGE.exec(text)
  if (match) {
    return validatePair(parseNumeric(match[1]), parseNumeric(match[2]))
  }

  // Two-sided ``"5 to 15"`` form (some imports emit this).
  match = RE_RANGE_TO.exec(text)
  if (match) {
    return validatePair(parseNumeric(match[1]), parseNumeric(match[2]))
  }

  // One-sided upper bound. Two-character ops first so they take
  // precedence over the bare single-character form.
  match = RE_LE.exec(text)
  if (match) return [null, parseNumeric(match[1])]
  match = RE_LT.exec(text)
  if (match) return [null, parseNumeric(match[1])]

  // One-sided lower bound, same precedence rule.
  match = RE_GE.exec(text)
  if (match) return [parseNumeric(match[1]), null]
  match = RE_GT.exec(text)
  if (match) return [parseNumeric(match[1]), null]

  return [null, null]
}


/** Spec §6 safe fallback: if the parsed pair is nonsensical
 *  (``min > max``), refuse it. Otherwise return as-is. */
function validatePair(
  lo: number | null, hi: number | null,
): ReferenceBounds {
  if (lo === null || hi === null) return [lo, hi]
  if (lo > hi) return [null, null]
  return [lo, hi]
}


/**
 * Decide whether a result value should be auto-flagged abnormal.
 *
 * Returns
 *   ``true``  — value is numeric AND outside the parsed range.
 *   ``false`` — value is numeric AND inside the parsed range
 *               (boundary inclusive).
 *   ``null``  — indeterminate. The caller MUST leave the existing
 *               abnormal flag alone. Reasons we return ``null``:
 *               empty value, non-numeric value, empty reference,
 *               qualitative reference, unparseable reference,
 *               or parsed range with ``min > max``.
 *
 * The function is the canonical decision point — both the entry
 * dialog (single-value + multi-parameter forms) and the result
 * detail page edit form go through it. When extending behaviour
 * (e.g. supporting ``"Negative" / "Positive"`` qualitative
 * results), update this single function and both surfaces inherit
 * the new behaviour without further wiring.
 */
export function computeAbnormalFromReference(
  value: string, referenceRangeText: string,
): boolean | null {
  const numericValue = parseNumeric(value)
  if (numericValue === null) return null

  const [lo, hi] = parseReferenceRange(referenceRangeText)
  if (lo === null && hi === null) return null

  // Spec §2: outside means strictly below ``min`` OR strictly above
  // ``max``. Boundary itself is normal.
  if (lo !== null && numericValue < lo) return true
  if (hi !== null && numericValue > hi) return true
  return false
}
