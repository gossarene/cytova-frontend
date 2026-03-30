import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils/date'
import { formatCurrency } from '@/lib/utils/currency'
import type { PricingRule } from '../types'

interface Props {
  rules: PricingRule[]
  isLoading: boolean
}

function formatValue(rule: PricingRule): string {
  if (rule.pricing_type === 'PERCENTAGE_DISCOUNT') {
    return `${rule.value}% discount`
  }
  return formatCurrency(rule.value)
}

function formatTarget(rule: PricingRule): string {
  if (rule.partner_organization_name) return rule.partner_organization_name
  if (rule.source_type === 'DIRECT_PATIENT') return 'Direct patients'
  if (rule.source_type === 'PARTNER_ORGANIZATION') return 'All partners'
  return 'Default (all)'
}

export function PricingRulesTable({ rules, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)}
      </div>
    )
  }

  if (rules.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No pricing rules. The reference unit price will be used.
      </p>
    )
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Target</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Active Period</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.map((rule) => (
            <TableRow key={rule.id}>
              <TableCell className="font-medium text-sm">{formatTarget(rule)}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {rule.pricing_type === 'FIXED_PRICE' ? 'Fixed' : 'Discount'}
                </Badge>
              </TableCell>
              <TableCell className="font-mono text-sm">{formatValue(rule)}</TableCell>
              <TableCell className="text-sm tabular-nums">{rule.priority}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {rule.start_date || rule.end_date ? (
                  <>
                    {rule.start_date ? formatDate(rule.start_date) : '...'}{' '}
                    — {rule.end_date ? formatDate(rule.end_date) : '...'}
                  </>
                ) : (
                  'Always'
                )}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={rule.is_active
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 text-xs'
                    : 'border-red-200 bg-red-50 text-red-600 text-xs'}
                >
                  {rule.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
