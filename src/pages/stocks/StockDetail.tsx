import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
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
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard } from '@/components/common/StatCard'
import { StatusPill } from '@/components/common/StatusPill'
import { EmptyState } from '@/components/common/EmptyState'
import { StatGridSkeleton } from '@/components/common/PageSkeleton'
import { DateRangePicker, type DateRangeValue } from '@/components/common/DateRangePicker'
import { LineChartCard } from '@/components/charts/LineChartCard'
import { BarChartCard } from '@/components/charts/BarChartCard'
import { DonutChartCard } from '@/components/charts/DonutChartCard'
import { ChartExpandModal } from '@/components/charts/ChartExpandModal'
import { useStockStats } from '@/hooks/useStats'
import { useTrades } from '@/hooks/useTrades'
import { exportTradesCsv, type TradeFilters, type TradeSortBy } from '@/api/trades'
import { TRADE_STATUSES, type TradeDirection, type TradeStatus } from '@/types'
import { formatCount, formatDateTime, formatMoney, formatPercent, formatPrice, formatQuantity } from '@/lib/format'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 25

type ExpandedChart = 'timeline' | 'entry-prices' | 'buy-sell' | 'status-breakdown' | 'invested-over-time'

const EXPANDED_CHART_TITLES: Record<ExpandedChart, string> = {
  timeline: 'Trade history timeline',
  'entry-prices': 'Signal entry prices',
  'buy-sell': 'Buy vs sell',
  'status-breakdown': 'Status breakdown',
  'invested-over-time': 'Invested amount over time',
}

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

type SortConfig = { by: TradeSortBy; order: 'asc' | 'desc' }

const SORT_COLUMNS: { key: TradeSortBy; label: string }[] = [
  { key: 'signalReceivedAt', label: 'Date' },
  { key: 'signalPrice', label: 'Signal price' },
  { key: 'investmentAmount', label: 'Invested' },
  { key: 'profitLoss', label: 'P&L' },
]

// "Newest/Oldest" only makes sense for the date column — other columns are
// numeric, so the order toggle should read "Highest/Lowest" for those.
function sortOrderLabels(by: TradeSortBy): { desc: string; asc: string } {
  return by === 'signalReceivedAt'
    ? { desc: 'Newest', asc: 'Oldest' }
    : { desc: 'Highest', asc: 'Lowest' }
}

function SortIcon({ sortKey, current }: { sortKey: TradeSortBy; current: SortConfig }) {
  if (current.by !== sortKey) return <ArrowUpDown className="ml-1 h-3 w-3 text-text-tertiary opacity-0 group-hover:opacity-100" />
  return current.order === 'asc'
    ? <ArrowUp className="ml-1 h-3 w-3 text-accent" />
    : <ArrowDown className="ml-1 h-3 w-3 text-accent" />
}

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

export function StockDetail() {
  const { ticker = '' } = useParams<{ ticker: string }>()

  // ── Shared filters (search/sort/range), scoped to this ticker ──
  // Date range drives both the stat cards/charts above and the trade table
  // below; direction/status/sort only affect the trade table since the
  // stats endpoint only aggregates by date.
  const [direction, setDirection] = useState<TradeDirection | 'ALL'>('ALL')
  const [status, setStatus] = useState<TradeStatus | 'ALL'>('ALL')
  const [dateRange, setDateRange] = useState<DateRangeValue>({ preset: 'all' })
  const [sort, setSort] = useState<SortConfig>({ by: 'signalReceivedAt', order: 'desc' })
  const [page, setPage] = useState(1)
  const [exporting, setExporting] = useState(false)
  const [expandedChart, setExpandedChart] = useState<ExpandedChart | null>(null)

  useEffect(() => {
    setPage(1)
  }, [direction, status, dateRange, sort, ticker])

  function handleSort(col: TradeSortBy) {
    setSort((s) =>
      s.by === col
        ? { by: col, order: s.order === 'asc' ? 'desc' : 'asc' }
        : { by: col, order: 'desc' },
    )
  }

  function clearFilters() {
    setDirection('ALL')
    setStatus('ALL')
    setDateRange({ preset: 'all' })
    setSort({ by: 'signalReceivedAt', order: 'desc' })
    setPage(1)
  }

  const hasActiveFilters = direction !== 'ALL' || status !== 'ALL' || dateRange.preset !== 'all'

  const stats = useStockStats(ticker, { from: dateRange.from || undefined, to: dateRange.to || undefined })

  const filters: TradeFilters = {
    ticker,
    direction: direction === 'ALL' ? undefined : direction,
    status: status === 'ALL' ? undefined : status,
    from: dateRange.from || undefined,
    to: dateRange.to || undefined,
    sortBy: sort.by,
    sortOrder: sort.order,
    page,
    pageSize: PAGE_SIZE,
  }

  const trades = useTrades(filters)
  const totalPages = trades.data ? Math.max(1, Math.ceil(trades.data.total / PAGE_SIZE)) : 1

  async function handleExport() {
    setExporting(true)
    try {
      const blob = await exportTradesCsv(filters)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${ticker}-trades-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

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
      <div>
        <Link to="/stocks" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary">
          <ArrowLeft className="h-3.5 w-3.5" />
          Stocks
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-xl font-medium text-text-primary">{ticker}</h1>
          {stats.data && (
            <Badge variant={stats.data.currentlyOpen ? 'accent' : 'neutral'}>
              {stats.data.currentlyOpen ? 'Position open' : 'No open position'}
            </Badge>
          )}
        </div>
      </div>

      {/* ── Date range — governs the stat cards/charts below, and pre-fills the trade table's range too ── */}
      <Card className="animate-fade-slide-in">
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Date range</Label>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
      </Card>

      {stats.isLoading ? (
        <StatGridSkeleton count={6} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Total trades" value={stats.data?.totalTrades ?? 0} format={formatCount} />
          <StatCard label="Total invested" value={stats.data?.totalInvested ?? 0} format={formatMoney} />
          <StatCard label="Buy / sell" value={stats.data?.buyCount ?? 0} format={(v) => `${formatCount(v)} / ${formatCount(stats.data?.sellCount ?? 0)}`} />
          <StatCard label="Success rate" value={stats.data?.successRate ?? 0} format={formatPercent} />
          <StatCard
            label="Last traded"
            value={0}
            format={() => formatDateTime(stats.data?.lastTradedAt)}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LineChartCard
          title="Trade history timeline"
          data={stats.data?.timeline}
          xKey="date"
          yKey="trades"
          loading={stats.isLoading}
          onExpand={() => setExpandedChart('timeline')}
        />
        <LineChartCard
          title="Signal entry prices"
          data={stats.data?.entryPrices}
          xKey="date"
          yKey="price"
          loading={stats.isLoading}
          onExpand={() => setExpandedChart('entry-prices')}
        />
        <DonutChartCard
          title="Buy vs sell"
          data={
            stats.data
              ? [
                  { name: 'Buy', value: stats.data.buyCount },
                  { name: 'Sell', value: stats.data.sellCount },
                ]
              : undefined
          }
          loading={stats.isLoading}
          onExpand={() => setExpandedChart('buy-sell')}
        />
        <BarChartCard
          title="Status breakdown"
          data={stats.data?.statusBreakdown}
          xKey="status"
          yKey="count"
          loading={stats.isLoading}
          onExpand={() => setExpandedChart('status-breakdown')}
        />
        <div className="lg:col-span-2">
          <BarChartCard
            title="Invested amount over time"
            data={stats.data?.investedOverTime}
            xKey="date"
            yKey="invested"
            loading={stats.isLoading}
            onExpand={() => setExpandedChart('invested-over-time')}
          />
        </div>
      </div>

      {/* ── Expanded chart modal — reuses the page's own date-range filter,
          so adjustments here stay in sync with the stat cards above. ── */}
      <ChartExpandModal
        open={expandedChart !== null}
        onOpenChange={(open) => !open && setExpandedChart(null)}
        title={expandedChart ? EXPANDED_CHART_TITLES[expandedChart] : ''}
        filters={<DateRangePicker value={dateRange} onChange={setDateRange} />}
      >
        {expandedChart === 'timeline' && (
          <LineChartCard
            title={EXPANDED_CHART_TITLES.timeline}
            bare
            data={stats.data?.timeline}
            xKey="date"
            yKey="trades"
            loading={stats.isLoading}
            height={420}
          />
        )}
        {expandedChart === 'entry-prices' && (
          <LineChartCard
            title={EXPANDED_CHART_TITLES['entry-prices']}
            bare
            data={stats.data?.entryPrices}
            xKey="date"
            yKey="price"
            loading={stats.isLoading}
            height={420}
          />
        )}
        {expandedChart === 'buy-sell' && (
          <DonutChartCard
            title={EXPANDED_CHART_TITLES['buy-sell']}
            bare
            data={
              stats.data
                ? [
                    { name: 'Buy', value: stats.data.buyCount },
                    { name: 'Sell', value: stats.data.sellCount },
                  ]
                : undefined
            }
            loading={stats.isLoading}
            height={420}
          />
        )}
        {expandedChart === 'status-breakdown' && (
          <BarChartCard
            title={EXPANDED_CHART_TITLES['status-breakdown']}
            bare
            data={stats.data?.statusBreakdown}
            xKey="status"
            yKey="count"
            loading={stats.isLoading}
            height={420}
          />
        )}
        {expandedChart === 'invested-over-time' && (
          <BarChartCard
            title={EXPANDED_CHART_TITLES['invested-over-time']}
            bare
            data={stats.data?.investedOverTime}
            xKey="date"
            yKey="invested"
            loading={stats.isLoading}
            height={420}
          />
        )}
      </ChartExpandModal>

      {/* ── Trade history ── */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-text-primary">Trade history</h2>
          <Button variant="secondary" size="sm" onClick={handleExport} disabled={exporting}>
            <Download className="h-3.5 w-3.5" />
            {exporting ? 'Exporting…' : 'Export CSV'}
          </Button>
        </div>

        {/* Filters — direction/status/sort scope the trade table only; date range is shared with the stats section above */}
        <Card className="animate-fade-slide-in">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Date range</Label>
              <DateRangePicker value={dateRange} onChange={setDateRange} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Sort order</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={sort.order === 'desc' ? 'primary' : 'secondary'}
                    className="flex-1"
                    onClick={() => setSort((s) => ({ ...s, order: 'desc' }))}
                  >
                    <ArrowDown className="h-3.5 w-3.5" /> {sortOrderLabels(sort.by).desc}
                  </Button>
                  <Button
                    type="button"
                    variant={sort.order === 'asc' ? 'primary' : 'secondary'}
                    className="flex-1"
                    onClick={() => setSort((s) => ({ ...s, order: 'asc' }))}
                  >
                    <ArrowUp className="h-3.5 w-3.5" /> {sortOrderLabels(sort.by).asc}
                  </Button>
                </div>
              </div>
            </div>

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

        {/* Table */}
        {trades.isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : !trades.data?.items.length ? (
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
            <Card className={cn('p-0 animate-fade-slide-in transition-opacity', trades.isFetching && 'opacity-60')}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortHead col="signalReceivedAt">Date</SortHead>
                    <TableHead>Direction</TableHead>
                    <SortHead col="signalPrice" className="text-right">Signal price</SortHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <SortHead col="investmentAmount" className="text-right">Invested</SortHead>
                    <SortHead col="profitLoss" className="text-right">P&amp;L</SortHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.data.items.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell className="whitespace-nowrap text-text-secondary text-xs">
                        {formatDateTime(trade.signalReceivedAt)}
                      </TableCell>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            {/* Pagination */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-text-secondary">
              <span>
                {trades.data.total.toLocaleString()} trade{trades.data.total !== 1 ? 's' : ''}
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

      <div className="flex justify-end">
        <Button variant="secondary" asChild>
          <Link to="/stocks">Back to stocks</Link>
        </Button>
      </div>
    </div>
  )
}
