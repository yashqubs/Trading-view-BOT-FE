import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { ExecutionModeToggle } from '@/components/common/ExecutionModeToggle'
import { useStock, useUpdateStock } from '@/hooks/useStocks'
import { useTradingRules } from '@/hooks/useRules'
import { formatMoney } from '@/lib/format'
import type { ExecutionMode, StockMapping } from '@/types'

const EXECUTION_MODE_LABELS: Record<ExecutionMode, string> = {
  MARKET: 'Market price',
  SIGNAL_PRICE: 'Signal price',
}

interface FormSnapshot {
  tvTicker: string
  instrumentName: string
  enabled: boolean
  investmentAmount: string | null
  maxDailySpend: string
  executionMode: ExecutionMode | null
  maxSlippagePercent: string | null
}

function snapshotStock(stock: StockMapping): FormSnapshot {
  return {
    tvTicker: stock.tvTicker,
    instrumentName: stock.instrumentName,
    enabled: stock.enabled,
    investmentAmount: stock.investmentAmount != null ? String(stock.investmentAmount) : null,
    maxDailySpend: stock.maxDailySpend != null ? String(stock.maxDailySpend) : '',
    executionMode: stock.executionMode,
    maxSlippagePercent: stock.maxSlippagePercent != null ? String(stock.maxSlippagePercent) : null,
  }
}

function EditStockForm({ stock }: { stock: StockMapping }) {
  const navigate = useNavigate()
  const updateStock = useUpdateStock()
  const { data: rules } = useTradingRules()
  const [form, setForm] = useState<FormSnapshot>(() => snapshotStock(stock))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setForm(snapshotStock(stock))
  }, [stock])

  function set<K extends keyof FormSnapshot>(key: K, value: FormSnapshot[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    setError(null)
    const ticker = form.tvTicker.trim().toUpperCase()
    if (!ticker) {
      setError('Ticker cannot be empty.')
      return
    }
    if (!form.instrumentName.trim()) {
      setError('Instrument name cannot be empty.')
      return
    }
    if (form.investmentAmount !== null) {
      const amount = Number(form.investmentAmount)
      if (!amount || amount <= 0) {
        setError('Enter a valid investment amount.')
        return
      }
    }
    const dailySpend = form.maxDailySpend ? Number(form.maxDailySpend) : null
    const effectiveAmount = form.investmentAmount !== null ? Number(form.investmentAmount) : rules?.investmentAmount
    if (dailySpend != null && effectiveAmount != null && dailySpend <= effectiveAmount) {
      setError('Max daily spend must be higher than the investment per trade.')
      return
    }
    if (form.maxSlippagePercent !== null) {
      const slippage = Number(form.maxSlippagePercent)
      if (Number.isNaN(slippage) || slippage < 0 || slippage > 100) {
        setError('Max slippage must be between 0 and 100.')
        return
      }
    }
    try {
      await updateStock.mutateAsync({
        id: stock.id,
        input: {
          tvTicker: ticker,
          instrumentName: form.instrumentName.trim(),
          enabled: form.enabled,
          investmentAmount: form.investmentAmount !== null ? Number(form.investmentAmount) : null,
          maxDailySpend: dailySpend,
          executionMode: form.executionMode,
          maxSlippagePercent: form.maxSlippagePercent !== null ? Number(form.maxSlippagePercent) : null,
        },
      })
      toast.success(`${ticker} saved`)
      navigate(`/stocks/${ticker}`)
    } catch {
      setError('Could not save changes. That ticker may already be mapped to another stock.')
    }
  }

  return (
    <Card className="max-w-2xl animate-fade-slide-in">
      <CardHeader>
        <CardTitle>Trading conditions</CardTitle>
      </CardHeader>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="stock-ticker">TradingView ticker</Label>
            <Input
              id="stock-ticker"
              value={form.tvTicker}
              onChange={(e) => set('tvTicker', e.target.value.toUpperCase())}
              maxLength={20}
            />
            <p className="text-xs text-text-tertiary">Must exactly match the ticker your TradingView alert sends.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="stock-instrument-name">Instrument name</Label>
            <Input
              id="stock-instrument-name"
              value={form.instrumentName}
              onChange={(e) => set('instrumentName', e.target.value)}
            />
            <p className="text-xs text-text-tertiary">
              {stock.igEpic} · {stock.instrumentType} — to change the IG instrument itself, remove this stock and
              add it again via search.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
          <div>
            <Label htmlFor="stock-enabled">Trading enabled</Label>
            <p className="text-xs text-text-tertiary">
              Turn off to stop the bot trading {stock.tvTicker} — signals will be skipped.
            </p>
          </div>
          <Switch id="stock-enabled" checked={form.enabled} onCheckedChange={(v) => set('enabled', v)} />
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-border px-3 py-2.5">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="stock-investment-override">Override investment per trade for {stock.tvTicker}</Label>
              <p className="text-xs text-text-tertiary">
                {form.investmentAmount === null
                  ? `Off — using the global default (${rules ? formatMoney(rules.investmentAmount) : '…'}).`
                  : 'On — this stock ignores the global default.'}
              </p>
            </div>
            <Switch
              id="stock-investment-override"
              checked={form.investmentAmount !== null}
              onCheckedChange={(checked) =>
                set('investmentAmount', checked ? String(rules?.investmentAmount ?? 500) : null)
              }
            />
          </div>
          {form.investmentAmount !== null && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="stock-investment">Investment per trade (£)</Label>
              <Input
                id="stock-investment"
                type="number"
                min="0"
                step="0.01"
                value={form.investmentAmount}
                onChange={(e) => set('investmentAmount', e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="stock-max-daily">Max daily spend (£)</Label>
          <Input
            id="stock-max-daily"
            type="number"
            min="0"
            step="0.01"
            value={form.maxDailySpend}
            onChange={(e) => set('maxDailySpend', e.target.value)}
            placeholder="No limit"
          />
          <p className="text-xs text-text-tertiary">Must be higher than the investment per trade.</p>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-border px-3 py-2.5">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="stock-execution-override">Override fill price for {stock.tvTicker}</Label>
              <p className="text-xs text-text-tertiary">
                {form.executionMode === null
                  ? `Off — using the global default (${rules ? EXECUTION_MODE_LABELS[rules.executionMode] : '…'}).`
                  : 'On — this stock ignores the global default below.'}
              </p>
            </div>
            <Switch
              id="stock-execution-override"
              checked={form.executionMode !== null}
              onCheckedChange={(checked) => set('executionMode', checked ? (rules?.executionMode ?? 'MARKET') : null)}
            />
          </div>
          {form.executionMode !== null && (
            <ExecutionModeToggle value={form.executionMode} onChange={(mode) => set('executionMode', mode)} />
          )}
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-border px-3 py-2.5">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="stock-slippage-override">Override max slippage for {stock.tvTicker}</Label>
              <p className="text-xs text-text-tertiary">
                {form.maxSlippagePercent === null
                  ? `Off — using the global default (${rules ? rules.maxSlippagePercent : '…'}%). Only applies in Signal price mode.`
                  : 'On — this stock ignores the global default below.'}
              </p>
            </div>
            <Switch
              id="stock-slippage-override"
              checked={form.maxSlippagePercent !== null}
              onCheckedChange={(checked) =>
                set('maxSlippagePercent', checked ? String(rules?.maxSlippagePercent ?? 0) : null)
              }
            />
          </div>
          {form.maxSlippagePercent !== null && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="stock-max-slippage">Max slippage (%)</Label>
              <Input
                id="stock-max-slippage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.maxSlippagePercent}
                onChange={(e) => set('maxSlippagePercent', e.target.value)}
              />
            </div>
          )}
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => navigate(`/stocks/${stock.tvTicker}`)}>
            Cancel
          </Button>
          <Button type="button" disabled={updateStock.isPending} onClick={handleSave}>
            {updateStock.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>
    </Card>
  )
}

export function EditStock() {
  const { ticker = '' } = useParams<{ ticker: string }>()
  const stock = useStock(ticker)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to={`/stocks/${ticker}`}
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {ticker}
        </Link>
        <h1 className="mt-2 text-xl font-medium text-text-primary">Edit {ticker}</h1>
      </div>

      {stock.isLoading ? (
        <Skeleton className="h-96 max-w-2xl w-full" />
      ) : stock.data ? (
        <EditStockForm stock={stock.data} />
      ) : (
        <EmptyState
          title="No stock mapping found"
          description={`${ticker} isn't configured for trading — there's nothing to edit.`}
        />
      )}
    </div>
  )
}
