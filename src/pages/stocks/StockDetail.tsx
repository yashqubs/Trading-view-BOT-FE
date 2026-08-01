import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router'
import {
  ArrowLeft,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  TrendingDown,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard } from '@/components/common/StatCard'
import { StatusCombobox, type StatusFilterValue } from '@/components/common/StatusCombobox'
import { StatusPill } from '@/components/common/StatusPill'
import { EmptyState } from '@/components/common/EmptyState'
import { StatGridSkeleton } from '@/components/common/PageSkeleton'
import { Pagination } from '@/components/common/Pagination'
import { DateRangePicker, type DateRangeValue } from '@/components/common/DateRangePicker'
import { LineChartCard } from '@/components/charts/LineChartCard'
import { BarChartCard } from '@/components/charts/BarChartCard'
import { DonutChartCard } from '@/components/charts/DonutChartCard'
import { ChartExpandModal } from '@/components/charts/ChartExpandModal'
import { useStockStats } from '@/hooks/useStats'
import { useTrades } from '@/hooks/useTrades'
import { useStock, useUpdateStock } from '@/hooks/useStocks'
import { useTradingRules } from '@/hooks/useRules'
import { useSystemStatus } from '@/hooks/useSystem'
import { exportTradesCsv, type TradeFilters, type TradeSortBy } from '@/api/trades'
import { SendTestSignalModal } from './components/SendTestSignalModal'
import {
  type ExecutionMode,
  type StockMapping,
  type TradeDirection,
  type TradeLog,
} from '@/types'
import { formatCount, formatDateTime, formatMoney, formatPercent, formatPrice, formatQuantity } from '@/lib/format'
import { cn } from '@/lib/utils'

const DEFAULT_PAGE_SIZE = 25

type ExpandedChart = 'timeline' | 'entry-prices' | 'buy-sell' | 'status-breakdown'

const EXPANDED_CHART_TITLES: Record<ExpandedChart, string> = {
  timeline: 'Trade history timeline',
  'entry-prices': 'Signal entry prices',
  'buy-sell': 'Buy vs sell',
  'status-breakdown': 'Status breakdown',
}

type SortConfig = { by: TradeSortBy; order: 'asc' | 'desc' }

const SORT_COLUMNS: { key: TradeSortBy; label: string }[] = [
  { key: 'signalReceivedAt', label: 'Date' },
  { key: 'signalPrice', label: 'Signal price' },
  { key: 'tradeValue', label: 'Trade value' },
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

const EXECUTION_MODE_LABELS: Record<ExecutionMode, string> = {
  MARKET: 'Market price',
  SIGNAL_PRICE: 'Signal price',
}

// ─── Per-stock trading conditions — trading toggle is live; the rest is edited on its own screen ────────

function StockConditionsSummary({ stock }: { stock: StockMapping }) {
  const { data: rules } = useTradingRules()
  const { data: systemStatus } = useSystemStatus()
  const updateStock = useUpdateStock()

  async function handleTradingToggle(enabled: boolean) {
    try {
      await updateStock.mutateAsync({ id: stock.id, input: { enabled } })
      toast.success(enabled ? `${stock.tvTicker} trading on` : `${stock.tvTicker} trading stopped`)
    } catch {
      toast.error(`Could not update ${stock.tvTicker}`)
    }
  }

  return (
    <Card className="animate-fade-slide-in">
      <div className="flex items-start justify-between gap-3">
        <CardHeader className="p-0">
          <CardTitle>Trading conditions</CardTitle>
        </CardHeader>
        <div className="flex items-center gap-2">
          {systemStatus?.testSignalsEnabled && <SendTestSignalModal stock={stock} />}
          <Button variant="secondary" size="sm" asChild>
            <Link to={`/stocks/${stock.tvTicker}/edit`}>Edit</Link>
          </Button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-text-tertiary">Trading</span>
          <div className="flex items-center gap-2">
            <Switch
              checked={stock.enabled}
              onCheckedChange={handleTradingToggle}
              disabled={updateStock.isPending}
              aria-label={stock.enabled ? `Stop trading ${stock.tvTicker}` : `Start trading ${stock.tvTicker}`}
            />
            <span className={stock.enabled ? 'text-sm text-success' : 'text-sm text-text-tertiary'}>
              {stock.enabled ? 'On' : 'Stopped'}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-text-tertiary">Investment per trade</span>
          <span className="text-sm text-text-primary">
            {stock.investmentAmount != null
              ? formatMoney(stock.investmentAmount)
              : `Default (${rules ? formatMoney(rules.investmentAmount) : '…'})`}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-text-tertiary">Max daily spend</span>
          <span className="text-sm text-text-primary">
            {stock.maxDailySpend != null ? formatMoney(stock.maxDailySpend) : 'No limit'}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-text-tertiary">Fill price</span>
          <span className="text-sm text-text-primary">
            {stock.executionMode
              ? EXECUTION_MODE_LABELS[stock.executionMode]
              : `Default (${rules ? EXECUTION_MODE_LABELS[rules.executionMode] : '…'})`}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-text-tertiary">Max slippage</span>
          <span className="text-sm text-text-primary">
            {stock.maxSlippagePercent != null
              ? `${stock.maxSlippagePercent}%`
              : `Default (${rules ? rules.maxSlippagePercent : '…'}%)`}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-text-tertiary">IG epic</span>
          <span className="font-mono text-sm text-text-primary">{stock.igEpic}</span>
        </div>
      </div>
    </Card>
  )
}

export function StockDetail() {
  const { ticker = '' } = useParams<{ ticker: string }>()
  const stock = useStock(ticker)

  // ── Shared filters (search/sort/range), scoped to this ticker ──
  // Date range drives both the stat cards/charts above and the trade table
  // below; direction/status/sort only affect the trade table since the
  // stats endpoint only aggregates by date.
  const [direction, setDirection] = useState<TradeDirection | 'ALL'>('ALL')
  // 'EXECUTED' (Success + Failed) is this table's baseline — see
  // StatusCombobox. Note the global /trades page defaults to 'ALL' instead;
  // this one stays outcome-focused because it sits under a stock's stat
  // cards and charts, which are themselves about executions.
  const [status, setStatus] = useState<StatusFilterValue>('EXECUTED')
  const [dateRange, setDateRange] = useState<DateRangeValue>({ preset: 'all' })
  const [sort, setSort] = useState<SortConfig>({ by: 'signalReceivedAt', order: 'desc' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [exporting, setExporting] = useState(false)
  const [expandedChart, setExpandedChart] = useState<ExpandedChart | null>(null)

  useEffect(() => {
    setPage(1)
  }, [direction, status, dateRange, sort, ticker, pageSize])

  function handleSort(col: TradeSortBy) {
    setSort((s) =>
      s.by === col
        ? { by: col, order: s.order === 'asc' ? 'desc' : 'asc' }
        : { by: col, order: 'desc' },
    )
  }

  function clearFilters() {
    setDirection('ALL')
    setStatus('EXECUTED')
    setDateRange({ preset: 'all' })
    setSort({ by: 'signalReceivedAt', order: 'desc' })
    setPage(1)
  }

  const hasActiveFilters = direction !== 'ALL' || status !== 'EXECUTED' || dateRange.preset !== 'all'

  const stats = useStockStats(ticker, { from: dateRange.from || undefined, to: dateRange.to || undefined })

  const filters: TradeFilters = {
    ticker,
    direction: direction === 'ALL' ? undefined : direction,
    status:
      status === 'ALL' ? undefined : status === 'EXECUTED' ? ['SUCCESS', 'FAILED'] : status,
    from: dateRange.from || undefined,
    to: dateRange.to || undefined,
    sortBy: sort.by,
    sortOrder: sort.order,
    page,
    pageSize,
  }

  const trades = useTrades(filters)

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

      {/* ── Per-stock trading conditions — read-only summary; edited via its own /edit screen ── */}
      {stock.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : stock.data ? (
        <StockConditionsSummary stock={stock.data} />
      ) : (
        <Card className="animate-fade-slide-in">
          <p className="text-sm text-text-tertiary">
            {ticker} isn&apos;t configured for trading — no stock mapping exists for this ticker.
          </p>
        </Card>
      )}

      {/* ── Date range — governs the stat cards/charts below, and pre-fills the trade table's range too ── */}
      <Card className="animate-fade-slide-in">
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Date range</Label>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
      </Card>

      {stats.isLoading ? (
        <StatGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Total trades" value={stats.data?.totalTrades ?? 0} format={formatCount} />
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
                <StatusCombobox value={status} onChange={setStatus} baseline="EXECUTED" />
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
            description={
              !hasActiveFilters && status === 'EXECUTED'
                ? 'No successful or failed trades yet for this stock. If signals are coming in but being skipped, switch to "All statuses" to see them.'
                : 'Try widening your filters or check back once signals start arriving.'
            }
            action={
              hasActiveFilters ? (
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : status === 'EXECUTED' ? (
                <Button variant="secondary" size="sm" onClick={() => setStatus('ALL')}>
                  Show all statuses
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
                    <TableHead className="text-right">Executed price</TableHead>
                    <TableHead className="text-right">Size</TableHead>
                    <SortHead col="tradeValue" className="text-right">Trade value</SortHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.data.items.map((trade: TradeLog) => (
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
                      <TableCell className="text-right tabular-nums text-text-secondary">
                        {trade.executedPrice != null ? formatPrice(trade.executedPrice) : '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatQuantity(trade.size)}
                      </TableCell>
                      <TableCell
                        className="text-right tabular-nums"
                        title={
                          trade.isClosingTrade
                            ? 'Value of the position closed — not counted as new investment'
                            : undefined
                        }
                      >
                        {formatMoney(trade.tradeValue)}
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
            <Pagination
              page={page}
              pageSize={pageSize}
              totalItems={trades.data.total}
              itemLabel="trade"
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
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
