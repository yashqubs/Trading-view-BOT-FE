import { type FormEvent, useState } from 'react'
import { Plus } from 'lucide-react'
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
import { useCreateMarket } from '@/hooks/useMarkets'
import { COMMON_TIMEZONES } from '../timezones'

export function CreateMarketModal() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [timezone, setTimezone] = useState('')
  const [openTime, setOpenTime] = useState('09:00')
  const [closeTime, setCloseTime] = useState('17:00')
  const [weekdaysOnly, setWeekdaysOnly] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const createMarket = useCreateMarket()

  function reset() {
    setName('')
    setTimezone('')
    setOpenTime('09:00')
    setCloseTime('17:00')
    setWeekdaysOnly(true)
    setError(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Enter a name for this market.')
      return
    }
    if (!timezone.trim()) {
      setError('Enter an IANA timezone, e.g. Europe/London.')
      return
    }

    try {
      await createMarket.mutateAsync({ name: name.trim(), timezone: timezone.trim(), openTime, closeTime, weekdaysOnly })
      setOpen(false)
      reset()
    } catch {
      setError('Could not create this market. The name may already be in use.')
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
          Add market
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add market</DialogTitle>
          <DialogDescription>
            A trading-hours profile — e.g. "UK", "US", "India" — that stocks get assigned to.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="market-name">Name</Label>
            <Input id="market-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="market-timezone">Timezone</Label>
            <Input
              id="market-timezone"
              list="market-timezone-options"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="e.g. Europe/London"
            />
            <datalist id="market-timezone-options">
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz} />
              ))}
            </datalist>
            <p className="text-xs text-text-tertiary">Any IANA timezone name (e.g. Asia/Kolkata).</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="market-open">Opens</Label>
              <Input id="market-open" type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="market-close">Closes</Label>
              <Input id="market-close" type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <Label htmlFor="market-weekdays-only">Weekdays only</Label>
            <Switch id="market-weekdays-only" checked={weekdaysOnly} onCheckedChange={setWeekdaysOnly} />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMarket.isPending}>
              {createMarket.isPending ? 'Creating…' : 'Create market'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
