import { Lock } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ErrorState } from '@/components/shared/ErrorState'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { useSampleTypes } from '../../api'

/**
 * Sample Types tab — read-only.
 *
 * Sample types are a fixed clinical taxonomy enforced by the backend enum.
 * Changing the list requires a backend migration because it affects exam
 * definitions, traceability and reporting — so the UI deliberately does
 * not render create / edit / delete affordances. A visible "Read-only"
 * badge and explanatory copy make the constraint honest rather than
 * dressing up a fake form.
 */
export function SampleTypesPanel() {
  const { data: samples = [], isLoading, error, refetch } = useSampleTypes()

  if (error) return <ErrorState onRetry={refetch} />

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Sample types</h2>
            <Badge
              variant="outline"
              className="gap-1 border-slate-200 bg-slate-50 text-slate-600 text-[10px]"
            >
              <Lock className="h-3 w-3" />
              Read-only
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Fixed clinical taxonomy. Adding or removing a value requires a
            backend migration because it affects existing exam definitions,
            traceability, and reporting.
          </p>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} columns={2} />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Label</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {samples.map((s) => (
                <TableRow key={s.value}>
                  <TableCell className="font-mono text-xs">{s.value}</TableCell>
                  <TableCell>{s.label}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
