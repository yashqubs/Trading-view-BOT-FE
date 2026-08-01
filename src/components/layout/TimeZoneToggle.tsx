import { useEffect, useState } from 'react'
import { Check, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useTimezone } from '@/context/TimezoneContext'
import {
  TIME_ZONE_IDS,
  TIME_ZONES,
  formatOffsetLabel,
  timeZoneAbbreviation,
  timeZoneClock,
  timeZoneOffsetFromLocal,
} from '@/lib/timezone'
import { cn } from '@/lib/utils'

/**
 * A minute-granularity clock. Ticks on the next whole minute rather than
 * every 60s from mount, so all three clocks in the list roll over together
 * and none of them sits a beat behind the others.
 */
function useMinuteTick(active: boolean) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    if (!active) return
    setNow(new Date())
    let timeout: ReturnType<typeof setTimeout>
    let interval: ReturnType<typeof setInterval>

    const msToNextMinute = 60_000 - (Date.now() % 60_000)
    timeout = setTimeout(() => {
      setNow(new Date())
      interval = setInterval(() => setNow(new Date()), 60_000)
    }, msToNextMinute)

    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [active])

  return now
}

export function TimeZoneToggle() {
  const { timeZone, zone, setTimeZone } = useTimezone()
  const [open, setOpen] = useState(false)
  // The trigger clock runs always; the list only needs ticking while visible.
  const now = useMinuteTick(true)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-1.5 px-2 sm:px-2.5"
          aria-label={`Display timezone: ${zone.label}. Change`}
        >
          <Globe className="h-4 w-4 text-text-tertiary" />
          <span className="hidden text-xs font-medium tabular-nums text-text-secondary sm:inline">
            {timeZoneClock(timeZone, now)}
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-accent">
            {zone.label}
          </span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[286px] p-0">
        <div className="border-b border-border px-3.5 py-3">
          <p className="text-xs font-semibold text-text-primary">Display timezone</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-text-tertiary">
            Applies to every date and time in the portal. Nothing about how trades run changes.
          </p>
        </div>

        <div className="flex flex-col gap-1 p-1.5">
          {TIME_ZONE_IDS.map((id) => {
            const option = TIME_ZONES[id]
            const selected = id === timeZone
            const offset = timeZoneOffsetFromLocal(id, now)

            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setTimeZone(id)
                  setOpen(false)
                }}
                aria-current={selected}
                className={cn(
                  'group flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-all duration-150',
                  selected
                    ? 'border-accent/40 bg-accent-soft shadow-[0_0_0_1px_rgb(var(--accent-rgb)/0.15)]'
                    : 'border-transparent hover:border-border hover:bg-surface-2',
                )}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'text-sm font-medium',
                        selected ? 'text-accent' : 'text-text-primary',
                      )}
                    >
                      {option.label}
                    </span>
                    <span className="rounded bg-surface-2 px-1 py-px text-[10px] font-semibold uppercase tracking-wide text-text-tertiary group-hover:bg-surface">
                      {timeZoneAbbreviation(id, now)}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-text-tertiary">
                    {option.city} · {formatOffsetLabel(offset)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={cn(
                      'text-sm font-semibold tabular-nums',
                      selected ? 'text-accent' : 'text-text-secondary',
                    )}
                  >
                    {timeZoneClock(id, now)}
                  </span>
                  <Check
                    className={cn(
                      'h-3.5 w-3.5 text-accent transition-opacity',
                      selected ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </div>
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
