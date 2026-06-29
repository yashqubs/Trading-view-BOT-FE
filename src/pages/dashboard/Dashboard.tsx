import { useState } from 'react'
import { toast } from 'sonner'
import { SlidersHorizontal, X } from 'lucide-react'
import { StatCard } from '@/components/common/StatCard'
import { AlertBanner } from '@/components/common/AlertBanner'
import { ProgressBar } from '@/components/common/ProgressBar'
import { LineChartCard } from '@/components/charts/LineChartCard'
import { AreaChartCard } from '@/components/charts/AreaChartCard'
import { DonutChartCard } from '@/components/charts/DonutChartCard'
import { BarChartCard } from '@/components/charts/BarChartCard'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { StockCombobox } from '@/components/common/StockCombobox'
import { DateRangePicker, type DateRangeValue } from '@/components/common/DateRangePicker'
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
          className="w-[200px]"
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
              {days === 1 ? 'Today' : `${days}d`}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function Dashboard() {
  const { user } = useAuth()
  const [days, setDays] = useState(DEFAULT_DAYS)
  const [ticker, setTicker] = useState('')
  const [dateRange, setDateRange] = useState<DateRangeValue>({ preset: '30d' })
  const setBotEnabled = useSetBotEnabled()

  const filters: StatsFilters = {
    days,
    ticker: ticker || undefined,
  }

  const overview = useOverview(filters)
  const dailyActivity = useDailyActivity(filters)
  const byStock = useByStock({ days })
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

  function clearFilters() {
    setDays(DEFAULT_DAYS)
    setTicker('')
    setDateRange({ preset: '30d' })
  }

  function handleDateRangeChange(v: DateRangeValue) {
    setDateRange(v)
  }

  // Build a human-readable period label for chart titles
  const periodLabel = (() => {
    if (ticker && days !== DEFAULT_DAYS) return `${ticker} · ${days}d`
    if (ticker) return ticker
    if (days === 1) return 'Today'
    if (days === 7) return 'Last 7 days'
    if (days === 14) return 'Last 14 days'
    if (days === 30) return 'Last 30 days'
    if (days === 90) return 'Last 90 days'
    if (days === 180) return 'Last 6 months'
    if (days === 365) return 'Last 12 months'
    return `${days} days`
  })()

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-secondary">Global trading activity at a glance.</p>
        </div>
        {user?.role === 'ADMIN' && (
          <div
            className={cn(
              'flex items-center gap-2 rounded-full border border-border px-3 py-1.5',
              data?.botEnabled ? 'bg-accent-soft' : 'bg-surface-2',
            )}
          >
            <span className={cn('text-xs font-medium', data?.botEnabled ? 'text-accent' : 'text-text-secondary')}>
              Bot {overview.isLoading ? '…' : data?.botEnabled ? 'on' : 'off'}
            </span>
            <Switch
              checked={!!data?.botEnabled}
              disabled={overview.isLoading || setBotEnabled.isPending}
              onCheckedChange={(checked) =>
                setBotEnabled.mutate(checked, {
                  onSuccess: () => toast.success(checked ? 'Bot enabled' : 'Bot disabled'),
                  onError: () => toast.error('Could not update bot status'),
                })
              }
              aria-label="Toggle bot trading"
            />
          </div>
        )}
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
            <AlertBanner variant="danger">
              The bot has auto-paused after repeated consecutive failures. Review the conditions page before re-enabling.
            </AlertBanner>
          )}
          {!!data && data.consecutiveFailures > 0 && !data.autoPaused && (
            <AlertBanner variant="warning">
              {data.consecutiveFailures} consecutive trade failure{data.consecutiveFailures > 1 ? 's' : ''} recorded.
            </AlertBanner>
          )}
          {approachingLimit && (
            <AlertBanner variant="warning">Approaching today&apos;s daily trading limit.</AlertBanner>
          )}
        </div>
      )}

      {/* ── KPI stat cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Bot status card */}
        <div
          className={cn(
            'rounded-card border border-border bg-surface p-5 animate-fade-slide-in',
            data?.botEnabled ? 'border-accent/20' : '',
          )}
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">Bot status</p>
          <div className="mt-2 flex items-center gap-3">
            <p
              className={cn(
                'text-[30px] font-semibold',
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
        </div>

        <StatCard
          label="Total trades"
          value={data?.totalTrades ?? 0}
          format={formatCount}
          loading={overview.isLoading}
        />
        <StatCard
          label={days === 1 ? "Today's trades" : `Trades (${periodLabel})`}
          value={data?.todaysTrades ?? 0}
          format={formatCount}
          loading={overview.isLoading}
        />
        <StatCard
          label={days === 1 ? "Today's invested" : `Invested (${periodLabel})`}
          value={data?.todaysInvested ?? 0}
          format={formatMoney}
          loading={overview.isLoading}
        />

        {/* Daily limit remaining */}
        <div className="rounded-card border border-border bg-surface p-5 animate-fade-slide-in">
          <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
            Daily limit remaining
          </p>
          <p className="tabular-nums mt-2 text-[24px] font-semibold text-text-primary">
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
        </div>

        <StatCard
          label="Open positions"
          value={data?.openPositions ?? 0}
          format={formatCount}
          loading={overview.isLoading}
        />
        <StatCard
          label="Success rate"
          value={data?.successRate ?? 0}
          format={formatPercent}
          loading={overview.isLoading}
        />
        <StatCard
          label="Consecutive failures"
          value={data?.consecutiveFailures ?? 0}
          format={formatCount}
          loading={overview.isLoading}
          warning={!!data && data.consecutiveFailures > 0}
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
        />
        <BarChartCard
          title={`Top stocks by trade count — ${periodLabel}`}
          data={topStocks}
          xKey="tvTicker"
          yKey="trades"
          horizontal
          loading={byStock.isLoading}
        />
      </div>

      {/* ── Area chart full width ── */}
      <AreaChartCard
        title={`Daily invested amount — ${periodLabel}`}
        data={dailyActivity.data}
        xKey="date"
        yKey="invested"
        loading={dailyActivity.isLoading}
      />

      {/* ── Quick actions (admin only) ── */}
      {user?.role === 'ADMIN' && (
        <div className="flex flex-wrap gap-3 rounded-xl border border-border bg-surface px-4 py-3">
          <p className="w-full text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
            Quick actions
          </p>
          <Button variant="secondary" size="sm" onClick={() => (window.location.href = '/trades')}>
            View all trades
          </Button>
          <Button variant="secondary" size="sm" onClick={() => (window.location.href = '/conditions')}>
            Edit conditions
          </Button>
          <Button variant="secondary" size="sm" onClick={() => (window.location.href = '/stocks')}>
            Manage stocks
          </Button>
        </div>
      )}
    </div>
  )
}
