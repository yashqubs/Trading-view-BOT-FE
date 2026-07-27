import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

interface PaginationProps {
  page: number
  pageSize: number
  totalItems: number
  /** Singular noun for the count text, e.g. "trade" → "12 trades". */
  itemLabel: string
  pageSizeOptions?: number[]
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export function Pagination({
  page,
  pageSize,
  totalItems,
  itemLabel,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-text-secondary">
      <div className="flex flex-wrap items-center gap-4">
        <span>
          {totalItems.toLocaleString()} {itemLabel}{totalItems !== 1 ? 's' : ''}
          {' · '}page {page} of {totalPages}
        </span>
        <div className="flex items-center gap-1.5">
          <Label htmlFor="pagination-page-size" className="text-xs text-text-tertiary">
            Per page
          </Label>
          <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
            <SelectTrigger id="pagination-page-size" className="h-8 w-[74px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="secondary"
          size="icon"
          disabled={page <= 1}
          onClick={() => onPageChange(1)}
          aria-label="First page"
        >
          <ChevronLeft className="h-4 w-4" />
          <ChevronLeft className="-ml-3 h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        <div className="flex items-center gap-1 px-2">
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            let p: number
            if (totalPages <= 5) {
              p = i + 1
            } else if (page <= 3) {
              p = i + 1
            } else if (page >= totalPages - 2) {
              p = totalPages - 4 + i
            } else {
              p = page - 2 + i
            }
            return (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={cn(
                  'h-8 w-8 rounded-md text-sm font-medium transition-colors',
                  p === page
                    ? 'bg-accent-soft text-accent'
                    : 'text-text-tertiary hover:bg-surface-2 hover:text-text-primary',
                )}
              >
                {p}
              </button>
            )
          })}
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          disabled={page >= totalPages}
          onClick={() => onPageChange(totalPages)}
          aria-label="Last page"
        >
          <ChevronRight className="h-4 w-4" />
          <ChevronRight className="-ml-3 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
