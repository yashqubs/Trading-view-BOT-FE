import { type FormEvent, useState } from 'react'
import { FlaskConical } from 'lucide-react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { StatusPill } from '@/components/common/StatusPill'
import { ExecutionModeToggle } from '@/components/common/ExecutionModeToggle'
import { useSendTestSignal } from '@/hooks/useTestSignal'
import { useTradingRules } from '@/hooks/useRules'
import { formatMoney, formatPrice, formatQuantity } from '@/lib/format'
import { explainTradeError } from '@/lib/tradeError'
import type { ExecutionMode, StockMapping, TradeDirection, TradeLog } from '@/types'

const EXECUTION_MODE_LABELS: Record<ExecutionMode, string> = {
  MARKET: 'Market price',
  SIGNAL_PRICE: 'Signal price',
}

export function SendTestSignalModal({ stock }: { stock: StockMapping }) {
  const [open, setOpen] = useState(false)
  const [direction, setDirection] = useState<TradeDirection>('BUY')
  const [price, setPrice] = useState('')
  const [investmentAmount, setInvestmentAmount] = useState('')
  const [executionMode, setExecutionMode] = useState<ExecutionMode | null>(null)
  const [maxSlippagePercent, setMaxSlippagePercent] = useState<string | null>(null)
  const [result, setResult] = useState<TradeLog | null>(null)
  const [error, setError] = useState<string | null>(null)
  const sendTestSignal = useSendTestSignal()
  const { data: rules } = useTradingRules()

  const resolvedDefault = stock.investmentAmount ?? rules?.investmentAmount
  const resolvedExecutionMode = stock.executionMode ?? rules?.executionMode
  const resolvedMaxSlippagePercent = stock.maxSlippagePercent ?? rules?.maxSlippagePercent

  function reset() {
    setDirection('BUY')
    setPrice('')
    setInvestmentAmount('')
    setExecutionMode(null)
    setMaxSlippagePercent(null)
    setResult(null)
    setError(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const signalPrice = Number(price)
    if (!signalPrice || signalPrice <= 0) {
      setError('Enter a valid signal price.')
      return
    }
    let amount: number | undefined
    if (investmentAmount !== '') {
      amount = Number(investmentAmount)
      if (!amount || amount <= 0) {
        setError('Enter a valid investment amount, or leave it blank to use the configured default.')
        return
      }
    }
    let slippage: number | undefined
    if (maxSlippagePercent !== null) {
      slippage = Number(maxSlippagePercent)
      if (Number.isNaN(slippage) || slippage < 0 || slippage > 100) {
        setError('Max slippage must be between 0 and 100.')
        return
      }
    }

    try {
      const trade = await sendTestSignal.mutateAsync({
        tvTicker: stock.tvTicker,
        direction,
        price: signalPrice,
        ...(amount !== undefined ? { investmentAmount: amount } : {}),
        ...(executionMode !== null ? { executionMode } : {}),
        ...(slippage !== undefined ? { maxSlippagePercent: slippage } : {}),
      })
      setResult(trade)
    } catch {
      setError('Could not send the test signal. Test signals may be disabled on this environment.')
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Send test signal for ${stock.tvTicker}`}>
          <FlaskConical className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        {!result ? (
          <>
            <DialogHeader>
              <DialogTitle>Send test signal — {stock.tvTicker}</DialogTitle>
              <DialogDescription>
                Runs the real condition pipeline immediately, without waiting for TradingView. This can place a
                real IG order if the condition checks pass — only use this against an IG demo account.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="test-signal-direction">Direction</Label>
                <Select value={direction} onValueChange={(v) => setDirection(v as TradeDirection)}>
                  <SelectTrigger id="test-signal-direction">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BUY">Buy</SelectItem>
                    <SelectItem value="SELL">Sell</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="test-signal-price">Signal price</Label>
                <Input
                  id="test-signal-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="test-signal-investment">Investment per trade (£)</Label>
                <Input
                  id="test-signal-investment"
                  type="number"
                  min="0"
                  step="0.01"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  placeholder={resolvedDefault != null ? `Default: ${formatMoney(resolvedDefault)}` : 'Optional'}
                />
                <p className="text-xs text-text-tertiary">
                  Leave blank to use {stock.tvTicker}'s configured amount — this only affects this one test, it
                  doesn't change the stock's real setting.
                </p>
              </div>
              <div className="flex flex-col gap-2 rounded-lg border border-border px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="test-signal-execution-override">Override fill price</Label>
                    <p className="text-xs text-text-tertiary">
                      {executionMode === null
                        ? `Off — will use the configured mode (${resolvedExecutionMode ? EXECUTION_MODE_LABELS[resolvedExecutionMode] : '…'}).`
                        : 'On — this test only, no change to the stock.'}
                    </p>
                  </div>
                  <Switch
                    id="test-signal-execution-override"
                    checked={executionMode !== null}
                    onCheckedChange={(checked) =>
                      setExecutionMode(checked ? (resolvedExecutionMode ?? 'MARKET') : null)
                    }
                  />
                </div>
                {executionMode !== null && (
                  <ExecutionModeToggle value={executionMode} onChange={setExecutionMode} stacked />
                )}
              </div>
              <div className="flex flex-col gap-2 rounded-lg border border-border px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="test-signal-slippage-override">Override max slippage</Label>
                    <p className="text-xs text-text-tertiary">
                      {maxSlippagePercent === null
                        ? `Off — will use the configured tolerance (${resolvedMaxSlippagePercent ?? '…'}%). Only applies in Signal price mode.`
                        : 'On — this test only, no change to the stock.'}
                    </p>
                  </div>
                  <Switch
                    id="test-signal-slippage-override"
                    checked={maxSlippagePercent !== null}
                    onCheckedChange={(checked) =>
                      setMaxSlippagePercent(checked ? String(resolvedMaxSlippagePercent ?? 0) : null)
                    }
                  />
                </div>
                {maxSlippagePercent !== null && (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="test-signal-max-slippage">Max slippage (%)</Label>
                    <Input
                      id="test-signal-max-slippage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={maxSlippagePercent}
                      onChange={(e) => setMaxSlippagePercent(e.target.value)}
                    />
                  </div>
                )}
              </div>
              {error && <p className="text-sm text-danger">{error}</p>}
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={sendTestSignal.isPending}>
                  {sendTestSignal.isPending ? 'Sending…' : 'Send signal'}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Result</DialogTitle>
              <DialogDescription>
                {result.tvTicker} · {result.direction} @ {formatPrice(result.signalPrice)}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface-2 px-4 py-3">
              <StatusPill status={result.status} />
              {result.quantity != null && (
                <p className="text-sm text-text-secondary">Quantity: {formatQuantity(result.quantity)}</p>
              )}
              {result.executedPrice != null && (
                <p className="text-sm text-text-secondary">
                  Filled at: <span className="font-medium text-text-primary">{formatPrice(result.executedPrice)}</span>
                  {result.executedPrice !== result.signalPrice && (
                    <span className="text-text-tertiary"> (signal was {formatPrice(result.signalPrice)})</span>
                  )}
                </p>
              )}
              {result.errorMessage && (
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-danger">
                    {explainTradeError(result.errorMessage, result.direction) ?? result.errorMessage}
                  </p>
                  {explainTradeError(result.errorMessage, result.direction) && (
                    <p className="font-mono text-xs text-text-tertiary">{result.errorMessage}</p>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={reset}>
                Send another
              </Button>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
