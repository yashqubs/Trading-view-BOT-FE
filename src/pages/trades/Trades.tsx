import { useEffect, useState } from 'react'
import {
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  TrendingDown,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusPill } from '@/components/common/StatusPill'
import { EmptyState } from '@/components/common/EmptyState'
import { DateRangePicker, type DateRangeValue } from '@/components/common/DateRangePicker'
import { useTrades } from '@/hooks/useTrades'
import { exportTradesCsv, type TradeFilters, type TradeSortBy } from '@/api/trades'
import { TRADE_STATUSES, type TradeDirection, type TradeStatus, type TradeSummary } from '@/types'
import { formatDateTime, formatMoney, formatPrice, formatQuantity } from '@/lib/format'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 25

// ─── Status labels ───────────────────────────────────────────────────────────

const STATUS_LABELS: Record<TradeStatus, string> = {
  SUCCESS: 'Success',
  FAILED: 'Failed',
  MARKET_CLOSED: 'Market closed',
  NOT_MAPPED: 'Not mapped',
  DISABLED: 'Disabled',
  NO_POSITION: 'No position',
  BOT_PAUSED: 'Bot paused',
  BUY_DISABLED: 'Buy disabled',
  SELL_DISABLED: 'Sell disabled',
  DAILY_TOTAL_LIMIT: 'Daily total limit',
  DAILY_TRADE_LIMIT: 'Daily trade limit',
  GLOBAL_POSITION_LIMIT: 'Global position limit',
  STOCK_DAILY_LIMIT: 'Stock daily limit',
  COOL_DOWN: 'Cool-down',
  MAX_POSITIONS_STOCK: 'Max positions',
  AUTO_PAUSED: 'Auto-paused',
}

// ─── Sort helpers ─────────────────────────────────────────────────────────────

type SortConfig = { by: TradeSortBy; order: 'asc' | 'desc' }

const SORT_COLUMNS: { key: TradeSortBy; label: string }[] = [
  { key: 'signalReceivedAt', label: 'Date' },
  { key: 'tvTicker', label: 'Ticker' },
  { key: 'signalPrice', label: 'Signal price' },
  { key: 'investmentAmount', label: 'Invested' },
  { key: 'profitLoss', label: 'P&L' },
]

// "Newest/Oldest" only makes sense for the date column — ticker is
// alphabetical and the rest are numeric, so the order toggle's text should
// match what asc/desc actually means for the selected column.
function sortOrderLabels(by: TradeSortBy): { desc: string; asc: string } {
  if (by === 'signalReceivedAt') return { desc: 'Newest', asc: 'Oldest' }
  if (by === 'tvTicker') return { desc: 'Z → A', asc: 'A → Z' }
  return { desc: 'Highest', asc: 'Lowest' }
}

function SortIcon({ sortKey, current }: { sortKey: TradeSortBy; current: SortConfig }) {
  if (current.by !== sortKey) return <ArrowUpDown className="ml-1 h-3 w-3 text-text-tertiary opacity-0 group-hover:opacity-100" />
  return current.order === 'asc'
    ? <ArrowUp className="ml-1 h-3 w-3 text-accent" />
    : <ArrowDown className="ml-1 h-3 w-3 text-accent" />
}

// ─── P&L cell ─────────────────────────────────────────────────────────────────

function PnLCell({ value, pct }: { value: number | null; pct: number | null }) {
  if (value === null) return <span className="text-text-tertiary">Open</span>
  const isPositive = value >= 0
  return (
    <div className={cn('flex flex-col', isPositive ? 'text-success' : 'text-danger')}>
      <span className="font-medium tabular-nums">{isPositive ? '+' : ''}{formatMoney(value)}</span>
      {pct !== null && (
        <span className="text-xs opacity-80 tabular-nums">
          {isPositive ? '+' : ''}{pct.toFixed(2)}%
        </span>
      )}
    </div>
  )
}

// ─── Summary stat cards ───────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  sub,
  positive,
  loading,
}: {
  label: string
  value: string
  sub?: string
  positive?: boolean | null
  loading?: boolean
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-3 h-6 w-24" />
      </div>
    )
  }
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">{label}</p>
      <p
        className={cn(
          'mt-1.5 text-xl font-semibold tabular-nums',
          positive === true && 'text-success',
          positive === false && 'text-danger',
          positive === null || positive === undefined ? 'text-text-primary' : '',
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-text-tertiary">{sub}</p>}
    </div>
  )
}

function SummaryRow({ summary, loading }: { summary: TradeSummary | undefined; loading: boolean }) {
  const pnlPositive =
    summary?.totalProfitLoss == null ? null : summary.totalProfitLoss >= 0

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <SummaryCard
        label="Total trades"
        value={summary ? String(summary.totalTrades) : '—'}
        sub={summary ? `${summary.buyCount}B · ${summary.sellCount}S` : undefined}
        loading={loading}
      />
      <SummaryCard
        label="Success rate"
        value={summary ? `${summary.successRate.toFixed(1)}%` : '—'}
        sub={summary ? `${summary.successCount} executed` : undefined}
        positive={summary && summary.successRate >= 70 ? true : summary ? false : null}
        loading={loading}
      />
      <SummaryCard
        label="Failed / Skipped"
        value={summary ? `${summary.failedCount} / ${summary.skippedCount}` : '—'}
        positive={summary && summary.failedCount === 0 ? true : summary && summary.failedCount > 0 ? false : null}
        loading={loading}
      />
      <SummaryCard
        label="Total invested"
        value={summary ? formatMoney(summary.totalInvested) : '—'}
        sub={summary?.avgInvestment != null ? `Avg ${formatMoney(summary.avgInvestment)}` : undefined}
        loading={loading}
      />
      <SummaryCard
        label="Realized P&L"
        value={
          summary?.totalProfitLoss == null
            ? '—'
            : `${summary.totalProfitLoss >= 0 ? '+' : ''}${formatMoney(summary.totalProfitLoss)}`
        }
        sub={summary?.avgProfitLoss != null ? `Avg ${formatMoney(summary.avgProfitLoss)}` : undefined}
        positive={pnlPositive}
        loading={loading}
      />
      <SummaryCard
        label="Win / Loss"
        value={summary ? `${summary.winCount}W · ${summary.lossCount}L` : '—'}
        positive={summary && summary.winCount > summary.lossCount ? true : summary && summary.lossCount > summary.winCount ? false : null}
        loading={loading}
      />
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function Trades() {
  const [ticker, setTicker] = useState('')
  const [debouncedTicker, setDebouncedTicker] = useState('')
  const [direction, setDirection] = useState<TradeDirection | 'ALL'>('ALL')
  const [status, setStatus] = useState<TradeStatus | 'ALL'>('ALL')
  const [dateRange, setDateRange] = useState<DateRangeValue>({ preset: 'all' })
  const [sort, setSort] = useState<SortConfig>({ by: 'signalReceivedAt', order: 'desc' })
  const [page, setPage] = useState(1)
  const [exporting, setExporting] = useState(false)

  // Debounce ticker input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedTicker(ticker), 300)
    return () => clearTimeout(t)
  }, [ticker])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [debouncedTicker, direction, status, dateRange, sort])

  // Handle column sort click
  function handleSort(col: TradeSortBy) {
    setSort((s) =>
      s.by === col
        ? { by: col, order: s.order === 'asc' ? 'desc' : 'asc' }
        : { by: col, order: 'desc' },
    )
  }

  function clearFilters() {
    setTicker('')
    setDebouncedTicker('')
    setDirection('ALL')
    setStatus('ALL')
    setDateRange({ preset: 'all' })
    setSort({ by: 'signalReceivedAt', order: 'desc' })
    setPage(1)
  }

  const hasActiveFilters =
    ticker || direction !== 'ALL' || status !== 'ALL' || dateRange.preset !== 'all'

  const filters: TradeFilters = {
    ticker: debouncedTicker || undefined,
    direction: direction === 'ALL' ? undefined : direction,
    status: status === 'ALL' ? undefined : status,
    from: dateRange.from || undefined,
    to: dateRange.to || undefined,
    sortBy: sort.by,
    sortOrder: sort.order,
    page,
    pageSize: PAGE_SIZE,
  }

  const { data, isLoading, isFetching } = useTrades(filters)
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1

  async function handleExport() {
    setExporting(true)
    try {
      const blob = await exportTradesCsv(filters)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `trades-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  // Sortable table header cell
  function SortHead({
    col,
    children,
    className,
  }: {
    col: TradeSortBy
    children: React.ReactNode
    className?: string
  }) {
    return (
      <TableHead
        className={cn('group cursor-pointer select-none hover:text-text-primary', className)}
        onClick={() => handleSort(col)}
      >
        <span className="inline-flex items-center">
          {children}
          <SortIcon sortKey={col} current={sort} />
        </span>
      </TableHead>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium text-text-primary">Trade history</h1>
          <p className="text-sm text-text-secondary">Signal log with execution details, P&amp;L, and statistics.</p>
        </div>
        <Button variant="secondary" onClick={handleExport} disabled={exporting}>
          <Download className="h-4 w-4" />
          {exporting ? 'Exporting…' : 'Export CSV'}
        </Button>
      </div>

      {/* ── Summary stat row ── */}
      <SummaryRow summary={data?.summary} loading={isLoading} />

      {/* ── Filters ── */}
      <Card className="animate-fade-slide-in">
        <div className="flex flex-col gap-3">
          {/* Row 1 */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Ticker</Label>
              <Input
                placeholder="e.g. AAPL"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Direction</Label>
              <Select value={direction} onValueChange={(v) => setDirection(v as TradeDirection | 'ALL')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All directions</SelectItem>
                  <SelectItem value="BUY">Buy</SelectItem>
                  <SelectItem value="SELL">Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TradeStatus | 'ALL')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All statuses</SelectItem>
                  {TRADE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Sort by</Label>
              <Select
                value={sort.by}
                onValueChange={(v) => setSort((s) => ({ ...s, by: v as TradeSortBy }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SORT_COLUMNS.map((c) => (
                    <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2 — Date range + sort order */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Date range</Label>
              <DateRangePicker value={dateRange} onChange={setDateRange} allowAll />
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-xs">Sort order</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={sort.order === 'desc' ? 'primary' : 'secondary'}
                  onClick={() => setSort((s) => ({ ...s, order: 'desc' }))}
                >
                  <ArrowDown className="h-3.5 w-3.5" /> {sortOrderLabels(sort.by).desc}
                </Button>
                <Button
                  type="button"
                  variant={sort.order === 'asc' ? 'primary' : 'secondary'}
                  onClick={() => setSort((s) => ({ ...s, order: 'asc' }))}
                >
                  <ArrowUp className="h-3.5 w-3.5" /> {sortOrderLabels(sort.by).asc}
                </Button>
              </div>
            </div>
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-text-tertiary hover:text-danger transition-colors"
              >
                <X className="h-3 w-3" /> Clear all filters
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* ── Table ── */}
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : !data?.items.length ? (
        <EmptyState
          title="No trades found"
          description="Try widening your filters or check back once signals start arriving."
          action={
            hasActiveFilters ? (
              <Button variant="secondary" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <Card className={cn('p-0 animate-fade-slide-in transition-opacity', isFetching && 'opacity-60')}>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortHead col="signalReceivedAt">Date</SortHead>
                  <SortHead col="tvTicker">Ticker</SortHead>
                  <TableHead>Direction</TableHead>
                  <SortHead col="signalPrice" className="text-right">Signal price</SortHead>
                  <TableHead className="text-right">Closing price</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <SortHead col="investmentAmount" className="text-right">Invested</SortHead>
                  <SortHead col="profitLoss" className="text-right">P&amp;L</SortHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Deal ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell className="whitespace-nowrap text-text-secondary text-xs">
                      {formatDateTime(trade.signalReceivedAt)}
                    </TableCell>
                    <TableCell className="font-semibold">{trade.tvTicker}</TableCell>
                    <TableCell>
                      <Badge variant={trade.direction === 'BUY' ? 'accent' : 'neutral'}>
                        {trade.direction === 'BUY'
                          ? <TrendingUp className="mr-1 h-3 w-3 inline" />
                          : <TrendingDown className="mr-1 h-3 w-3 inline" />}
                        {trade.direction}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatPrice(trade.signalPrice)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-text-secondary">
                      {trade.closingPrice ? formatPrice(trade.closingPrice) : <span className="text-text-tertiary">—</span>}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatQuantity(trade.quantity)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(trade.investmentAmount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <PnLCell value={trade.profitLoss} pct={trade.profitLossPct} />
                    </TableCell>
                    <TableCell>
                      <StatusPill status={trade.status} />
                    </TableCell>
                    <TableCell className="font-mono text-xs text-text-tertiary">
                      {trade.dealId ?? '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* ── Pagination ── */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-text-secondary">
            <span>
              {data.total.toLocaleString()} trade{data.total !== 1 ? 's' : ''}
              {' · '}page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="secondary"
                size="icon"
                disabled={page <= 1}
                onClick={() => setPage(1)}
                aria-label="First page"
              >
                <ChevronLeft className="h-4 w-4" />
                <ChevronLeft className="-ml-3 h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
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
                      onClick={() => setPage(p)}
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
                onClick={() => setPage((p) => p + 1)}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                disabled={page >= totalPages}
                onClick={() => setPage(totalPages)}
                aria-label="Last page"
              >
                <ChevronRight className="h-4 w-4" />
                <ChevronRight className="-ml-3 h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
