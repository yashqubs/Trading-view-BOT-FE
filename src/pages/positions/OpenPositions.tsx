import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, TrendingDown, TrendingUp, X } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/common/EmptyState'
import { TableSkeleton } from '@/components/common/PageSkeleton'
import { SortableHeader, toggleSort, type SortConfig } from '@/components/common/SortableHeader'
import { useOpenPositions } from '@/hooks/useStats'
import { formatQuantity } from '@/lib/format'
import type { TradeDirection } from '@/types'

type SortKey = 'tvTicker' | 'direction' | 'size'

export function OpenPositions() {
  const [searchParams, setSearchParams] = useSearchParams()
  const ticker = searchParams.get('ticker') ?? undefined
  const positions = useOpenPositions(ticker)

  const [search, setSearch] = useState('')
  const [directionFilter, setDirectionFilter] = useState<TradeDirection | 'ALL'>('ALL')
  const [sort, setSort] = useState<SortConfig<SortKey>>({ by: 'tvTicker', order: 'asc' })

  const hasFilters = !!search || directionFilter !== 'ALL'

  function clearTickerFilter() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('ticker')
      return next
    })
  }

  function clearFilters() {
    setSearch('')
    setDirectionFilter('ALL')
  }

  const filteredPositions = useMemo(() => {
    if (!positions.data) return []
    const term = search.trim().toLowerCase()

    const filtered = positions.data.filter((p) => {
      if (term && !p.tvTicker.toLowerCase().includes(term) && !p.instrumentName.toLowerCase().includes(term)) {
        return false
      }
      if (directionFilter !== 'ALL' && p.direction !== directionFilter) return false
      return true
    })

    const dir = sort.order === 'asc' ? 1 : -1
    return filtered.slice().sort((a, b) => {
      switch (sort.by) {
        case 'tvTicker':
          return a.tvTicker.localeCompare(b.tvTicker) * dir
        case 'direction':
          return a.direction.localeCompare(b.direction) * dir
        case 'size':
          return (a.size - b.size) * dir
        default:
          return 0
      }
    })
  }, [positions.data, search, directionFilter, sort])

  function handleSort(key: SortKey) {
    setSort((s) => toggleSort(s, key))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium text-text-primary">Open positions</h1>
          <p className="text-sm text-text-secondary">
            Live positions currently held on IG, by stock.
          </p>
        </div>
        {ticker && (
          <button
            type="button"
            onClick={clearTickerFilter}
            className="flex items-center gap-1 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs text-text-secondary transition-colors hover:text-text-primary"
          >
            {ticker} <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {!positions.isLoading && !!positions.data?.length && (
        <Card className="animate-fade-slide-in">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex min-w-[200px] flex-1 flex-col gap-1">
              <Label className="text-xs">Search</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                <Input
                  placeholder="Ticker or instrument name…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Direction</Label>
              <Select value={directionFilter} onValueChange={(v) => setDirectionFilter(v as TradeDirection | 'ALL')}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All directions</SelectItem>
                  <SelectItem value="BUY">Buy</SelectItem>
                  <SelectItem value="SELL">Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1 pb-2 text-xs text-text-tertiary transition-colors hover:text-danger"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
        </Card>
      )}

      {positions.isLoading ? (
        <TableSkeleton />
      ) : !positions.data?.length ? (
        <EmptyState
          title="No open positions"
          description={
            ticker
              ? `${ticker} has no open position right now.`
              : 'Nothing is currently held on IG — positions appear here as soon as a BUY executes.'
          }
        />
      ) : !filteredPositions.length ? (
        <EmptyState
          title="No positions match your filters"
          description="Try a different search term or clear the filters."
          action={
            <Button variant="secondary" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <Card className="p-0 animate-fade-slide-in">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader sortKey="tvTicker" current={sort} onSort={handleSort}>Ticker</SortableHeader>
                <TableHead>Instrument</TableHead>
                <SortableHeader sortKey="direction" current={sort} onSort={handleSort}>Direction</SortableHeader>
                <SortableHeader sortKey="size" current={sort} onSort={handleSort} className="text-right">Size</SortableHeader>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPositions.map((position) => (
                <TableRow key={position.igEpic}>
                  <TableCell className="font-medium">{position.tvTicker}</TableCell>
                  <TableCell className="text-text-secondary">{position.instrumentName}</TableCell>
                  <TableCell>
                    <Badge variant={position.direction === 'BUY' ? 'accent' : 'neutral'}>
                      {position.direction === 'BUY' ? (
                        <TrendingUp className="mr-1 h-3 w-3 inline" />
                      ) : (
                        <TrendingDown className="mr-1 h-3 w-3 inline" />
                      )}
                      {position.direction}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatQuantity(position.size)}</TableCell>
                  <TableCell className="text-right">
                    {position.mapped ? (
                      <Link
                        to={`/stocks/${position.tvTicker}`}
                        className="text-xs text-accent hover:underline"
                      >
                        View stock
                      </Link>
                    ) : (
                      <span className="text-xs text-text-tertiary">Unmapped epic</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
