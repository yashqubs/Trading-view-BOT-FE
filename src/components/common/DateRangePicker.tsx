import { useState, useEffect, useRef } from 'react'
import { CalendarDays, ChevronDown, X } from 'lucide-react'
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

export type PresetKey = 'today' | '7d' | '14d' | '30d' | '90d' | '6m' | '1y' | 'custom'

interface Preset { key: PresetKey; label: string; days: number }

const PRESETS: Preset[] = [
  { key: 'today', label: 'Today',   days: 1   },
  { key: '7d',    label: '7 days',  days: 7   },
  { key: '14d',   label: '14 days', days: 14  },
  { key: '30d',   label: '30 days', days: 30  },
  { key: '90d',   label: '90 days', days: 90  },
  { key: '6m',    label: '6 months',days: 180 },
  { key: '1y',    label: '1 year',  days: 365 },
  { key: 'custom',label: 'Custom',  days: 30  },
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
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayISO = toISO(today)
  if (key === 'today') return { from: todayISO, to: todayISO, days: 1 }
  const p = PRESETS.find((x) => x.key === key)!
  const from = new Date(today)
  from.setDate(from.getDate() - (p.days - 1))
  return { from: toISO(from), to: todayISO, days: p.days }
}

function fmtFull(iso: string) {
  return fromISO(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function triggerLabel(v: DateRangeValue): string {
  if (v.preset && v.preset !== 'custom') {
    return PRESETS.find((p) => p.key === v.preset)!.label
  }
  if (v.from && v.to) {
    if (v.from === v.to) return fmtFull(v.from)
    const f = fromISO(v.from).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    const t = fromISO(v.to).toLocaleDateString('en-GB',   { day: 'numeric', month: 'short' })
    return `${f} – ${t}`
  }
  return 'Date range'
}

// ─── Dropdown calendar start/end bounds ──────────────────────────────────────

function getStartMonth() {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 3)
  d.setDate(1)
  return d
}

// ─── DateRangePicker ──────────────────────────────────────────────────────────

interface DateRangePickerProps {
  value: DateRangeValue
  onChange: (v: DateRangeValue) => void
  onDaysChange?: (days: number) => void
  className?: string
}

export function DateRangePicker({ value, onChange, onDaysChange, className }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)

  // pendingRange mirrors what's selected in the calendar but NOT yet "applied"
  const [pendingRange, setPendingRange] = useState<DateRange | undefined>(undefined)

  // When popover opens, seed pendingRange from current value
  const wasOpen = useRef(false)
  useEffect(() => {
    if (open && !wasOpen.current) {
      setPendingRange(
        value.from
          ? { from: fromISO(value.from), to: value.to ? fromISO(value.to) : undefined }
          : undefined,
      )
    }
    wasOpen.current = open
  }, [open, value.from, value.to])

  const activePreset = value.preset

  // ── Helpers ───────────────────────────────────────────────────────────────

  function applyPreset(key: PresetKey) {
    if (key === 'custom') {
      setPendingRange(undefined)
      // Stay open so user can pick dates
      return
    }
    const { from, to, days } = calcPreset(key)
    setPendingRange({ from: fromISO(from), to: fromISO(to) })
    onChange({ preset: key, from, to })
    onDaysChange?.(days)
    setOpen(false)  // preset picks close immediately
  }

  function handleCalendarSelect(r: DateRange | undefined) {
    // Update ONLY the pending state — do NOT close, do NOT call onChange yet
    setPendingRange(r)
  }

  function applyAndClose() {
    if (!pendingRange?.from) {
      setOpen(false)
      return
    }
    const from = toISO(pendingRange.from)
    const to = pendingRange.to ? toISO(pendingRange.to) : from
    const days = pendingRange.to
      ? Math.round((pendingRange.to.getTime() - pendingRange.from.getTime()) / 86_400_000) + 1
      : 1
    onChange({ preset: 'custom', from, to })
    onDaysChange?.(days)
    setOpen(false)
  }

  function resetToDefault() {
    const { from, to } = calcPreset('30d')
    setPendingRange({ from: fromISO(from), to: fromISO(to) })
    onChange({ preset: '30d', from, to })
    onDaysChange?.(30)
    setOpen(false)
  }

  // ─────────────────────────────────────────────────────────────────────────

  const pendingFrom = pendingRange?.from ? toISO(pendingRange.from) : undefined
  const pendingTo   = pendingRange?.to   ? toISO(pendingRange.to)   : undefined
  const hasSelection = !!pendingFrom

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          className={cn(
            'h-8 min-w-[150px] justify-between gap-1.5 px-3 text-xs font-normal',
            open && 'border-accent/50',
            className,
          )}
        >
          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-accent" />
          <span className="flex-1 truncate text-left">{triggerLabel(value)}</span>
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 shrink-0 text-text-tertiary transition-transform duration-200',
              open && 'rotate-180',
            )}
          />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" sideOffset={6} className="w-[310px] p-0">

        {/* ── Preset chips ──────────────────────────────────────────── */}
        <div className="border-b border-border px-3 py-2.5">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
            Quick select
          </p>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => {
              const active = activePreset === p.key ||
                (p.key === 'custom' && activePreset === 'custom')
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => applyPreset(p.key)}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors',
                    active
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-surface-2 text-text-secondary hover:bg-accent/15 hover:text-accent',
                  )}
                >
                  {p.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Calendar ────────────────────────────────────────────────── */}
        <Calendar
          mode="range"
          selected={pendingRange}
          onSelect={handleCalendarSelect}
          captionLayout="dropdown"
          startMonth={getStartMonth()}
          endMonth={new Date()}
          numberOfMonths={1}
          defaultMonth={
            value.from
              ? fromISO(value.from)
              : new Date()
          }
          disabled={{ after: new Date() }}
        />

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div className="border-t border-border p-3">
          {/* From → To display */}
          <div className="mb-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div className={cn(
              'rounded-md border px-2.5 py-1.5 text-center text-xs font-mono',
              pendingFrom
                ? 'border-accent/40 bg-accent/5 text-text-primary'
                : 'border-border text-text-tertiary',
            )}>
              {pendingFrom ? fmtFull(pendingFrom) : 'Start date'}
            </div>
            <span className="text-xs text-text-tertiary">→</span>
            <div className={cn(
              'rounded-md border px-2.5 py-1.5 text-center text-xs font-mono',
              pendingTo
                ? 'border-accent/40 bg-accent/5 text-text-primary'
                : pendingFrom
                  ? 'border-accent/30 border-dashed text-accent/70'
                  : 'border-border text-text-tertiary',
            )}>
              {pendingTo
                ? fmtFull(pendingTo)
                : pendingFrom
                  ? 'Pick end…'
                  : 'End date'}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetToDefault}
              className="flex items-center gap-1 text-xs text-text-tertiary transition-colors hover:text-danger"
            >
              <X className="h-3 w-3" />
              Reset
            </button>
            <Button
              size="sm"
              variant={hasSelection ? 'primary' : 'secondary'}
              disabled={!hasSelection}
              className="ml-auto h-7 px-4 text-xs"
              onClick={applyAndClose}
            >
              Apply
            </Button>
          </div>
        </div>

      </PopoverContent>
    </Popover>
  )
}
