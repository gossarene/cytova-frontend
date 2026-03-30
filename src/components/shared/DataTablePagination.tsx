import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PAGINATION_SIZE_OPTIONS } from '@/config/constants'
import type { CursorPagination } from '@/lib/api/types'

interface DataTablePaginationProps {
  pagination: CursorPagination
  pageSize: number
  onPageSizeChange: (size: number) => void
  onNextPage: () => void
  onPreviousPage: () => void
}

export function DataTablePagination({
  pagination,
  pageSize,
  onPageSizeChange,
  onNextPage,
  onPreviousPage,
}: DataTablePaginationProps) {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Rows per page</span>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => onPageSizeChange(Number(v))}
        >
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGINATION_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {pagination.count > 0 && (
          <span className="ml-2">{pagination.count} total</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPreviousPage}
          disabled={!pagination.has_previous}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onNextPage}
          disabled={!pagination.has_next}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
