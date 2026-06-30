import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { TableHead } from '@/components/ui/table'
import { cn } from '@/lib/utils'

export interface SortConfig<K extends string> {
  by: K
  order: 'asc' | 'desc'
}

interface SortableHeaderProps<K extends string> {
  sortKey: K
  current: SortConfig<K>
  onSort: (key: K) => void
  className?: string
  children: ReactNode
}

export function SortableHeader<K extends string>({
  sortKey,
  current,
  onSort,
  className,
  children,
}: SortableHeaderProps<K>) {
  const active = current.by === sortKey

  return (
    <TableHead
      className={cn('group cursor-pointer select-none hover:text-text-primary', className)}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center">
        {children}
        {active ? (
          current.order === 'asc' ? (
            <ArrowUp className="ml-1 h-3 w-3 text-accent" />
          ) : (
            <ArrowDown className="ml-1 h-3 w-3 text-accent" />
          )
        ) : (
          <ArrowUpDown className="ml-1 h-3 w-3 text-text-tertiary opacity-0 group-hover:opacity-100" />
        )}
      </span>
    </TableHead>
  )
}

/** Toggles sort: same column flips order, new column resets to descending. */
export function toggleSort<K extends string>(current: SortConfig<K>, key: K): SortConfig<K> {
  return current.by === key ? { by: key, order: current.order === 'asc' ? 'desc' : 'asc' } : { by: key, order: 'desc' }
}
