import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusPill } from '@/components/common/StatusPill'
import { EmptyState } from '@/components/common/EmptyState'
import { TableSkeleton } from '@/components/common/PageSkeleton'
import { useTrades } from '@/hooks/useTrades'
import { exportTradesCsv, type TradeFilters } from '@/api/trades'
import { TRADE_STATUSES, type TradeDirection, type TradeStatus } from '@/types'
import { formatDateTime, formatMoney, formatPrice, formatQuantity } from '@/lib/format'

const PAGE_SIZE = 25

export function Trades() {
  const [ticker, setTicker] = useState('')
  const [debouncedTicker, setDebouncedTicker] = useState('')
  const [direction, setDirection] = useState<TradeDirection | 'ALL'>('ALL')
  const [status, setStatus] = useState<TradeStatus | 'ALL'>('ALL')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedTicker(ticker), 300)
    return () => clearTimeout(t)
  }, [ticker])

  useEffect(() => {
    setPage(1)
  }, [debouncedTicker, direction, status, from, to])

  const filters: TradeFilters = {
    ticker: debouncedTicker || undefined,
    direction: direction === 'ALL' ? undefined : direction,
    status: status === 'ALL' ? undefined : status,
    from: from || undefined,
    to: to || undefined,
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
      const link = document.createElement('a')
      link.href = url
      link.download = `trades-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-text-primary">Trades</h1>
          <p className="text-sm text-text-secondary">Full signal and execution history.</p>
        </div>
        <Button variant="secondary" onClick={handleExport} disabled={exporting}>
          <Download className="h-4 w-4" />
          {exporting ? 'Exporting…' : 'Export CSV'}
        </Button>
      </div>

      <Card className="animate-fade-slide-in">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Input placeholder="Ticker" value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} />
          <Select value={direction} onValueChange={(v) => setDirection(v as TradeDirection | 'ALL')}>
            <SelectTrigger>
              <SelectValue placeholder="Direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All directions</SelectItem>
              <SelectItem value="BUY">Buy</SelectItem>
              <SelectItem value="SELL">Sell</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => setStatus(v as TradeStatus | 'ALL')}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {TRADE_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
        </div>
      </Card>

      {isLoading ? (
        <TableSkeleton rows={10} />
      ) : !data?.items.length ? (
        <EmptyState title="No trades found" description="Try widening your filters or check back once signals start arriving." />
      ) : (
        <>
          <Card className={`p-0 animate-fade-slide-in ${isFetching ? 'opacity-70' : ''}`}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Ticker</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Invested</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Deal ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell>{formatDateTime(trade.signalReceivedAt)}</TableCell>
                    <TableCell className="font-medium">{trade.tvTicker}</TableCell>
                    <TableCell>
                      <Badge variant={trade.direction === 'BUY' ? 'accent' : 'neutral'}>{trade.direction}</Badge>
                    </TableCell>
                    <TableCell>{formatPrice(trade.signalPrice)}</TableCell>
                    <TableCell>{formatQuantity(trade.quantity)}</TableCell>
                    <TableCell>{formatMoney(trade.investmentAmount)}</TableCell>
                    <TableCell>
                      <StatusPill status={trade.status} />
                    </TableCell>
                    <TableCell className="text-text-tertiary">{trade.dealId ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <div className="flex items-center justify-between text-sm text-text-secondary">
            <span>
              Page {page} of {totalPages} · {data.total} trades
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
