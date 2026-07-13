import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Plus, Search, Trash2, X } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { TableSkeleton } from '@/components/common/PageSkeleton'
import { SortableHeader, toggleSort, type SortConfig } from '@/components/common/SortableHeader'
import { useDeleteStock, useStocks, useUpdateStock } from '@/hooks/useStocks'
import { useTradingRules } from '@/hooks/useRules'
import { useSystemStatus } from '@/hooks/useSystem'
import { formatMoney } from '@/lib/format'
import { SendTestSignalModal } from './components/SendTestSignalModal'

type SortKey = 'tvTicker' | 'investmentAmount' | 'maxDailySpend' | 'createdAt'

export function Stocks() {
  const navigate = useNavigate()
  const { data: stocks, isLoading } = useStocks()
  const { data: rules } = useTradingRules()
  const { data: systemStatus } = useSystemStatus()
  const deleteStock = useDeleteStock()
  const updateStock = useUpdateStock()

  function resolvedInvestment(amount: number | null): number | undefined {
    return amount ?? rules?.investmentAmount
  }

  async function handleTradingToggle(stockId: number, ticker: string, enabled: boolean) {
    try {
      await updateStock.mutateAsync({ id: stockId, input: { enabled } })
      toast.success(enabled ? `${ticker} trading on` : `${ticker} trading stopped`)
    } catch {
      toast.error(`Could not update ${ticker}`)
    }
  }

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ENABLED' | 'DISABLED'>('ALL')
  // Newest-added first by default so a stock you just added is easy to find.
  const [sort, setSort] = useState<SortConfig<SortKey>>({ by: 'createdAt', order: 'desc' })

  const hasFilters = !!search || statusFilter !== 'ALL'

  function clearFilters() {
    setSearch('')
    setStatusFilter('ALL')
  }

  const filteredStocks = useMemo(() => {
    if (!stocks) return []
    const term = search.trim().toLowerCase()

    const filtered = stocks.filter((s) => {
      if (term && !s.tvTicker.toLowerCase().includes(term) && !s.instrumentName.toLowerCase().includes(term)) {
        return false
      }
      if (statusFilter === 'ENABLED' && !s.enabled) return false
      if (statusFilter === 'DISABLED' && s.enabled) return false
      return true
    })

    const dir = sort.order === 'asc' ? 1 : -1
    return filtered.slice().sort((a, b) => {
      switch (sort.by) {
        case 'tvTicker':
          return a.tvTicker.localeCompare(b.tvTicker) * dir
        case 'investmentAmount':
          return ((resolvedInvestment(a.investmentAmount) ?? 0) - (resolvedInvestment(b.investmentAmount) ?? 0)) * dir
        case 'maxDailySpend':
          return ((a.maxDailySpend ?? -1) - (b.maxDailySpend ?? -1)) * dir
        case 'createdAt':
          return (Date.parse(a.createdAt) - Date.parse(b.createdAt)) * dir
        default:
          return 0
      }
    })
  }, [stocks, search, statusFilter, sort, rules])

  function handleSort(key: SortKey) {
    setSort((s) => toggleSort(s, key))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-text-primary">Stocks</h1>
          <p className="text-sm text-text-secondary">Per-stock investment amounts and trading conditions.</p>
        </div>
        <Button onClick={() => navigate('/stocks/new')}>
          <Plus className="h-4 w-4" />
          Add stock
        </Button>
      </div>

      {!isLoading && !!stocks?.length && (
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
              <Label className="text-xs">Status</Label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All statuses</SelectItem>
                  <SelectItem value="ENABLED">Enabled</SelectItem>
                  <SelectItem value="DISABLED">Disabled</SelectItem>
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
      ) : !stocks?.length ? (
        <EmptyState
          title="No stocks yet"
          description="Add your first stock to start mapping TradingView signals to IG instruments."
          action={
            <Button onClick={() => navigate('/stocks/new')}>
              <Plus className="h-4 w-4" />
              Add stock
            </Button>
          }
        />
      ) : !filteredStocks.length ? (
        <EmptyState
          title="No stocks match your filters"
          description="Try a different search term or clear the filters."
          action={
            <Button variant="secondary" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <Card className="p-0 animate-fade-slide-in">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader sortKey="tvTicker" current={sort} onSort={handleSort}>Ticker</SortableHeader>
                <TableHead>Instrument</TableHead>
                <TableHead>IG epic</TableHead>
                <TableHead>Trading</TableHead>
                <SortableHeader sortKey="investmentAmount" current={sort} onSort={handleSort}>Investment</SortableHeader>
                <SortableHeader sortKey="maxDailySpend" current={sort} onSort={handleSort}>Daily cap</SortableHeader>
                <TableHead>Fill price</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStocks.map((stock) => (
                <TableRow
                  key={stock.id}
                  className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  tabIndex={0}
                  role="link"
                  aria-label={`View ${stock.tvTicker} statistics`}
                  onClick={() => navigate(`/stocks/${stock.tvTicker}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      navigate(`/stocks/${stock.tvTicker}`)
                    }
                  }}
                >
                  <TableCell className="font-medium">{stock.tvTicker}</TableCell>
                  <TableCell className="text-text-secondary">{stock.instrumentName}</TableCell>
                  <TableCell className="font-mono text-xs text-text-tertiary">{stock.igEpic}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={stock.enabled}
                        onCheckedChange={(checked) => handleTradingToggle(stock.id, stock.tvTicker, checked)}
                        disabled={updateStock.isPending}
                        aria-label={stock.enabled ? `Stop trading ${stock.tvTicker}` : `Start trading ${stock.tvTicker}`}
                      />
                      <span className={stock.enabled ? 'text-xs text-success' : 'text-xs text-text-tertiary'}>
                        {stock.enabled ? 'On' : 'Stopped'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatMoney(resolvedInvestment(stock.investmentAmount))}
                    {stock.investmentAmount == null && (
                      <span className="ml-1.5 text-xs text-text-tertiary">(default)</span>
                    )}
                  </TableCell>
                  <TableCell>{stock.maxDailySpend ? formatMoney(stock.maxDailySpend) : '—'}</TableCell>
                  <TableCell>
                    {stock.executionMode ? (
                      <Badge variant={stock.executionMode === 'SIGNAL_PRICE' ? 'accent' : 'neutral'}>
                        {stock.executionMode === 'SIGNAL_PRICE' ? 'Signal' : 'Market'}
                      </Badge>
                    ) : (
                      <span className="text-xs text-text-tertiary">Default</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      {systemStatus?.testSignalsEnabled && <SendTestSignalModal stock={stock} />}
                      <ConfirmDialog
                        trigger={
                          <Button variant="ghost" size="icon" aria-label={`Delete ${stock.tvTicker}`}>
                            <Trash2 className="h-4 w-4 text-danger" />
                          </Button>
                        }
                        title={`Delete ${stock.tvTicker}?`}
                        description="This removes the stock mapping. Trade history for this ticker is kept."
                        confirmLabel="Delete"
                        onConfirm={async () => {
                          await deleteStock.mutateAsync(stock.id)
                          toast.success(`${stock.tvTicker} removed`)
                        }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
