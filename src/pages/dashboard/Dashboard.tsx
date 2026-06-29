import { toast } from 'sonner'
import { StatCard } from '@/components/common/StatCard'
import { AlertBanner } from '@/components/common/AlertBanner'
import { ProgressBar } from '@/components/common/ProgressBar'
import { LineChartCard } from '@/components/charts/LineChartCard'
import { AreaChartCard } from '@/components/charts/AreaChartCard'
import { DonutChartCard } from '@/components/charts/DonutChartCard'
import { BarChartCard } from '@/components/charts/BarChartCard'
import { Switch } from '@/components/ui/switch'
import { useOverview, useByStock, useDailyActivity, useStatusBreakdown } from '@/hooks/useStats'
import { useSetBotEnabled } from '@/hooks/useRules'
import { useAuth } from '@/context/AuthContext'
import { formatCount, formatMoney, formatPercent } from '@/lib/format'

const STATUS_COLOR: Record<string, string> = {
  SUCCESS: 'var(--success)',
  FAILED: 'var(--danger)',
  BOT_PAUSED: 'var(--danger)',
  AUTO_PAUSED: 'var(--danger)',
}

export function Dashboard() {
  const { user } = useAuth()
  const overview = useOverview()
  const dailyActivity = useDailyActivity(30)
  const byStock = useByStock()
  const statusBreakdown = useStatusBreakdown()
  const setBotEnabled = useSetBotEnabled()

  const data = overview.data
  const investedPct =
    data?.dailyMaxTotalInvestment ? (data.todaysInvested / data.dailyMaxTotalInvestment) * 100 : null
  const tradesPct =
    data?.dailyMaxTradeCount ? (data.todaysTrades / data.dailyMaxTradeCount) * 100 : null
  const limitPct = Math.max(investedPct ?? 0, tradesPct ?? 0)
  const approachingLimit = limitPct >= 80 && limitPct < 100

  const topStocks = (byStock.data ?? [])
    .slice()
    .sort((a, b) => b.trades - a.trades)
    .slice(0, 8)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-medium text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-secondary">Global trading activity at a glance.</p>
      </div>

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-card border border-border bg-surface p-5 animate-fade-slide-in">
          <div className="flex items-start justify-between">
            <p className="text-[13px] text-text-secondary">Bot status</p>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <p className="text-[30px] font-medium text-text-primary">{data?.botEnabled ? 'On' : 'Off'}</p>
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
        </div>

        <StatCard label="Total trades" value={data?.totalTrades ?? 0} format={formatCount} loading={overview.isLoading} />
        <StatCard label="Today's trades" value={data?.todaysTrades ?? 0} format={formatCount} loading={overview.isLoading} />
        <StatCard label="Today's invested" value={data?.todaysInvested ?? 0} format={formatMoney} loading={overview.isLoading} />

        <div className="rounded-card border border-border bg-surface p-5 animate-fade-slide-in">
          <p className="text-[13px] text-text-secondary">Daily limit remaining</p>
          <p className="tabular-nums mt-2 text-[24px] font-medium text-text-primary">
            {limitPct ? `${(100 - limitPct).toFixed(0)}%` : '—'}
          </p>
          <div className="mt-3">
            <ProgressBar value={limitPct} />
          </div>
        </div>

        <StatCard label="Open positions" value={data?.openPositions ?? 0} format={formatCount} loading={overview.isLoading} />
        <StatCard label="Success rate" value={data?.successRate ?? 0} format={formatPercent} loading={overview.isLoading} />
        <StatCard
          label="Consecutive failures"
          value={data?.consecutiveFailures ?? 0}
          format={formatCount}
          loading={overview.isLoading}
          warning={!!data && data.consecutiveFailures > 0}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LineChartCard
          title="Trade volume (last 30 days)"
          data={dailyActivity.data}
          xKey="date"
          yKey="trades"
          loading={dailyActivity.isLoading}
        />
        <DonutChartCard
          title="Buy vs sell"
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
        <BarChartCard
          title="Trade status breakdown"
          data={statusBreakdown.data}
          xKey="status"
          yKey="count"
          loading={statusBreakdown.isLoading}
          colors={statusBreakdown.data?.map((d) => STATUS_COLOR[d.status] ?? 'var(--text-tertiary)')}
        />
        <BarChartCard
          title="Top stocks by trade count"
          data={topStocks}
          xKey="tvTicker"
          yKey="trades"
          horizontal
          loading={byStock.isLoading}
        />
        <div className="lg:col-span-2">
          <AreaChartCard
            title="Daily invested amount (last 30 days)"
            data={dailyActivity.data}
            xKey="date"
            yKey="invested"
            loading={dailyActivity.isLoading}
          />
        </div>
      </div>
    </div>
  )
}
