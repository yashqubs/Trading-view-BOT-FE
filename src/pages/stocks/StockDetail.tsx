import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/common/StatCard'
import { StatusPill } from '@/components/common/StatusPill'
import { EmptyState } from '@/components/common/EmptyState'
import { TableSkeleton, StatGridSkeleton } from '@/components/common/PageSkeleton'
import { LineChartCard } from '@/components/charts/LineChartCard'
import { BarChartCard } from '@/components/charts/BarChartCard'
import { DonutChartCard } from '@/components/charts/DonutChartCard'
import { useStockStats } from '@/hooks/useStats'
import { useTrades } from '@/hooks/useTrades'
import { formatCount, formatDateTime, formatMoney, formatPercent, formatPrice, formatQuantity } from '@/lib/format'

export function StockDetail() {
  const { ticker = '' } = useParams<{ ticker: string }>()
  const stats = useStockStats(ticker)
  const trades = useTrades({ ticker, pageSize: 50 })

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
        />
        <LineChartCard
          title="Signal entry prices"
          data={stats.data?.entryPrices}
          xKey="date"
          yKey="price"
          loading={stats.isLoading}
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
        />
        <BarChartCard
          title="Status breakdown"
          data={stats.data?.statusBreakdown}
          xKey="status"
          yKey="count"
          loading={stats.isLoading}
        />
        <div className="lg:col-span-2">
          <BarChartCard
            title="Invested amount over time"
            data={stats.data?.investedOverTime}
            xKey="date"
            yKey="invested"
            loading={stats.isLoading}
          />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-text-primary">Trade history</h2>
        {trades.isLoading ? (
          <TableSkeleton />
        ) : !trades.data?.items.length ? (
          <EmptyState title="No trades yet" description="Trades for this stock will appear here once the bot executes signals." />
        ) : (
          <Card className="p-0 animate-fade-slide-in">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Invested</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trades.data.items.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell>{formatDateTime(trade.signalReceivedAt)}</TableCell>
                    <TableCell>
                      <Badge variant={trade.direction === 'BUY' ? 'accent' : 'neutral'}>{trade.direction}</Badge>
                    </TableCell>
                    <TableCell>{formatPrice(trade.signalPrice)}</TableCell>
                    <TableCell>{formatQuantity(trade.quantity)}</TableCell>
                    <TableCell>{formatMoney(trade.investmentAmount)}</TableCell>
                    <TableCell>
                      <StatusPill status={trade.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
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
