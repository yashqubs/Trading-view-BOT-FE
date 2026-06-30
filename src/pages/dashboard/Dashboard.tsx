import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { SlidersHorizontal, X } from 'lucide-react'
import { StatCard } from '@/components/common/StatCard'
import { AlertBanner } from '@/components/common/AlertBanner'
import { ProgressBar } from '@/components/common/ProgressBar'
import { LineChartCard } from '@/components/charts/LineChartCard'
import { AreaChartCard } from '@/components/charts/AreaChartCard'
import { DonutChartCard } from '@/components/charts/DonutChartCard'
import { BarChartCard } from '@/components/charts/BarChartCard'
import { ChartExpandModal } from '@/components/charts/ChartExpandModal'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { StockCombobox } from '@/components/common/StockCombobox'
import { DateRangePicker, calcPreset, type DateRangeValue } from '@/components/common/DateRangePicker'
import { useOverview, useByStock, useDailyActivity, useStatusBreakdown } from '@/hooks/useStats'
import { useSetBotEnabled } from '@/hooks/useRules'
import { useStocks } from '@/hooks/useStocks'
import { useAuth } from '@/context/AuthContext'
import { formatCount, formatMoney, formatPercent } from '@/lib/format'
import type { StatsFilters } from '@/api/stats'
import { cn } from '@/lib/utils'

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  SUCCESS: 'var(--success)',
  FAILED: 'var(--danger)',
  BOT_PAUSED: 'var(--danger)',
  AUTO_PAUSED: 'var(--danger)',
}

const DEFAULT_DAYS = 30

type ExpandedChart = 'trade-volume' | 'buy-sell' | 'status-breakdown' | 'top-stocks' | 'daily-invested'

// ─── Filter bar ───────────────────────────────────────────────────────────────

interface FilterBarProps {
  dateRange: DateRangeValue
  days: number
  ticker: string
  onDateRangeChange: (v: DateRangeValue) => void
  onDaysChange: (d: number) => void
  onTickerChange: (t: string) => void
  stockTickers: string[]
  hasFilter: boolean
  onClear: () => void
}

function FilterBar({
  dateRange,
  days,
  ticker,
  onDateRangeChange,
  onDaysChange,
  onTickerChange,
  stockTickers,
  hasFilter,
  onClear,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 animate-fade-slide-in">
      <SlidersHorizontal className="h-4 w-4 shrink-0 text-text-tertiary" />

      {/* Date range picker */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-tertiary whitespace-nowrap">Period</span>
        <DateRangePicker
          value={dateRange}
          onChange={onDateRangeChange}
          onDaysChange={onDaysChange}
        />
      </div>

      <div className="hidden h-5 w-px bg-border sm:block" />

      {/* Stock searchable combobox */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-tertiary whitespace-nowrap">Stock</span>
        <StockCombobox
          tickers={stockTickers}
          value={ticker}
          onChange={onTickerChange}
        />
      </div>

      {hasFilter && (
        <>
          <div className="hidden h-5 w-px bg-border sm:block" />
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-text-tertiary transition-colors hover:text-danger"
          >
            <X className="h-3 w-3" />
            Reset
          </button>
        </>
      )}

      {/* Active filter pills */}
      {hasFilter && (
        <div className="ml-auto flex flex-wrap gap-1.5">
          {ticker && (
            <button
              type="button"
              onClick={() => onTickerChange('')}
              className="flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs text-accent transition-opacity hover:opacity-70"
            >
              {ticker}
              <X className="h-2.5 w-2.5" />
            </button>
          )}
          {days !== DEFAULT_DAYS && (
            <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs text-accent">
              {dateRange.preset === 'today' ? 'Today' : dateRange.preset === 'custom' ? 'Custom' : `${days}d`}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

// Local-date YYYY-MM-DD, matching DateRangePicker's own 'today' preset convention.
function todayISODate(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// `{ preset: '30d' }` alone has no from/to — calcPreset fills them in so the
// very first render already queries the right window, instead of silently
// querying all-time until the user touches the date picker once.
function defaultDateRange(): DateRangeValue {
  const { from, to } = calcPreset('30d')
  return { preset: '30d', from, to }
}

export function Dashboard() {
  const { user } = useAuth()
  const todayISO = todayISODate()
  const [days, setDays] = useState(DEFAULT_DAYS)
  const [ticker, setTicker] = useState('')
  const [dateRange, setDateRange] = useState<DateRangeValue>(defaultDateRange)
  const [expandedChart, setExpandedChart] = useState<ExpandedChart | null>(null)
  const setBotEnabled = useSetBotEnabled()

  // Send exact calendar dates — the backend resolves `from`/`to` precisely,
  // unlike `days` which is always relative to today and can't express a
  // specific past date or range.
  const filters: StatsFilters = {
    from: dateRange.from,
    to: dateRange.to,
    ticker: ticker || undefined,
  }

  const overview = useOverview(filters)
  const dailyActivity = useDailyActivity(filters)
  // by-stock is a breakdown across tickers — the backend endpoint doesn't
  // accept a ticker filter (would be degenerate: a single-row breakdown).
  const byStock = useByStock({ from: dateRange.from, to: dateRange.to })
  const statusBreakdown = useStatusBreakdown(filters)
  const { data: stocks } = useStocks()

  const data = overview.data
  const investedPct =
    data?.dailyMaxTotalInvestment
      ? (data.todaysInvested / data.dailyMaxTotalInvestment) * 100
      : null
  const tradesPct =
    data?.dailyMaxTradeCount
      ? (data.todaysTrades / data.dailyMaxTradeCount) * 100
      : null
  const limitPct = Math.max(investedPct ?? 0, tradesPct ?? 0)
  const approachingLimit = limitPct >= 80 && limitPct < 100

  const topStocks = (byStock.data ?? [])
    .slice()
    .sort((a, b) => b.trades - a.trades)
    .slice(0, 8)

  const stockTickers = (stocks ?? []).map((s) => s.tvTicker)
  const hasFilter = days !== DEFAULT_DAYS || !!ticker

  // Carries the dashboard's current period + ticker filter into /trades, so
  // a card link shows exactly the trades the card's number was computed from.
  // `preset` travels too (not just the raw from/to dates) so the destination
  // page highlights the same "30D"/"7D"/etc. pill instead of falling back to
  // a generic "Custom" — same dates, but the UI no longer looks disconnected
  // from what was actually selected.
  function tradesLink(extra: Record<string, string> = {}) {
    const params = new URLSearchParams()
    if (dateRange.from) params.set('from', dateRange.from)
    if (dateRange.to) params.set('to', dateRange.to)
    if (dateRange.preset) params.set('preset', dateRange.preset)
    if (ticker) params.set('ticker', ticker)
    for (const [key, value] of Object.entries(extra)) params.set(key, value)
    const qs = params.toString()
    return qs ? `/trades?${qs}` : '/trades'
  }

  // "Today's trades"/"Today's invested" are always literally today on the
  // backend (they double as the daily-limit ratio, which resets daily
  // regardless of the period selected above) — so their link must point at
  // today's date specifically, not whatever range is selected elsewhere.
  function todaysTradesLink() {
    return tradesLink({ from: todayISO, to: todayISO, preset: 'today' })
  }

  // Invested amount only ever accrues from SUCCESS trades on the backend, so
  // scope the link to those specifically — otherwise the table includes
  // failed/skipped rows that contributed nothing to the figure shown.
  function todaysInvestedLink() {
    return tradesLink({ from: todayISO, to: todayISO, preset: 'today', status: 'SUCCESS' })
  }

  function positionsLink() {
    return ticker ? `/positions?ticker=${encodeURIComponent(ticker)}` : '/positions'
  }

  function clearFilters() {
    setDays(DEFAULT_DAYS)
    setTicker('')
    setDateRange(defaultDateRange())
  }

  function handleDateRangeChange(v: DateRangeValue) {
    setDateRange(v)
  }

  // Build a human-readable period label for chart titles. For presets, a
  // friendly relative label; for a custom range, the exact dates picked
  // (never "Today" unless the picked date actually is today).
  const rangeLabel = (() => {
    switch (dateRange.preset) {
      case 'today': return 'Today'
      case '7d':    return 'Last 7 days'
      case '30d':   return 'Last 30 days'
      case '90d':   return 'Last 90 days'
      case '1y':    return 'Last 12 months'
      case 'custom': {
        if (!dateRange.from) return `${days} days`
        const fmt = (iso: string) =>
          new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        return dateRange.from === dateRange.to || !dateRange.to
          ? fmt(dateRange.from)
          : `${fmt(dateRange.from)} – ${fmt(dateRange.to)}`
      }
      default: return `${days} days`
    }
  })()
  const periodLabel = ticker ? (rangeLabel === 'Last 30 days' ? ticker : `${ticker} · ${rangeLabel}`) : rangeLabel

  const expandedChartTitle = (() => {
    switch (expandedChart) {
      case 'trade-volume': return `Trade volume — ${periodLabel}`
      case 'buy-sell': return `Buy vs Sell — ${periodLabel}`
      case 'status-breakdown': return `Status breakdown — ${periodLabel}`
      case 'top-stocks': return `Top stocks by trade count — ${periodLabel}`
      case 'daily-invested': return `Daily invested amount — ${periodLabel}`
      default: return ''
    }
  })()

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-secondary">Global trading activity at a glance.</p>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <FilterBar
        dateRange={dateRange}
        days={days}
        ticker={ticker}
        onDateRangeChange={handleDateRangeChange}
        onDaysChange={setDays}
        onTickerChange={setTicker}
        stockTickers={stockTickers}
        hasFilter={hasFilter}
        onClear={clearFilters}
      />

      {/* ── Alerts ── */}
      {(data?.autoPaused || (data && data.consecutiveFailures > 0) || approachingLimit) && (
        <div className="flex flex-col gap-3">
          {data?.autoPaused && (
            <AlertBanner variant="danger" to="/conditions">
              The bot has auto-paused after repeated consecutive failures. Review the conditions page before re-enabling.
            </AlertBanner>
          )}
          {!!data && data.consecutiveFailures > 0 && !data.autoPaused && (
            <AlertBanner variant="warning" to="/trades?status=FAILED">
              {data.consecutiveFailures} consecutive trade failure{data.consecutiveFailures > 1 ? 's' : ''} recorded.
            </AlertBanner>
          )}
          {approachingLimit && (
            <AlertBanner variant="warning" to="/conditions">
              Approaching today&apos;s daily trading limit.
            </AlertBanner>
          )}
        </div>
      )}

      {/* ── KPI stat cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Bot status card */}
        <Card className={cn('animate-fade-slide-in', data?.botEnabled && 'border-accent/20')}>
          <p className="text-[13px] text-text-secondary">Bot status</p>
          <div className="mt-2 flex items-center gap-3">
            <p
              className={cn(
                'text-[30px] font-medium',
                data?.botEnabled ? 'text-accent' : 'text-text-secondary',
              )}
            >
              {overview.isLoading ? '…' : data?.botEnabled ? 'On' : 'Off'}
            </p>
            <Switch
              checked={!!data?.botEnabled}
              disabled={user?.role !== 'ADMIN' || overview.isLoading || setBotEnabled.isPending}
              onCheckedChange={(checked) =>
                setBotEnabled.mutate(checked, {
                  onSuccess: () => toast.success(checked ? 'Bot enabled' : 'Bot disabled'),
                  onError: () => toast.error('Could not update bot status'),
                })
              }
              aria-label="Toggle bot trading"
            />
          </div>
          {data?.autoPaused && <p className="mt-1 text-xs text-danger">Auto-paused</p>}
        </Card>

        <StatCard
          label={`Total trades (${periodLabel})`}
          value={data?.totalTrades ?? 0}
          format={formatCount}
          loading={overview.isLoading}
          to={tradesLink()}
        />
        <StatCard
          label="Today's trades"
          value={data?.todaysTrades ?? 0}
          format={formatCount}
          loading={overview.isLoading}
          to={todaysTradesLink()}
        />
        <StatCard
          label="Today's invested"
          value={data?.todaysInvested ?? 0}
          format={formatMoney}
          loading={overview.isLoading}
          to={todaysInvestedLink()}
        />

        {/* Daily limit remaining */}
        <Link
          to="/conditions"
          className="block rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Card className="card-glow animate-fade-slide-in hover:border-accent/30">
            <p className="text-[13px] text-text-secondary">Daily limit remaining</p>
            <p className="tabular-nums mt-2 text-[30px] font-medium text-text-primary">
              {overview.isLoading ? '…' : limitPct ? `${(100 - limitPct).toFixed(0)}%` : '—'}
            </p>
            <div className="mt-3">
              <ProgressBar value={limitPct ?? 0} />
            </div>
            {data && (
              <p className="mt-1.5 text-xs text-text-tertiary">
                {formatMoney(data.todaysInvested)} of{' '}
                {data.dailyMaxTotalInvestment ? formatMoney(data.dailyMaxTotalInvestment) : 'unlimited'}
              </p>
            )}
          </Card>
        </Link>

        <StatCard
          label="Open positions"
          value={data?.openPositions ?? 0}
          format={formatCount}
          loading={overview.isLoading}
          to={positionsLink()}
        />
        <StatCard
          label={`Success rate (${periodLabel})`}
          value={data?.successRate ?? 0}
          format={formatPercent}
          loading={overview.isLoading}
          to={tradesLink()}
        />
        <StatCard
          label="Consecutive failures"
          value={data?.consecutiveFailures ?? 0}
          format={formatCount}
          loading={overview.isLoading}
          warning={!!data && data.consecutiveFailures > 0}
          to="/trades?status=FAILED"
        />
      </div>

      {/* ── Charts row 1 ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LineChartCard
          title={`Trade volume — ${periodLabel}`}
          data={dailyActivity.data}
          xKey="date"
          yKey="trades"
          loading={dailyActivity.isLoading}
          onExpand={() => setExpandedChart('trade-volume')}
        />
        <DonutChartCard
          title={`Buy vs Sell — ${periodLabel}`}
          data={
            data
              ? [
                  { name: 'Buy', value: data.buyCount },
                  { name: 'Sell', value: data.sellCount },
                ]
              : undefined
          }
          loading={overview.isLoading}
          onExpand={() => setExpandedChart('buy-sell')}
        />
      </div>

      {/* ── Charts row 2 ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BarChartCard
          title={`Status breakdown — ${periodLabel}`}
          data={statusBreakdown.data?.filter((d) => d.count > 0)}
          xKey="status"
          yKey="count"
          loading={statusBreakdown.isLoading}
          colors={statusBreakdown.data?.map((d) => STATUS_COLOR[d.status] ?? 'var(--accent)')}
          onExpand={() => setExpandedChart('status-breakdown')}
        />
        <BarChartCard
          title={`Top stocks by trade count — ${periodLabel}`}
          data={topStocks}
          xKey="tvTicker"
          yKey="trades"
          horizontal
          loading={byStock.isLoading}
          onExpand={() => setExpandedChart('top-stocks')}
        />
      </div>

      {/* ── Area chart full width ── */}
      <AreaChartCard
        title={`Daily invested amount — ${periodLabel}`}
        data={dailyActivity.data}
        xKey="date"
        yKey="invested"
        loading={dailyActivity.isLoading}
        onExpand={() => setExpandedChart('daily-invested')}
      />

      {/* ── Expanded chart modal — reuses the same filter state as the page,
          so adjustments here stay in sync with everything above. ── */}
      <ChartExpandModal
        open={expandedChart !== null}
        onOpenChange={(open) => !open && setExpandedChart(null)}
        title={expandedChartTitle}
        filters={
          <>
            <DateRangePicker value={dateRange} onChange={handleDateRangeChange} onDaysChange={setDays} />
            {expandedChart !== 'top-stocks' && (
              <StockCombobox tickers={stockTickers} value={ticker} onChange={setTicker} />
            )}
          </>
        }
      >
        {expandedChart === 'trade-volume' && (
          <LineChartCard
            title={expandedChartTitle}
            bare
            data={dailyActivity.data}
            xKey="date"
            yKey="trades"
            loading={dailyActivity.isLoading}
            height={420}
          />
        )}
        {expandedChart === 'buy-sell' && (
          <DonutChartCard
            title={expandedChartTitle}
            bare
            data={
              data
                ? [
                    { name: 'Buy', value: data.buyCount },
                    { name: 'Sell', value: data.sellCount },
                  ]
                : undefined
            }
            loading={overview.isLoading}
            height={420}
          />
        )}
        {expandedChart === 'status-breakdown' && (
          <BarChartCard
            title={expandedChartTitle}
            bare
            data={statusBreakdown.data?.filter((d) => d.count > 0)}
            xKey="status"
            yKey="count"
            loading={statusBreakdown.isLoading}
            colors={statusBreakdown.data?.map((d) => STATUS_COLOR[d.status] ?? 'var(--accent)')}
            height={420}
          />
        )}
        {expandedChart === 'top-stocks' && (
          <BarChartCard
            title={expandedChartTitle}
            bare
            data={(byStock.data ?? []).slice().sort((a, b) => b.trades - a.trades)}
            xKey="tvTicker"
            yKey="trades"
            horizontal
            loading={byStock.isLoading}
            height={Math.max(420, (byStock.data?.length ?? 0) * 36)}
          />
        )}
        {expandedChart === 'daily-invested' && (
          <AreaChartCard
            title={expandedChartTitle}
            bare
            data={dailyActivity.data}
            xKey="date"
            yKey="invested"
            loading={dailyActivity.isLoading}
            height={420}
          />
        )}
      </ChartExpandModal>
    </div>
  )
}
