/**
 * Renders an SVG country flag using the `flag-icons` CSS library.
 * Accepts an ISO 3166-1 alpha-2 code (case-insensitive).
 *
 * Usage: <FlagIcon code="ci" />
 */
export function FlagIcon({ code, className }: { code: string; className?: string }) {
  return (
    <span
      className={`fi fi-${code.toLowerCase()} inline-block shrink-0 rounded-sm ${className ?? 'h-3.5 w-5'}`}
      role="img"
      aria-label={code.toUpperCase()}
    />
  )
}
