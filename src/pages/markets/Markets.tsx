import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { TableSkeleton } from '@/components/common/PageSkeleton'
import { CreateMarketModal } from './components/CreateMarketModal'
import { EditMarketModal } from './components/EditMarketModal'
import { useDeleteMarket, useMarkets } from '@/hooks/useMarkets'
import { useStocks } from '@/hooks/useStocks'

export function Markets() {
  const { data: markets, isLoading } = useMarkets()
  const { data: stocks } = useStocks()
  const deleteMarket = useDeleteMarket()

  function stocksUsing(marketId: number): number {
    return stocks?.filter((s) => s.marketId === marketId).length ?? 0
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-text-primary">Markets</h1>
          <p className="text-sm text-text-secondary">
            Trading-hours profiles (timezone + open/close) that stocks are assigned to.
          </p>
        </div>
        <CreateMarketModal />
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : !markets?.length ? (
        <EmptyState
          title="No markets yet"
          description="Add a market (e.g. UK, US, India) before you can add a stock."
          action={<CreateMarketModal />}
        />
      ) : (
        <Card className="p-0 animate-fade-slide-in">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Timezone</TableHead>
                <TableHead>Opens</TableHead>
                <TableHead>Closes</TableHead>
                <TableHead>Weekdays only</TableHead>
                <TableHead>Stocks using it</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {markets.map((market) => (
                <TableRow key={market.id}>
                  <TableCell className="font-medium">{market.name}</TableCell>
                  <TableCell className="text-text-secondary">{market.timezone}</TableCell>
                  <TableCell className="tabular-nums">{market.openTime}</TableCell>
                  <TableCell className="tabular-nums">{market.closeTime}</TableCell>
                  <TableCell>
                    <Badge variant={market.weekdaysOnly ? 'accent' : 'neutral'}>
                      {market.weekdaysOnly ? 'Yes' : 'No'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-text-secondary">{stocksUsing(market.id)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <EditMarketModal market={market} />
                      <ConfirmDialog
                        trigger={
                          <Button variant="ghost" size="icon" aria-label={`Delete ${market.name}`}>
                            <Trash2 className="h-4 w-4 text-danger" />
                          </Button>
                        }
                        title={`Delete ${market.name}?`}
                        description="Stocks still assigned to this market must be reassigned first."
                        confirmLabel="Delete"
                        onConfirm={async () => {
                          try {
                            await deleteMarket.mutateAsync(market.id)
                            toast.success(`${market.name} removed`)
                          } catch {
                            toast.error(
                              `Could not delete ${market.name} — ${stocksUsing(market.id)} stock(s) are still assigned to it.`,
                            )
                            throw new Error('delete blocked')
                          }
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
