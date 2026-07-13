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
import { StatusPill } from '@/components/common/StatusPill'
import { useSendTestSignal } from '@/hooks/useTestSignal'
import { formatPrice, formatQuantity } from '@/lib/format'
import type { StockMapping, TradeDirection, TradeLog } from '@/types'

export function SendTestSignalModal({ stock }: { stock: StockMapping }) {
  const [open, setOpen] = useState(false)
  const [direction, setDirection] = useState<TradeDirection>('BUY')
  const [price, setPrice] = useState('')
  const [result, setResult] = useState<TradeLog | null>(null)
  const [error, setError] = useState<string | null>(null)
  const sendTestSignal = useSendTestSignal()

  function reset() {
    setDirection('BUY')
    setPrice('')
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

    try {
      const trade = await sendTestSignal.mutateAsync({ tvTicker: stock.tvTicker, direction, price: signalPrice })
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
              {result.errorMessage && (
                <p className="text-sm text-danger">{result.errorMessage}</p>
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
