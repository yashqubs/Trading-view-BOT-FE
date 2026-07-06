import { type FormEvent, useState } from 'react'
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
import { useUpdateMarket } from '@/hooks/useMarkets'
import { COMMON_TIMEZONES } from '../timezones'
import type { Market } from '@/types'

export function EditMarketModal({ market }: { market: Market }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(market.name)
  const [timezone, setTimezone] = useState(market.timezone)
  const [openTime, setOpenTime] = useState(market.openTime)
  const [closeTime, setCloseTime] = useState(market.closeTime)
  const [weekdaysOnly, setWeekdaysOnly] = useState(market.weekdaysOnly)
  const [error, setError] = useState<string | null>(null)

  const updateMarket = useUpdateMarket()

  function resetToCurrent() {
    setName(market.name)
    setTimezone(market.timezone)
    setOpenTime(market.openTime)
    setCloseTime(market.closeTime)
    setWeekdaysOnly(market.weekdaysOnly)
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
      await updateMarket.mutateAsync({
        id: market.id,
        input: { name: name.trim(), timezone: timezone.trim(), openTime, closeTime, weekdaysOnly },
      })
      setOpen(false)
    } catch {
      setError('Could not save changes. That name may already be in use.')
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) resetToCurrent()
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Edit ${market.name}`}>
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit {market.name}</DialogTitle>
          <DialogDescription>Every stock assigned to this market uses these hours.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-market-name">Name</Label>
            <Input id="edit-market-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-market-timezone">Timezone</Label>
            <Input
              id="edit-market-timezone"
              list="edit-market-timezone-options"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            />
            <datalist id="edit-market-timezone-options">
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz} />
              ))}
            </datalist>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-market-open">Opens</Label>
              <Input id="edit-market-open" type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-market-close">Closes</Label>
              <Input
                id="edit-market-close"
                type="time"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <Label htmlFor="edit-market-weekdays-only">Weekdays only</Label>
            <Switch id="edit-market-weekdays-only" checked={weekdaysOnly} onCheckedChange={setWeekdaysOnly} />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMarket.isPending}>
              {updateMarket.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
