import { type FormEvent, useState } from 'react'
import { toast } from 'sonner'
import { Pencil } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ExecutionModeToggle } from '@/components/common/ExecutionModeToggle'
import { useUpdateStock } from '@/hooks/useStocks'
import { useTradingRules } from '@/hooks/useRules'
import type { ExecutionMode, StockMapping } from '@/types'

const EXECUTION_MODE_LABELS: Record<ExecutionMode, string> = {
  MARKET: 'Market price',
  SIGNAL_PRICE: 'Signal price',
}

export function EditStockModal({ stock }: { stock: StockMapping }) {
  const [open, setOpen] = useState(false)
  const [investmentAmount, setInvestmentAmount] = useState(String(stock.investmentAmount))
  const [maxDailySpend, setMaxDailySpend] = useState(stock.maxDailySpend ? String(stock.maxDailySpend) : '')
  const [coolDownMinutes, setCoolDownMinutes] = useState(stock.coolDownMinutes ? String(stock.coolDownMinutes) : '')
  const [maxOpenPositions, setMaxOpenPositions] = useState(String(stock.maxOpenPositions))
  const [enabled, setEnabled] = useState(stock.enabled)
  const [executionMode, setExecutionMode] = useState<ExecutionMode | null>(stock.executionMode)
  const [error, setError] = useState<string | null>(null)

  const updateStock = useUpdateStock()
  const { data: rules } = useTradingRules()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const amount = Number(investmentAmount)
    if (!amount || amount <= 0) {
      setError('Enter a valid investment amount.')
      return
    }

    try {
      await updateStock.mutateAsync({
        id: stock.id,
        input: {
          investmentAmount: amount,
          maxDailySpend: maxDailySpend ? Number(maxDailySpend) : null,
          coolDownMinutes: coolDownMinutes ? Number(coolDownMinutes) : null,
          maxOpenPositions: Number(maxOpenPositions) || 1,
          enabled,
          executionMode,
        },
      })
      toast.success(`${stock.tvTicker} updated`)
      setOpen(false)
    } catch {
      setError('Could not save changes.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Edit ${stock.tvTicker}`} onClick={(e) => e.stopPropagation()}>
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Edit {stock.tvTicker}</DialogTitle>
          <DialogDescription>{stock.instrumentName}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
            <Label htmlFor="stock-enabled">Enabled</Label>
            <Switch id="stock-enabled" checked={enabled} onCheckedChange={setEnabled} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-investment-amount">Investment amount (£)</Label>
            <Input
              id="edit-investment-amount"
              type="number"
              min="0"
              step="0.01"
              value={investmentAmount}
              onChange={(e) => setInvestmentAmount(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-max-daily-spend">Max daily spend (£)</Label>
              <Input
                id="edit-max-daily-spend"
                type="number"
                min="0"
                step="0.01"
                value={maxDailySpend}
                onChange={(e) => setMaxDailySpend(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-cool-down">Cool-down (minutes)</Label>
              <Input
                id="edit-cool-down"
                type="number"
                min="0"
                value={coolDownMinutes}
                onChange={(e) => setCoolDownMinutes(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-max-positions">Max open positions</Label>
            <Input
              id="edit-max-positions"
              type="number"
              min="1"
              value={maxOpenPositions}
              onChange={(e) => setMaxOpenPositions(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2 rounded-lg border border-border px-3 py-2.5">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="edit-execution-override">Override fill price</Label>
                <p className="text-xs text-text-tertiary">
                  {executionMode === null
                    ? `Using global default (${rules ? EXECUTION_MODE_LABELS[rules.executionMode] : '…'}).`
                    : 'Ignoring the global default for this stock.'}
                </p>
              </div>
              <Switch
                id="edit-execution-override"
                checked={executionMode !== null}
                onCheckedChange={(checked) => setExecutionMode(checked ? (rules?.executionMode ?? 'MARKET') : null)}
              />
            </div>
            {executionMode !== null && (
              <ExecutionModeToggle value={executionMode} onChange={setExecutionMode} stacked />
            )}
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateStock.isPending}>
              {updateStock.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
