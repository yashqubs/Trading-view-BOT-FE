import { type FormEvent, useEffect, useState } from 'react'
import { useBlocker } from 'react-router-dom'
import { toast } from 'sonner'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { ExecutionModeToggle } from '@/components/common/ExecutionModeToggle'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useTradingRules, useUpdateTradingRules } from '@/hooks/useRules'
import type { ExecutionMode } from '@/types'

interface RulesFormSnapshot {
  botEnabled: boolean
  allowBuy: boolean
  allowSell: boolean
  investmentAmount: string
  dailyMaxTotalInvestment: string
  dailyMaxTradeCount: string
  maxConsecutiveFailures: string
  executionMode: ExecutionMode
  maxSlippagePercent: string
}

export function Conditions() {
  const { data: rules, isLoading } = useTradingRules()
  const updateRules = useUpdateTradingRules()

  const [botEnabled, setBotEnabled] = useState(true)
  const [allowBuy, setAllowBuy] = useState(true)
  const [allowSell, setAllowSell] = useState(true)
  const [investmentAmount, setInvestmentAmount] = useState('500')
  const [dailyMaxTotalInvestment, setDailyMaxTotalInvestment] = useState('')
  const [dailyMaxTradeCount, setDailyMaxTradeCount] = useState('')
  const [maxConsecutiveFailures, setMaxConsecutiveFailures] = useState('3')
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('MARKET')
  const [maxSlippagePercent, setMaxSlippagePercent] = useState('0')

  // The last-saved (or last-loaded) form values — comparing against this is
  // how we know there are unsaved changes, without re-deriving from `rules`
  // (which lags behind the form state by an extra render either way).
  const [baseline, setBaseline] = useState<RulesFormSnapshot | null>(null)

  useEffect(() => {
    if (!rules) return
    const snapshot: RulesFormSnapshot = {
      botEnabled: rules.botEnabled,
      allowBuy: rules.allowBuy,
      allowSell: rules.allowSell,
      investmentAmount: String(rules.investmentAmount),
      dailyMaxTotalInvestment: rules.dailyMaxTotalInvestment ? String(rules.dailyMaxTotalInvestment) : '',
      dailyMaxTradeCount: rules.dailyMaxTradeCount ? String(rules.dailyMaxTradeCount) : '',
      maxConsecutiveFailures: String(rules.maxConsecutiveFailures),
      executionMode: rules.executionMode,
      maxSlippagePercent: String(rules.maxSlippagePercent),
    }
    setBaseline(snapshot)
    setBotEnabled(snapshot.botEnabled)
    setAllowBuy(snapshot.allowBuy)
    setAllowSell(snapshot.allowSell)
    setInvestmentAmount(snapshot.investmentAmount)
    setDailyMaxTotalInvestment(snapshot.dailyMaxTotalInvestment)
    setDailyMaxTradeCount(snapshot.dailyMaxTradeCount)
    setMaxConsecutiveFailures(snapshot.maxConsecutiveFailures)
    setExecutionMode(snapshot.executionMode)
    setMaxSlippagePercent(snapshot.maxSlippagePercent)
  }, [rules])

  const isDirty =
    !!baseline &&
    (botEnabled !== baseline.botEnabled ||
      allowBuy !== baseline.allowBuy ||
      allowSell !== baseline.allowSell ||
      investmentAmount !== baseline.investmentAmount ||
      dailyMaxTotalInvestment !== baseline.dailyMaxTotalInvestment ||
      dailyMaxTradeCount !== baseline.dailyMaxTradeCount ||
      maxConsecutiveFailures !== baseline.maxConsecutiveFailures ||
      executionMode !== baseline.executionMode ||
      maxSlippagePercent !== baseline.maxSlippagePercent)

  // Block in-app navigation while there are unsaved changes.
  const blocker = useBlocker(({ currentLocation, nextLocation }) => isDirty && currentLocation.pathname !== nextLocation.pathname)

  // Block tab close / refresh / external navigation too.
  useEffect(() => {
    if (!isDirty) return
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const amount = Number(investmentAmount)
    if (!amount || amount <= 0) {
      toast.error('Enter a valid default investment amount.')
      return
    }
    const slippage = Number(maxSlippagePercent) || 0
    if (slippage < 0 || slippage > 100) {
      toast.error('Max slippage must be between 0 and 100.')
      return
    }
    try {
      const saved = await updateRules.mutateAsync({
        botEnabled,
        allowBuy,
        allowSell,
        investmentAmount: amount,
        dailyMaxTotalInvestment: dailyMaxTotalInvestment ? Number(dailyMaxTotalInvestment) : null,
        dailyMaxTradeCount: dailyMaxTradeCount ? Number(dailyMaxTradeCount) : null,
        maxConsecutiveFailures: Number(maxConsecutiveFailures) || 3,
        executionMode,
        maxSlippagePercent: slippage,
      })
      setBaseline({
        botEnabled: saved.botEnabled,
        allowBuy: saved.allowBuy,
        allowSell: saved.allowSell,
        investmentAmount: String(saved.investmentAmount),
        dailyMaxTotalInvestment: saved.dailyMaxTotalInvestment ? String(saved.dailyMaxTotalInvestment) : '',
        dailyMaxTradeCount: saved.dailyMaxTradeCount ? String(saved.dailyMaxTradeCount) : '',
        maxConsecutiveFailures: String(saved.maxConsecutiveFailures),
        executionMode: saved.executionMode,
        maxSlippagePercent: String(saved.maxSlippagePercent),
      })
      toast.success('Trading conditions saved')
    } catch {
      toast.error('Could not save trading conditions')
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-medium text-text-primary">Trading conditions</h1>
        <p className="text-sm text-text-secondary">
          Global rules checked before every signal.
        </p>
      </div>

      <Card className="animate-fade-slide-in">
        <CardHeader>
          <CardTitle>Master controls</CardTitle>
        </CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <div>
              <Label htmlFor="bot-enabled">Bot enabled</Label>
              <p className="text-xs text-text-tertiary">Master kill switch for all trading.</p>
            </div>
            <Switch id="bot-enabled" checked={botEnabled} onCheckedChange={setBotEnabled} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <Label htmlFor="allow-buy">Allow buy signals</Label>
            <Switch id="allow-buy" checked={allowBuy} onCheckedChange={setAllowBuy} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <Label htmlFor="allow-sell">Allow sell signals</Label>
            <Switch id="allow-sell" checked={allowSell} onCheckedChange={setAllowSell} />
          </div>
        </div>
      </Card>

      <Card className="animate-fade-slide-in">
        <CardHeader>
          <CardTitle>Investment</CardTitle>
        </CardHeader>
        <div className="flex flex-col gap-1.5 max-w-xs">
          <Label htmlFor="investment-amount">Default investment per trade (£)</Label>
          <Input
            id="investment-amount"
            type="number"
            min="0"
            step="0.01"
            value={investmentAmount}
            onChange={(e) => setInvestmentAmount(e.target.value)}
          />
          <p className="text-xs text-text-tertiary">
            Used for every stock unless it sets its own override on the Stocks page.
          </p>
        </div>
      </Card>

      <Card className="animate-fade-slide-in">
        <CardHeader>
          <CardTitle>Execution</CardTitle>
        </CardHeader>
        <div className="flex flex-col gap-3">
          <div>
            <Label>Default fill price</Label>
            <p className="mt-0.5 text-xs text-text-tertiary">
              How every trade fills unless a stock's own settings override it. Applies globally.
            </p>
          </div>
          <ExecutionModeToggle value={executionMode} onChange={setExecutionMode} />
          {executionMode === 'SIGNAL_PRICE' && (
            <>
              <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
                Signal price places a limit order — if the market has already moved past that exact price, the
                trade won't fill and is logged as failed instead of chasing the market.
              </p>
              <div className="flex flex-col gap-1.5 max-w-xs">
                <Label htmlFor="max-slippage">Max slippage (%)</Label>
                <Input
                  id="max-slippage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={maxSlippagePercent}
                  onChange={(e) => setMaxSlippagePercent(e.target.value)}
                />
                <p className="text-xs text-text-tertiary">
                  How far the fill price can move against the signal price before the trade is rejected instead
                  of filled. 0 = exact signal price only.
                </p>
              </div>
            </>
          )}
        </div>
      </Card>

      <Card className="animate-fade-slide-in">
        <CardHeader>
          <CardTitle>Daily limits</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="daily-max-investment">Daily max investment (£)</Label>
            <Input
              id="daily-max-investment"
              type="number"
              min="0"
              value={dailyMaxTotalInvestment}
              onChange={(e) => setDailyMaxTotalInvestment(e.target.value)}
              placeholder="No limit"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="daily-max-trades">Daily max trade count</Label>
            <Input
              id="daily-max-trades"
              type="number"
              min="0"
              value={dailyMaxTradeCount}
              onChange={(e) => setDailyMaxTradeCount(e.target.value)}
              placeholder="No limit"
            />
          </div>
        </div>
      </Card>

      <Card className="animate-fade-slide-in">
        <CardHeader>
          <CardTitle>Safety</CardTitle>
        </CardHeader>
        <div className="max-w-xs">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="max-failures">Max consecutive failures</Label>
            <Input
              id="max-failures"
              type="number"
              min="1"
              value={maxConsecutiveFailures}
              onChange={(e) => setMaxConsecutiveFailures(e.target.value)}
            />
            <p className="text-xs text-text-tertiary">
              Current streak: {rules?.consecutiveFailureCount ?? 0}
            </p>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-end gap-3">
        {isDirty && <p className="text-xs text-warning">You have unsaved changes.</p>}
        <Button type="submit" disabled={updateRules.isPending}>
          {updateRules.isPending ? 'Saving…' : 'Save changes'}
        </Button>
      </div>

      <Dialog open={blocker.state === 'blocked'} onOpenChange={(open) => !open && blocker.reset?.()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave without saving?</DialogTitle>
            <DialogDescription>
              You have unsaved changes to trading conditions. They will be lost if you leave this page now.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => blocker.reset?.()}>
              Stay on page
            </Button>
            <Button variant="destructive" onClick={() => blocker.proceed?.()}>
              Leave without saving
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  )
}
