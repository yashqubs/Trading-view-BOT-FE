import { type FormEvent, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Search } from 'lucide-react'
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
import { EmptyState } from '@/components/common/EmptyState'
import { useCreateStock, useIgMarketSearch } from '@/hooks/useStocks'
import { cn } from '@/lib/utils'
import type { IgMarketResult } from '@/types'

export function AddStockModal() {
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState('')
  const [debouncedTerm, setDebouncedTerm] = useState('')
  const [selected, setSelected] = useState<IgMarketResult | null>(null)
  const [investmentAmount, setInvestmentAmount] = useState('')
  const [maxDailySpend, setMaxDailySpend] = useState('')
  const [coolDownMinutes, setCoolDownMinutes] = useState('')
  const [maxOpenPositions, setMaxOpenPositions] = useState('1')
  const [error, setError] = useState<string | null>(null)

  const search = useIgMarketSearch(debouncedTerm)
  const createStock = useCreateStock()

  useEffect(() => {
    const t = setTimeout(() => setDebouncedTerm(term), 300)
    return () => clearTimeout(t)
  }, [term])

  function reset() {
    setTerm('')
    setDebouncedTerm('')
    setSelected(null)
    setInvestmentAmount('')
    setMaxDailySpend('')
    setCoolDownMinutes('')
    setMaxOpenPositions('1')
    setError(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!selected) {
      setError('Search and select an instrument first.')
      return
    }
    const amount = Number(investmentAmount)
    if (!amount || amount <= 0) {
      setError('Enter a valid investment amount.')
      return
    }

    try {
      await createStock.mutateAsync({
        tvTicker: selected.epic.includes('.') ? term.toUpperCase() : selected.epic,
        igEpic: selected.epic,
        instrumentName: selected.instrumentName,
        instrumentType: selected.instrumentType,
        investmentAmount: amount,
        maxDailySpend: maxDailySpend ? Number(maxDailySpend) : null,
        coolDownMinutes: coolDownMinutes ? Number(coolDownMinutes) : null,
        maxOpenPositions: Number(maxOpenPositions) || 1,
      })
      toast.success(`${selected.instrumentName} added`)
      setOpen(false)
      reset()
    } catch {
      setError('Could not add this stock. It may already be mapped.')
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
        <Button>
          <Plus className="h-4 w-4" />
          Add stock
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add stock</DialogTitle>
          <DialogDescription>Search IG markets to find the right instrument, then set its trading amount.</DialogDescription>
        </DialogHeader>

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
            <div className="max-h-64 overflow-y-auto">
              {search.isFetching && <p className="px-1 py-2 text-xs text-text-tertiary">Searching…</p>}
              {!search.isFetching && debouncedTerm.length > 1 && !search.data?.length && (
                <EmptyState title="No matches" description="Try a different ticker or instrument name." />
              )}
              <div className="flex flex-col gap-1">
                {search.data?.map((market) => (
                  <button
                    key={market.epic}
                    type="button"
                    onClick={() => setSelected(market)}
                    className={cn(
                      'flex flex-col rounded-lg border border-border px-3 py-2 text-left text-sm transition-colors hover:bg-surface-2',
                    )}
                  >
                    <span className="font-medium text-text-primary">{market.instrumentName}</span>
                    <span className="text-xs text-text-tertiary">
                      {market.epic} · {market.instrumentType} · {market.marketStatus}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="rounded-lg border border-border bg-surface-2 px-3 py-2">
              <p className="text-sm font-medium text-text-primary">{selected.instrumentName}</p>
              <p className="text-xs text-text-tertiary">{selected.epic}</p>
              <button
                type="button"
                className="mt-1 text-xs text-accent"
                onClick={() => setSelected(null)}
              >
                Change instrument
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="investment-amount">Investment amount (£)</Label>
              <Input
                id="investment-amount"
                type="number"
                min="0"
                step="0.01"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
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
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cool-down">Cool-down (minutes)</Label>
                <Input
                  id="cool-down"
                  type="number"
                  min="0"
                  value={coolDownMinutes}
                  onChange={(e) => setCoolDownMinutes(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="max-positions">Max open positions</Label>
              <Input
                id="max-positions"
                type="number"
                min="1"
                value={maxOpenPositions}
                onChange={(e) => setMaxOpenPositions(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setSelected(null)}>
                Back
              </Button>
              <Button type="submit" disabled={createStock.isPending}>
                {createStock.isPending ? 'Adding…' : 'Add stock'}
              </Button>
            </DialogFooter>
          </form>
        )}

        {error && !selected && <p className="text-sm text-danger">{error}</p>}
      </DialogContent>
    </Dialog>
  )
}
