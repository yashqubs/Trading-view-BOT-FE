import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DateRangeValue {
  from?: string    // YYYY-MM-DD (local, not UTC)
  to?: string      // YYYY-MM-DD
  preset?: PresetKey
}

export type PresetKey = 'all' | 'today' | '7d' | '30d' | '90d' | '1y' | 'custom'

interface Preset { key: PresetKey; label: string; days: number }

const ALL_TIME_PRESET: Preset = { key: 'all', label: 'All time', days: 0 }

const PRESETS: Preset[] = [
  { key: 'today', label: 'Today',  days: 1   },
  { key: '7d',    label: '7D',     days: 7   },
  { key: '30d',   label: '30D',    days: 30  },
  { key: '90d',   label: '90D',    days: 90  },
  { key: '1y',    label: '1Y',     days: 365 },
]

// ─── Date helpers (local time — avoids UTC offset bugs) ───────────────────────

function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function fromISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function calcPreset(key: PresetKey): { from: string; to: string; days: number } {
  if (key === 'all') return { from: '', to: '', days: 0 }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayISO = toISO(today)
  if (key === 'today') return { from: todayISO, to: todayISO, days: 1 }
  const p = PRESETS.find((x) => x.key === key)!
  const from = new Date(today)
  from.setDate(from.getDate() - (p.days - 1))
  return { from: toISO(from), to: todayISO, days: p.days }
}

function fmtShort(iso: string) {
  return fromISO(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function triggerLabel(v: DateRangeValue): string {
  if (v.preset === 'all') return ALL_TIME_PRESET.label
  if (v.preset && v.preset !== 'custom') {
    return PRESETS.find((p) => p.key === v.preset)?.label ?? 'Date range'
  }
  if (v.from && v.to) {
    return v.from === v.to ? fmtShort(v.from) : `${fmtShort(v.from)} – ${fmtShort(v.to)}`
  }
  return 'Custom'
}

// ─── DateRangePicker ──────────────────────────────────────────────────────────

interface DateRangePickerProps {
  value: DateRangeValue
  onChange: (v: DateRangeValue) => void
  onDaysChange?: (days: number) => void
  /** Show an "All time" pill (no date filter) as the first option. */
  allowAll?: boolean
  className?: string
}

export function DateRangePicker({ value, onChange, onDaysChange, allowAll, className }: DateRangePickerProps) {
  const [customOpen, setCustomOpen] = useState(false)
  const [pendingRange, setPendingRange] = useState<DateRange | undefined>(undefined)
  const [hoverDay, setHoverDay] = useState<Date | undefined>(undefined)

  function applyPreset(key: PresetKey) {
    const { from, to, days } = calcPreset(key)
    onChange({ preset: key, from, to })
    onDaysChange?.(days)
    setCustomOpen(false)
  }

  function openCustom(open: boolean) {
    if (open) {
      setPendingRange(
        value.preset === 'custom' && value.from
          ? { from: fromISO(value.from), to: value.to ? fromISO(value.to) : undefined }
          : undefined,
      )
    }
    setCustomOpen(open)
  }

  function handleCalendarSelect(r: DateRange | undefined) {
    // With min={1}, react-day-picker clears the range entirely when the
    // user clicks the start date a second time (its way of "restarting"
    // the selection) — reinterpret that as confirming a single-day range
    // instead of clearing, same as clicking Apply with just a start picked.
    if (!r && pendingRange?.from && !pendingRange.to) {
      setPendingRange({ from: pendingRange.from, to: pendingRange.from })
      setHoverDay(undefined)
      return
    }
    setPendingRange(r)
    setHoverDay(undefined)
  }

  function applyCustom() {
    if (!pendingRange?.from) return
    const from = toISO(pendingRange.from)
    const to = pendingRange.to ? toISO(pendingRange.to) : from
    const days = pendingRange.to
      ? Math.round((pendingRange.to.getTime() - pendingRange.from.getTime()) / 86_400_000) + 1
      : 1
    onChange({ preset: 'custom', from, to })
    onDaysChange?.(days)
    setCustomOpen(false)
  }

  // Visual-only preview of what the range would be if the user clicked now —
  // never fed back into `selected`, since react-day-picker uses `selected`
  // as the baseline for resolving the NEXT click, and a hover-filled "to"
  // would make it think the range was already complete.
  const hoverPreview =
    pendingRange?.from && !pendingRange.to && hoverDay
      ? hoverDay < pendingRange.from
        ? { from: hoverDay, to: pendingRange.from }
        : { from: pendingRange.from, to: hoverDay }
      : undefined

  return (
    <div className={cn('flex items-center gap-1 overflow-x-auto rounded-md bg-surface-2 p-1', className)}>
      {allowAll && (
        <button
          type="button"
          onClick={() => applyPreset('all')}
          className={cn(
            'shrink-0 whitespace-nowrap rounded px-2.5 py-1 text-xs font-medium transition-colors',
            value.preset === 'all'
              ? 'bg-accent text-accent-foreground'
              : 'text-text-secondary hover:bg-accent/15 hover:text-accent',
          )}
        >
          {ALL_TIME_PRESET.label}
        </button>
      )}
      {PRESETS.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={() => applyPreset(p.key)}
          className={cn(
            'shrink-0 whitespace-nowrap rounded px-2.5 py-1 text-xs font-medium transition-colors',
            value.preset === p.key
              ? 'bg-accent text-accent-foreground'
              : 'text-text-secondary hover:bg-accent/15 hover:text-accent',
          )}
        >
          {p.label}
        </button>
      ))}

      <Popover open={customOpen} onOpenChange={openCustom}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex shrink-0 items-center gap-1 whitespace-nowrap rounded px-2.5 py-1 text-xs font-medium transition-colors',
              value.preset === 'custom'
                ? 'bg-accent text-accent-foreground'
                : 'text-text-secondary hover:bg-accent/15 hover:text-accent',
            )}
          >
            <CalendarDays className="h-3 w-3" />
            {value.preset === 'custom' ? triggerLabel(value) : 'Custom'}
          </button>
        </PopoverTrigger>

        <PopoverContent align="end" sideOffset={6} className="w-[300px] p-0">
          <Calendar
            mode="range"
            min={1}
            selected={pendingRange}
            onSelect={handleCalendarSelect}
            onDayMouseEnter={(day) => setHoverDay(day)}
            onDayMouseLeave={() => setHoverDay(undefined)}
            captionLayout="dropdown"
            startMonth={new Date(new Date().getFullYear() - 3, 0, 1)}
            endMonth={new Date()}
            numberOfMonths={1}
            disabled={{ after: new Date() }}
            modifiers={hoverPreview ? { hoverPreview } : undefined}
          />

          <div className="border-t border-border px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-mono text-text-secondary">
                {pendingRange?.from
                  ? pendingRange.to
                    ? `${fmtShort(toISO(pendingRange.from))} – ${fmtShort(toISO(pendingRange.to))}`
                    : `${fmtShort(toISO(pendingRange.from))} (click again or Apply for 1 day)`
                  : 'Pick a start date'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCustomOpen(false)}
                  className="text-xs text-text-tertiary transition-colors hover:text-text-primary"
                >
                  Cancel
                </button>
                <Button
                  size="sm"
                  className="h-7 px-3 text-xs"
                  disabled={!pendingRange?.from}
                  onClick={applyCustom}
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
