import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Search, Trash2, X } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { TableSkeleton } from '@/components/common/PageSkeleton'
import { RoleGate } from '@/components/common/RoleGate'
import { SortableHeader, toggleSort, type SortConfig } from '@/components/common/SortableHeader'
import { AddStockModal } from './components/AddStockModal'
import { EditStockModal } from './components/EditStockModal'
import { useDeleteStock, useStocks } from '@/hooks/useStocks'
import { formatMoney } from '@/lib/format'

type SortKey = 'tvTicker' | 'investmentAmount' | 'maxDailySpend' | 'coolDownMinutes' | 'maxOpenPositions'

export function Stocks() {
  const navigate = useNavigate()
  const { data: stocks, isLoading } = useStocks()
  const deleteStock = useDeleteStock()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ENABLED' | 'DISABLED'>('ALL')
  const [sort, setSort] = useState<SortConfig<SortKey>>({ by: 'tvTicker', order: 'asc' })

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
          return (a.investmentAmount - b.investmentAmount) * dir
        case 'maxDailySpend':
          return ((a.maxDailySpend ?? -1) - (b.maxDailySpend ?? -1)) * dir
        case 'coolDownMinutes':
          return ((a.coolDownMinutes ?? -1) - (b.coolDownMinutes ?? -1)) * dir
        case 'maxOpenPositions':
          return (a.maxOpenPositions - b.maxOpenPositions) * dir
        default:
          return 0
      }
    })
  }, [stocks, search, statusFilter, sort])

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
        <RoleGate allow={['ADMIN']}>
          <AddStockModal />
        </RoleGate>
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
            <RoleGate allow={['ADMIN']}>
              <AddStockModal />
            </RoleGate>
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
                <TableHead>Status</TableHead>
                <SortableHeader sortKey="investmentAmount" current={sort} onSort={handleSort}>Investment</SortableHeader>
                <SortableHeader sortKey="maxDailySpend" current={sort} onSort={handleSort}>Daily cap</SortableHeader>
                <SortableHeader sortKey="coolDownMinutes" current={sort} onSort={handleSort}>Cool-down</SortableHeader>
                <SortableHeader sortKey="maxOpenPositions" current={sort} onSort={handleSort}>Max positions</SortableHeader>
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
                  <TableCell>
                    <Badge variant={stock.enabled ? 'success' : 'neutral'}>
                      {stock.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatMoney(stock.investmentAmount)}</TableCell>
                  <TableCell>{stock.maxDailySpend ? formatMoney(stock.maxDailySpend) : '—'}</TableCell>
                  <TableCell>{stock.coolDownMinutes ? `${stock.coolDownMinutes}m` : '—'}</TableCell>
                  <TableCell>{stock.maxOpenPositions}</TableCell>
                  <TableCell>
                    <RoleGate allow={['ADMIN']}>
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <EditStockModal stock={stock} />
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
                    </RoleGate>
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
