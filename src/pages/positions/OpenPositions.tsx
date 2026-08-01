import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { Search, TrendingDown, TrendingUp, X, XCircle } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { TableSkeleton } from '@/components/common/PageSkeleton'
import { SortableHeader, toggleSort, type SortConfig } from '@/components/common/SortableHeader'
import { Pagination } from '@/components/common/Pagination'
import { useOpenPositions } from '@/hooks/useStats'
import { useCloseAllPositions } from '@/hooks/useTrades'
import type { OpenPositionFilters } from '@/api/stats'
import { formatDateTime, formatQuantity, formatRelativeTime } from '@/lib/format'
import { explainTradeError } from '@/lib/tradeError'
import { cn } from '@/lib/utils'
import type { TradeDirection } from '@/types'

type SortKey = NonNullable<OpenPositionFilters['sortBy']>

export function OpenPositions() {
  const [searchParams, setSearchParams] = useSearchParams()
  const ticker = searchParams.get('ticker') ?? undefined

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [directionFilter, setDirectionFilter] = useState<TradeDirection | 'ALL'>('ALL')
  const [sort, setSort] = useState<SortConfig<SortKey>>({ by: 'tvTicker', order: 'asc' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, directionFilter, sort, pageSize, ticker])

  const hasFilters = !!debouncedSearch || directionFilter !== 'ALL'

  function clearTickerFilter() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('ticker')
      return next
    })
  }

  function clearFilters() {
    setSearch('')
    setDebouncedSearch('')
    setDirectionFilter('ALL')
  }

  const filters: OpenPositionFilters = {
    ticker,
    search: debouncedSearch || undefined,
    direction: directionFilter === 'ALL' ? undefined : directionFilter,
    sortBy: sort.by,
    sortOrder: sort.order,
    page,
    pageSize,
  }

  const { data, isLoading, isFetching } = useOpenPositions(filters)
  const closeAll = useCloseAllPositions()

  function handleSort(key: SortKey) {
    setSort((s) => toggleSort(s, key))
  }

  /**
   * Closes every position on IG, not just the ones matching the current
   * filters — the button says "all", and a filtered subset would be a
   * dangerous thing to get wrong with real money.
   */
  async function handleCloseAll() {
    try {
      const result = await closeAll.mutateAsync()

      if (result.attempted === 0) {
        toast.info('There were no open positions to close.')
        return
      }
      if (result.failures.length === 0) {
        toast.success(`Closed ${result.closed} of ${result.attempted} positions.`)
        return
      }

      // Name the instruments that survived and why — "3 of 5" alone leaves the
      // user with open exposure and no idea which, or what to do next.
      toast.error(
        <div className="flex flex-col gap-1.5">
          <span>
            Closed {result.closed} of {result.attempted}. Still open:
          </span>
          <ul className="flex flex-col gap-1">
            {result.failures.map((failure) => (
              <li key={failure.igEpic} className="text-xs">
                <span className="font-medium">{failure.tvTicker}</span> —{' '}
                {explainTradeError(failure.reason) ?? failure.reason}
              </li>
            ))}
          </ul>
        </div>,
        { duration: 15_000 },
      )
    } catch {
      toast.error('Could not close positions. Nothing was changed — check the trade history.')
    }
  }

  const showFilterBar = isLoading || (data?.total ?? 0) > 0
  const visibleTotal = data?.total ?? 0
  // data.total is the count *after* filtering, so it can only be quoted as the
  // number about to close when nothing is narrowing the list.
  const isNarrowed = hasFilters || !!ticker

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium text-text-primary">Open positions</h1>
          <p className="text-sm text-text-secondary">
            Live positions currently held on IG, by stock.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {ticker && (
            <button
              type="button"
              onClick={clearTickerFilter}
              className="flex items-center gap-1 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs text-text-secondary transition-colors hover:text-text-primary"
            >
              {ticker} <X className="h-3 w-3" />
            </button>
          )}
          {visibleTotal > 0 && (
            <ConfirmDialog
              trigger={
                <Button variant="destructive" size="sm" disabled={closeAll.isPending}>
                  <XCircle className="mr-1.5 h-4 w-4" />
                  {closeAll.isPending ? 'Closing…' : 'Close all positions'}
                </Button>
              }
              title="Close all open positions?"
              description={
                isNarrowed
                  ? 'This closes every position open on IG at the current market price — including any not shown by the filters above. Real orders are placed immediately and this cannot be undone.'
                  : `This closes all ${visibleTotal} open ${visibleTotal === 1 ? 'position' : 'positions'} on IG at the current market price. Real orders are placed immediately and this cannot be undone.`
              }
              confirmLabel="Close all positions"
              onConfirm={handleCloseAll}
            />
          )}
        </div>
      </div>

      {showFilterBar && (
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

      {isLoading ? (
        <TableSkeleton />
      ) : !data?.total && !hasFilters && !ticker ? (
        <EmptyState
          title="No open positions"
          description="Nothing is currently held on IG — positions appear here as soon as a BUY executes."
        />
      ) : !data?.total && ticker ? (
        <EmptyState
          title="No open positions"
          description={`${ticker} has no open position right now.`}
        />
      ) : !data?.items.length ? (
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
        <>
          <Card className={cn('p-0 animate-fade-slide-in transition-opacity', isFetching && 'opacity-60')}>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader sortKey="tvTicker" current={sort} onSort={handleSort}>Ticker</SortableHeader>
                  <TableHead>Instrument</TableHead>
                  <SortableHeader sortKey="direction" current={sort} onSort={handleSort}>Direction</SortableHeader>
                  <SortableHeader sortKey="size" current={sort} onSort={handleSort} className="text-right">Size</SortableHeader>
                  <SortableHeader sortKey="openedAt" current={sort} onSort={handleSort}>Opened</SortableHeader>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((position) => (
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
                    <TableCell className="whitespace-nowrap">
                      {position.openedAt ? (
                        <div className="flex flex-col">
                          <span className="text-xs text-text-secondary">
                            {formatDateTime(position.openedAt)}
                          </span>
                          {/* How long it's been held is the question this
                              column actually gets asked; the absolute time
                              above is what you'd cross-check against IG. */}
                          {formatRelativeTime(position.openedAt) && (
                            <span className="text-[11px] text-text-tertiary">
                              {formatRelativeTime(position.openedAt)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span
                          className="text-xs text-text-tertiary"
                          title="IG did not report an open time for this position"
                        >
                          —
                        </span>
                      )}
                    </TableCell>
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
          <Pagination
            page={page}
            pageSize={pageSize}
            totalItems={data.total}
            itemLabel="position"
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}
    </div>
  )
}
