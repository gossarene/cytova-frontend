import { Plus, Folder, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Can } from '@/lib/permissions/Can'
import { P } from '@/lib/permissions/constants'
import { cn } from '@/lib/utils'
import type { ExamCategoryListItem } from '../types'

interface Props {
  categories: ExamCategoryListItem[]
  isLoading: boolean
  selectedId: string | null
  onSelect: (id: string | null) => void
  onCreateClick: () => void
}

export function CategorySidebar({ categories, isLoading, selectedId, onSelect, onCreateClick }: Props) {
  return (
    <div className="flex flex-col rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Categories</h3>
        <Can permission={P.CATALOG_MANAGE}>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onCreateClick}>
            <Plus className="h-4 w-4" />
          </Button>
        </Can>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {/* All exams option */}
          <button
            onClick={() => onSelect(null)}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              'hover:bg-muted',
              selectedId === null ? 'bg-muted text-foreground' : 'text-muted-foreground',
            )}
          >
            <Folder className="h-4 w-4 shrink-0" />
            All Exams
          </button>

          {isLoading ? (
            <div className="space-y-2 px-3 py-2">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-8" />)}
            </div>
          ) : (
            categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onSelect(cat.id)}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                  'hover:bg-muted',
                  selectedId === cat.id ? 'bg-muted text-foreground font-medium' : 'text-muted-foreground',
                  !cat.is_active && 'opacity-50',
                )}
              >
                <span className="flex items-center gap-2.5 truncate">
                  {selectedId === cat.id ? (
                    <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
                  ) : (
                    <Folder className="h-4 w-4 shrink-0" />
                  )}
                  <span className="truncate">{cat.name}</span>
                </span>
                {!cat.is_active && (
                  <Badge variant="outline" className="shrink-0 text-[10px] border-red-200 text-red-500">Off</Badge>
                )}
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
