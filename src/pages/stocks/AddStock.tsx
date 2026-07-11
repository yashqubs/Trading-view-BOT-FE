import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Search } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/common/EmptyState'
import { ExecutionModeToggle } from '@/components/common/ExecutionModeToggle'
import { useCreateStock, useIgMarketSearch } from '@/hooks/useStocks'
import { useTradingRules } from '@/hooks/useRules'
import { formatMoney, formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ExecutionMode, IgMarketResult } from '@/types'

const EXECUTION_MODE_LABELS: Record<ExecutionMode, string> = {
  MARKET: 'Market price',
  SIGNAL_PRICE: 'Signal price',
}

export function AddStock() {
  const navigate = useNavigate()
  const [term, setTerm] = useState('')
  const [debouncedTerm, setDebouncedTerm] = useState('')
  const [selected, setSelected] = useState<IgMarketResult | null>(null)
  const [tvTicker, setTvTicker] = useState('')
  const [investmentAmount, setInvestmentAmount] = useState<string | null>(null)
  const [maxDailySpend, setMaxDailySpend] = useState('')
  const [executionMode, setExecutionMode] = useState<ExecutionMode | null>(null)
  const [maxSlippagePercent, setMaxSlippagePercent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const search = useIgMarketSearch(debouncedTerm)
  const createStock = useCreateStock()
  const { data: rules } = useTradingRules()

  useEffect(() => {
    const t = setTimeout(() => setDebouncedTerm(term), 300)
    return () => clearTimeout(t)
  }, [term])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!selected) {
      setError('Search and select an instrument first.')
      return
    }
    const ticker = tvTicker.trim().toUpperCase()
    if (!ticker) {
      setError('Enter the exact ticker your TradingView alert sends.')
      return
    }
    if (ticker.length > 20) {
      setError('Ticker must be 20 characters or fewer.')
      return
    }
    if (investmentAmount !== null) {
      const amount = Number(investmentAmount)
      if (!amount || amount <= 0) {
        setError('Enter a valid investment amount.')
        return
      }
    }
    const dailySpend = maxDailySpend ? Number(maxDailySpend) : null
    const effectiveAmount = investmentAmount !== null ? Number(investmentAmount) : rules?.investmentAmount
    if (dailySpend != null && effectiveAmount != null && dailySpend <= effectiveAmount) {
      setError('Max daily spend must be higher than the investment per trade.')
      return
    }
    if (maxSlippagePercent !== null) {
      const slippage = Number(maxSlippagePercent)
      if (Number.isNaN(slippage) || slippage < 0 || slippage > 100) {
        setError('Max slippage must be between 0 and 100.')
        return
      }
    }

    try {
      await createStock.mutateAsync({
        tvTicker: ticker,
        igEpic: selected.epic,
        instrumentName: selected.instrumentName,
        instrumentType: selected.instrumentType,
        ...(investmentAmount !== null ? { investmentAmount: Number(investmentAmount) } : {}),
        maxDailySpend: dailySpend,
        ...(executionMode ? { executionMode } : {}),
        ...(maxSlippagePercent !== null ? { maxSlippagePercent: Number(maxSlippagePercent) } : {}),
      })
      toast.success(`${selected.instrumentName} added`)
      navigate('/stocks')
    } catch {
      setError('Could not add this stock. It may already be mapped.')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to="/stocks"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Stocks
        </Link>
        <h1 className="mt-2 text-xl font-medium text-text-primary">Add stock</h1>
        <p className="text-sm text-text-secondary">
          Search IG markets to find the right instrument, then set its trading amount.
        </p>
      </div>

      <Card className="max-w-3xl animate-fade-slide-in">
        {!selected ? (
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
              <Input
                placeholder="Search ticker, e.g. AAPL"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1">
              {search.isFetching && <p className="px-1 py-2 text-xs text-text-tertiary">Searching…</p>}
              {!search.isFetching && debouncedTerm.length > 1 && !search.data?.length && (
                <EmptyState title="No matches" description="Try a different ticker or instrument name." />
              )}
              {search.data?.map((market) => (
                <button
                  key={market.epic}
                  type="button"
                  onClick={() => {
                    setSelected(market)
                    setTvTicker(market.epic.includes('.') ? term.toUpperCase() : market.epic)
                  }}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface-2',
                  )}
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-text-primary">{market.instrumentName}</span>
                    <span className="text-xs text-text-tertiary">
                      {market.epic} · {market.instrumentType}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="tabular-nums text-text-primary">
                      {market.offer != null ? formatPrice(market.offer) : '—'}
                    </span>
                    <span className="text-xs text-text-tertiary">
                      bid {market.bid != null ? formatPrice(market.bid) : '—'}
                    </span>
                    <Badge
                      variant={market.marketStatus === 'TRADEABLE' ? 'success' : 'neutral'}
                      className="mt-1"
                    >
                      {market.marketStatus}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-text-primary">{selected.instrumentName}</p>
                <p className="text-xs text-text-tertiary">
                  {selected.epic} · offer {selected.offer != null ? formatPrice(selected.offer) : '—'} · bid{' '}
                  {selected.bid != null ? formatPrice(selected.bid) : '—'}
                </p>
              </div>
              <button type="button" className="text-xs text-accent" onClick={() => setSelected(null)}>
                Change instrument
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tv-ticker">TradingView ticker</Label>
              <Input
                id="tv-ticker"
                value={tvTicker}
                onChange={(e) => setTvTicker(e.target.value.toUpperCase())}
                maxLength={20}
                autoFocus
                className="max-w-sm"
              />
              <p className="text-xs text-text-tertiary">
                Must exactly match the ticker your TradingView alert sends — not the search term above.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2 rounded-lg border border-border px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="add-investment-override">Override investment per trade</Label>
                    <p className="text-xs text-text-tertiary">
                      {investmentAmount === null
                        ? `Off — will use the global default (${rules ? formatMoney(rules.investmentAmount) : '…'}).`
                        : 'On — this stock will ignore the global default.'}
                    </p>
                  </div>
                  <Switch
                    id="add-investment-override"
                    checked={investmentAmount !== null}
                    onCheckedChange={(checked) =>
                      setInvestmentAmount(checked ? String(rules?.investmentAmount ?? 500) : null)
                    }
                  />
                </div>
                {investmentAmount !== null && (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="investment-amount">Investment per trade (£)</Label>
                    <Input
                      id="investment-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={investmentAmount}
                      onChange={(e) => setInvestmentAmount(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="max-daily-spend">Max daily spend (£)</Label>
                <Input
                  id="max-daily-spend"
                  type="number"
                  min="0"
                  step="0.01"
                  value={maxDailySpend}
                  onChange={(e) => setMaxDailySpend(e.target.value)}
                  placeholder="Optional"
                />
                <p className="text-xs text-text-tertiary">Must be higher than the investment per trade.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2 rounded-lg border border-border px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="add-execution-override">Override fill price</Label>
                    <p className="text-xs text-text-tertiary">
                      {executionMode === null
                        ? `Off — will use the global default (${rules ? EXECUTION_MODE_LABELS[rules.executionMode] : '…'}).`
                        : 'On — this stock will ignore the global default.'}
                    </p>
                  </div>
                  <Switch
                    id="add-execution-override"
                    checked={executionMode !== null}
                    onCheckedChange={(checked) => setExecutionMode(checked ? (rules?.executionMode ?? 'MARKET') : null)}
                  />
                </div>
                {executionMode !== null && (
                  <ExecutionModeToggle value={executionMode} onChange={setExecutionMode} stacked />
                )}
              </div>

              <div className="flex flex-col gap-2 rounded-lg border border-border px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="add-slippage-override">Override max slippage</Label>
                    <p className="text-xs text-text-tertiary">
                      {maxSlippagePercent === null
                        ? `Off — will use the global default (${rules ? rules.maxSlippagePercent : '…'}%). Only applies in Signal price mode.`
                        : 'On — this stock will ignore the global default.'}
                    </p>
                  </div>
                  <Switch
                    id="add-slippage-override"
                    checked={maxSlippagePercent !== null}
                    onCheckedChange={(checked) =>
                      setMaxSlippagePercent(checked ? String(rules?.maxSlippagePercent ?? 0) : null)
                    }
                  />
                </div>
                {maxSlippagePercent !== null && (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="add-max-slippage">Max slippage (%)</Label>
                    <Input
                      id="add-max-slippage"
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
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setSelected(null)}>
                Back
              </Button>
              <Button type="submit" disabled={createStock.isPending}>
                {createStock.isPending ? 'Adding…' : 'Add stock'}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}
