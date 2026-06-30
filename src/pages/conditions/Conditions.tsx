import { type FormEvent, useEffect, useState } from 'react'
import { useBlocker } from 'react-router-dom'
import { toast } from 'sonner'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useTradingRules, useUpdateTradingRules } from '@/hooks/useRules'
import { useAuth } from '@/context/AuthContext'

interface RulesFormSnapshot {
  botEnabled: boolean
  allowBuy: boolean
  allowSell: boolean
  dailyMaxTotalInvestment: string
  dailyMaxTradeCount: string
  maxOpenPositionsGlobal: string
  maxConsecutiveFailures: string
  tradeStartTimeUtc: string
  tradeEndTimeUtc: string
  tradeWeekdaysOnly: boolean
}

export function Conditions() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const { data: rules, isLoading } = useTradingRules()
  const updateRules = useUpdateTradingRules()

  const [botEnabled, setBotEnabled] = useState(true)
  const [allowBuy, setAllowBuy] = useState(true)
  const [allowSell, setAllowSell] = useState(true)
  const [dailyMaxTotalInvestment, setDailyMaxTotalInvestment] = useState('')
  const [dailyMaxTradeCount, setDailyMaxTradeCount] = useState('')
  const [maxOpenPositionsGlobal, setMaxOpenPositionsGlobal] = useState('')
  const [maxConsecutiveFailures, setMaxConsecutiveFailures] = useState('3')
  const [tradeStartTimeUtc, setTradeStartTimeUtc] = useState('14:30')
  const [tradeEndTimeUtc, setTradeEndTimeUtc] = useState('21:00')
  const [tradeWeekdaysOnly, setTradeWeekdaysOnly] = useState(true)

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
      dailyMaxTotalInvestment: rules.dailyMaxTotalInvestment ? String(rules.dailyMaxTotalInvestment) : '',
      dailyMaxTradeCount: rules.dailyMaxTradeCount ? String(rules.dailyMaxTradeCount) : '',
      maxOpenPositionsGlobal: rules.maxOpenPositionsGlobal ? String(rules.maxOpenPositionsGlobal) : '',
      maxConsecutiveFailures: String(rules.maxConsecutiveFailures),
      tradeStartTimeUtc: rules.tradeStartTimeUtc,
      tradeEndTimeUtc: rules.tradeEndTimeUtc,
      tradeWeekdaysOnly: rules.tradeWeekdaysOnly,
    }
    setBaseline(snapshot)
    setBotEnabled(snapshot.botEnabled)
    setAllowBuy(snapshot.allowBuy)
    setAllowSell(snapshot.allowSell)
    setDailyMaxTotalInvestment(snapshot.dailyMaxTotalInvestment)
    setDailyMaxTradeCount(snapshot.dailyMaxTradeCount)
    setMaxOpenPositionsGlobal(snapshot.maxOpenPositionsGlobal)
    setMaxConsecutiveFailures(snapshot.maxConsecutiveFailures)
    setTradeStartTimeUtc(snapshot.tradeStartTimeUtc)
    setTradeEndTimeUtc(snapshot.tradeEndTimeUtc)
    setTradeWeekdaysOnly(snapshot.tradeWeekdaysOnly)
  }, [rules])

  const isDirty =
    !!baseline &&
    (botEnabled !== baseline.botEnabled ||
      allowBuy !== baseline.allowBuy ||
      allowSell !== baseline.allowSell ||
      dailyMaxTotalInvestment !== baseline.dailyMaxTotalInvestment ||
      dailyMaxTradeCount !== baseline.dailyMaxTradeCount ||
      maxOpenPositionsGlobal !== baseline.maxOpenPositionsGlobal ||
      maxConsecutiveFailures !== baseline.maxConsecutiveFailures ||
      tradeStartTimeUtc !== baseline.tradeStartTimeUtc ||
      tradeEndTimeUtc !== baseline.tradeEndTimeUtc ||
      tradeWeekdaysOnly !== baseline.tradeWeekdaysOnly)

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
    try {
      const saved = await updateRules.mutateAsync({
        botEnabled,
        allowBuy,
        allowSell,
        dailyMaxTotalInvestment: dailyMaxTotalInvestment ? Number(dailyMaxTotalInvestment) : null,
        dailyMaxTradeCount: dailyMaxTradeCount ? Number(dailyMaxTradeCount) : null,
        maxOpenPositionsGlobal: maxOpenPositionsGlobal ? Number(maxOpenPositionsGlobal) : null,
        maxConsecutiveFailures: Number(maxConsecutiveFailures) || 3,
        tradeStartTimeUtc,
        tradeEndTimeUtc,
        tradeWeekdaysOnly,
      })
      setBaseline({
        botEnabled: saved.botEnabled,
        allowBuy: saved.allowBuy,
        allowSell: saved.allowSell,
        dailyMaxTotalInvestment: saved.dailyMaxTotalInvestment ? String(saved.dailyMaxTotalInvestment) : '',
        dailyMaxTradeCount: saved.dailyMaxTradeCount ? String(saved.dailyMaxTradeCount) : '',
        maxOpenPositionsGlobal: saved.maxOpenPositionsGlobal ? String(saved.maxOpenPositionsGlobal) : '',
        maxConsecutiveFailures: String(saved.maxConsecutiveFailures),
        tradeStartTimeUtc: saved.tradeStartTimeUtc,
        tradeEndTimeUtc: saved.tradeEndTimeUtc,
        tradeWeekdaysOnly: saved.tradeWeekdaysOnly,
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
          Global rules checked before every signal. {!isAdmin && 'Read-only for your role.'}
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
            <Switch id="bot-enabled" checked={botEnabled} onCheckedChange={setBotEnabled} disabled={!isAdmin} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <Label htmlFor="allow-buy">Allow buy signals</Label>
            <Switch id="allow-buy" checked={allowBuy} onCheckedChange={setAllowBuy} disabled={!isAdmin} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <Label htmlFor="allow-sell">Allow sell signals</Label>
            <Switch id="allow-sell" checked={allowSell} onCheckedChange={setAllowSell} disabled={!isAdmin} />
          </div>
        </div>
      </Card>

      <Card className="animate-fade-slide-in">
        <CardHeader>
          <CardTitle>Daily limits</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="daily-max-investment">Daily max investment (£)</Label>
            <Input
              id="daily-max-investment"
              type="number"
              min="0"
              value={dailyMaxTotalInvestment}
              onChange={(e) => setDailyMaxTotalInvestment(e.target.value)}
              disabled={!isAdmin}
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
              disabled={!isAdmin}
              placeholder="No limit"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="max-positions-global">Global max open positions</Label>
            <Input
              id="max-positions-global"
              type="number"
              min="0"
              value={maxOpenPositionsGlobal}
              onChange={(e) => setMaxOpenPositionsGlobal(e.target.value)}
              disabled={!isAdmin}
              placeholder="No limit"
            />
          </div>
        </div>
      </Card>

      <Card className="animate-fade-slide-in">
        <CardHeader>
          <CardTitle>Safety &amp; schedule</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="max-failures">Max consecutive failures</Label>
            <Input
              id="max-failures"
              type="number"
              min="1"
              value={maxConsecutiveFailures}
              onChange={(e) => setMaxConsecutiveFailures(e.target.value)}
              disabled={!isAdmin}
            />
            <p className="text-xs text-text-tertiary">
              Current streak: {rules?.consecutiveFailureCount ?? 0}
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="trade-start">Trading hours start (UTC)</Label>
            <Input
              id="trade-start"
              type="time"
              value={tradeStartTimeUtc}
              onChange={(e) => setTradeStartTimeUtc(e.target.value)}
              disabled={!isAdmin}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="trade-end">Trading hours end (UTC)</Label>
            <Input
              id="trade-end"
              type="time"
              value={tradeEndTimeUtc}
              onChange={(e) => setTradeEndTimeUtc(e.target.value)}
              disabled={!isAdmin}
            />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
          <Label htmlFor="weekdays-only">Weekdays only</Label>
          <Switch
            id="weekdays-only"
            checked={tradeWeekdaysOnly}
            onCheckedChange={setTradeWeekdaysOnly}
            disabled={!isAdmin}
          />
        </div>
      </Card>

      {isAdmin && (
        <div className="flex items-center justify-end gap-3">
          {isDirty && <p className="text-xs text-warning">You have unsaved changes.</p>}
          <Button type="submit" disabled={updateRules.isPending}>
            {updateRules.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      )}

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
