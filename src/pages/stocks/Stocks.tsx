import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { TableSkeleton } from '@/components/common/PageSkeleton'
import { RoleGate } from '@/components/common/RoleGate'
import { AddStockModal } from './components/AddStockModal'
import { EditStockModal } from './components/EditStockModal'
import { useDeleteStock, useStocks } from '@/hooks/useStocks'
import { formatMoney } from '@/lib/format'

export function Stocks() {
  const navigate = useNavigate()
  const { data: stocks, isLoading } = useStocks()
  const deleteStock = useDeleteStock()

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
      ) : (
        <Card className="p-0 animate-fade-slide-in">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticker</TableHead>
                <TableHead>Instrument</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Investment</TableHead>
                <TableHead>Daily cap</TableHead>
                <TableHead>Cool-down</TableHead>
                <TableHead>Max positions</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {stocks.map((stock) => (
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
