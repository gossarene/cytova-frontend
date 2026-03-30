/**
 * Format a numeric amount as currency.
 * Backend sends prices as string-encoded decimals.
 */
export function formatCurrency(amount: number | string, currency = 'XAF'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num)
}
