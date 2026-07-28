import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import {
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  TrendingDown,
  X,
} from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusCombobox, type StatusFilterValue } from '@/components/common/StatusCombobox'
import { StatusPill } from '@/components/common/StatusPill'
import { EmptyState } from '@/components/common/EmptyState'
import { Pagination } from '@/components/common/Pagination'
import { DateRangePicker, type DateRangeValue, type PresetKey } from '@/components/common/DateRangePicker'
import { useTrades } from '@/hooks/useTrades'
import { useSocketEvent } from '@/hooks/useSocketEvent'
import { exportTradesCsv, type TradeFilters, type TradeSortBy } from '@/api/trades'
import {
  TRADE_STATUSES,
  type TradeDirection,
  type TradeLog,
  type TradeStatus,
  type TradeSummary,
} from '@/types'
import { formatDateTime, formatMoney, formatPercent, formatPrice, formatQuantity } from '@/lib/format'
import { explainTradeError } from '@/lib/tradeError'
import { cn } from '@/lib/utils'

const DEFAULT_PAGE_SIZE = 25

// ─── Status labels ───────────────────────────────────────────────────────────

const STATUS_LABELS: Record<TradeStatus, string> = {
  SUCCESS: 'Success',
  FAILED: 'Failed',
  MARKET_CLOSED: 'Market closed',
  NOT_MAPPED: 'Not mapped',
  DISABLED: 'Disabled',
  NO_POSITION: 'No position',
  ALREADY_LONG: 'Already long',
  ALREADY_SHORT: 'Already short',
  BOT_PAUSED: 'Bot paused',
  BUY_DISABLED: 'Buy disabled',
  SELL_DISABLED: 'Sell disabled',
  DAILY_TOTAL_LIMIT: 'Daily open cap reached',
  DAILY_TRADE_LIMIT: 'Daily trade limit',
  GLOBAL_POSITION_LIMIT: 'Global position limit',
  STOCK_DAILY_LIMIT: 'Stock daily limit',
  COOL_DOWN: 'Cool-down',
  MAX_POSITIONS_STOCK: 'Max positions',
  AUTO_PAUSED: 'Auto-paused',
  DUPLICATE_SIGNAL: 'Duplicate signal',
}

// ─── Sort helpers ─────────────────────────────────────────────────────────────

type SortConfig = { by: TradeSortBy; order: 'asc' | 'desc' }

const SORT_COLUMNS: { key: TradeSortBy; label: string }[] = [
  { key: 'signalReceivedAt', label: 'Date' },
  { key: 'tvTicker', label: 'Ticker' },
  { key: 'signalPrice', label: 'Signal price' },
  { key: 'tradeValue', label: 'Trade value' },
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

// ─── Failure / skip reason cell ───────────────────────────────────────────────

// Failed trades must show WHY, with the full message reachable in one
// click — the cell itself is a fixed width (so truncate has something
// concrete to clip against; the table has no fixed layout, so a plain
// max-width on the <td> doesn't cap a growing button inside it) and opens a
// modal with the complete explanation + raw code. Nothing is hover-only.
function TradeReason({ trade, onOpen }: { trade: TradeLog; onOpen: (trade: TradeLog) => void }) {
  if (trade.errorMessage) {
    const explanation = explainTradeError(trade.errorMessage, trade.direction)
    return (
      <button
        type="button"
        onClick={() => onOpen(trade)}
        className="block w-48 truncate text-left text-xs text-danger underline decoration-dotted underline-offset-2 hover:text-danger/80"
      >
        {explanation ?? trade.errorMessage}
      </button>
    )
  }
  if (trade.skipReason) {
    // skipReason is always the raw status code (e.g. ALREADY_LONG) — show
    // the same friendly label the status pill uses, not the bare enum value.
    return (
      <button
        type="button"
        onClick={() => onOpen(trade)}
        className="block w-48 truncate text-left text-xs text-text-tertiary underline decoration-dotted underline-offset-2 hover:text-text-secondary"
      >
        {STATUS_LABELS[trade.status] ?? trade.skipReason}
      </button>
    )
  }
  return <span className="text-text-tertiary">—</span>
}

function TradeReasonModal({ trade, onClose }: { trade: TradeLog | null; onClose: () => void }) {
  const explanation = trade?.errorMessage
    ? explainTradeError(trade.errorMessage, trade.direction)
    : null
  const rawCode = trade?.errorMessage ?? trade?.skipReason ?? null
  const friendlyText = trade
    ? trade.errorMessage
      ? (explanation ?? trade.errorMessage)
      : (STATUS_LABELS[trade.status] ?? trade.skipReason)
    : null
  const isError = !!trade?.errorMessage
  // The raw code is only worth a second line when it says something the
  // friendly sentence above it doesn't — otherwise it's the same string twice.
  const showRawCode = !!rawCode && rawCode !== friendlyText

  return (
    <Dialog open={trade !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        {trade && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                  trade.direction === 'BUY' ? 'bg-accent-soft text-accent' : 'bg-surface-2 text-text-secondary',
                )}
              >
                {trade.direction === 'BUY'
                  ? <TrendingUp className="h-4.5 w-4.5" />
                  : <TrendingDown className="h-4.5 w-4.5" />}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-base font-semibold text-text-primary">{trade.tvTicker}</p>
                  <StatusPill status={trade.status} />
                </div>
                <p className="mt-0.5 text-xs text-text-tertiary">
                  {formatDateTime(trade.signalReceivedAt)} · Signal {formatPrice(trade.signalPrice)}
                </p>
              </div>
            </div>

            {friendlyText && (
              <div className={cn('border-l-2 pl-3.5', isError ? 'border-danger' : 'border-accent/40')}>
                <p className={cn('text-sm leading-relaxed', isError ? 'text-danger' : 'text-text-secondary')}>
                  {friendlyText}
                </p>
                {showRawCode && (
                  <p className="mt-2 font-mono text-[11px] text-text-tertiary">{rawCode}</p>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
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
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function Trades() {
  // Supports deep links like /trades?status=FAILED&from=2026-06-01&to=2026-06-30&ticker=AAPL
  // from the dashboard cards — they carry the exact filter context the user saw there.
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialStatus = searchParams.get('status')
  const initialFrom = searchParams.get('from') ?? undefined
  const initialTo = searchParams.get('to') ?? undefined
  const initialPreset = searchParams.get('preset')
  const initialTicker = searchParams.get('ticker') ?? ''
  const isValidStatus = (s: string | null): s is TradeStatus =>
    !!s && (TRADE_STATUSES as readonly string[]).includes(s)
  const VALID_PRESETS: readonly string[] = ['all', 'today', '7d', '30d', '90d', '1y', 'custom']
  const isValidPreset = (p: string | null): p is PresetKey => !!p && VALID_PRESETS.includes(p)

  const [reasonModalTrade, setReasonModalTrade] = useState<TradeLog | null>(null)
  const [ticker, setTicker] = useState(initialTicker)
  const [debouncedTicker, setDebouncedTicker] = useState(initialTicker)
  const [direction, setDirection] = useState<TradeDirection | 'ALL'>('ALL')
  // 'EXECUTED' (Success + Failed) is the default — the raw signal log is
  // dominated by skip reasons (bot paused, cool-downs, etc.) that aren't
  // outcomes someone scanning trade history usually wants mixed in by
  // default. A deep link with an explicit ?status= still wins outright, same
  // as before.
  const [status, setStatus] = useState<StatusFilterValue>(
    isValidStatus(initialStatus) ? initialStatus : 'EXECUTED',
  )
  const [dateRange, setDateRange] = useState<DateRangeValue>(
    initialFrom || initialTo
      ? { from: initialFrom, to: initialTo, preset: isValidPreset(initialPreset) ? initialPreset : 'custom' }
      : { preset: 'all' },
  )
  const [sort, setSort] = useState<SortConfig>({ by: 'signalReceivedAt', order: 'desc' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [exporting, setExporting] = useState(false)

  // Debounce ticker input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedTicker(ticker), 300)
    return () => clearTimeout(t)
  }, [ticker])

  // Reset to page 1 when filters (or the page size) change
  useEffect(() => {
    setPage(1)
  }, [debouncedTicker, direction, status, dateRange, sort, pageSize])

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
    setStatus('EXECUTED')
    setDateRange({ preset: 'all' })
    setSort({ by: 'signalReceivedAt', order: 'desc' })
    setPage(1)
  }

  // 'EXECUTED' is the baseline view, not an active filter someone chose — so
  // it must not count toward "has active filters" (which drives the "Clear
  // filters" affordance and the active-filter empty-state action).
  const hasActiveFilters =
    ticker || direction !== 'ALL' || status !== 'EXECUTED' || dateRange.preset !== 'all'

  const filters: TradeFilters = {
    ticker: debouncedTicker || undefined,
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

  const { data, isLoading, isFetching } = useTrades(filters)

  // Scoped to this page specifically (not the shared useTrades hook, which
  // StockDetail also uses) — a toast for every trade shouldn't fire while
  // someone's looking at one unrelated stock's detail page.
  useSocketEvent<TradeLog>('trade:created', (trade) => {
    if (trade.status === 'SUCCESS') {
      toast.success(`${trade.tvTicker} ${trade.direction} executed`)
    } else if (trade.status === 'FAILED') {
      toast.error(`${trade.tvTicker} ${trade.direction} failed`)
    }
    // Skips (BOT_PAUSED, MARKET_CLOSED, DUPLICATE_SIGNAL, etc.) are frequent
    // and expected — no toast noise for those, the row still appears live.
  })

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
          <p className="text-sm text-text-secondary">Signal log with execution details and statistics.</p>
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
              <StatusCombobox value={status} onChange={setStatus} />
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
              <DateRangePicker value={dateRange} onChange={setDateRange} />
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-xs">Sort order</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={sort.order === 'desc' ? 'primary' : 'secondary'}
                  onClick={() => setSort((s) => ({ ...s, order: 'desc' }))}
                >
                  <ArrowDown className="h-3 w-3" /> {sortOrderLabels(sort.by).desc}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={sort.order === 'asc' ? 'primary' : 'secondary'}
                  onClick={() => setSort((s) => ({ ...s, order: 'asc' }))}
                >
                  <ArrowUp className="h-3 w-3" /> {sortOrderLabels(sort.by).asc}
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
          description={
            // "Executed only" is the default, invisible filter — a signal log
            // that's entirely skips (bot just enabled, nothing mapped yet)
            // would otherwise look identical to "nothing has happened at
            // all" with no visible way out.
            !hasActiveFilters && status === 'EXECUTED'
              ? 'No successful or failed trades yet. If signals are coming in but being skipped (bot paused, not mapped, etc.), switch to "All statuses" to see them.'
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
          <Card className={cn('p-0 animate-fade-slide-in transition-opacity', isFetching && 'opacity-60')}>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortHead col="signalReceivedAt">Date</SortHead>
                  <SortHead col="tvTicker">Ticker</SortHead>
                  <TableHead>Direction</TableHead>
                  <SortHead col="signalPrice" className="text-right">Signal price</SortHead>
                  <TableHead className="text-right">Executed price</TableHead>
                  <TableHead className="text-right">Size</TableHead>
                  <SortHead col="tradeValue" className="text-right">Trade value</SortHead>
                  <TableHead className="text-right">Max slippage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Deal ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((trade: TradeLog) => (
                  <TableRow
                    key={trade.id}
                    className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    tabIndex={0}
                    role="link"
                    aria-label={`View ${trade.tvTicker} statistics`}
                    onClick={() => navigate(`/stocks/${trade.tvTicker}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        navigate(`/stocks/${trade.tvTicker}`)
                      }
                    }}
                  >
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
                    <TableCell
                      className="text-right tabular-nums text-text-secondary"
                      title={
                        trade.maxSlippagePercent == null
                          ? 'No price tolerance — market-price execution'
                          : undefined
                      }
                    >
                      {formatPercent(trade.maxSlippagePercent)}
                    </TableCell>
                    <TableCell>
                      <StatusPill status={trade.status} />
                    </TableCell>
                    <TableCell className="max-w-[260px]" onClick={(e) => e.stopPropagation()}>
                      <TradeReason trade={trade} onOpen={setReasonModalTrade} />
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
          <Pagination
            page={page}
            pageSize={pageSize}
            totalItems={data.total}
            itemLabel="trade"
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}
      <TradeReasonModal trade={reasonModalTrade} onClose={() => setReasonModalTrade(null)} />
    </div>
  )
}
