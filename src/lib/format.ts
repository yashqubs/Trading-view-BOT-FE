import { activeIanaZone } from './timezone'

export function formatMoney(value: number | null | undefined, currency = 'GBP') {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${value.toFixed(1)}%`
}

export function formatCount(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format(Math.round(value))
}

// Every timestamp from the API is a UTC instant; which wall clock it's shown
// on is the user's choice (TopBar → timezone picker). These read the active
// zone rather than taking it as an argument so call sites stay unchanged —
// see lib/timezone.ts for why that indirection exists.
export function formatDate(value: string | Date | null | undefined) {
  if (!value) return '—'
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: activeIanaZone(),
  }).format(date)
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return '—'
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: activeIanaZone(),
  }).format(date)
}

/**
 * A calendar date that is already a date, not an instant — the `YYYY-MM-DD`
 * buckets the stats endpoints return, and the from/to values the date-range
 * filter sends. Shifting these by a zone would slide a day's totals onto the
 * wrong label, so they are formatted as-written and deliberately ignore the
 * active zone.
 */
export function formatCalendarDate(
  iso: string,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' },
) {
  const [year, month, day] = iso.split('-').map(Number)
  if (!year || !month || !day) return iso
  return new Intl.DateTimeFormat('en-GB', { ...options, timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, month - 1, day)),
  )
}

export function formatPrice(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return value.toFixed(2)
}

export function formatQuantity(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')
}

/**
 * Size the way IG displays it: a short stake reads negative, a long reads
 * positive.
 *
 * IG's REST API reports `size` unsigned and puts the long/short information
 * in a separate `direction` field, while IG's own platform renders shorts
 * with a minus — so the sign is derived here from direction rather than taken
 * from the raw number. Showing an unsigned 2.34 for a short and for a long
 * makes two opposite exposures look identical at a glance.
 *
 * `direction` is the direction of the order that went to IG. On the trades
 * table that is `trade.direction`: a close is always the opposite side of the
 * position it closes, which is exactly the signal's own direction, so the two
 * never diverge. On the positions table it is the position's own direction.
 *
 * A value that already arrives negative is normalized rather than negated
 * again — if IG ever starts signing the field, this must not flip it back.
 */
export function formatSignedQuantity(
  value: number | null | undefined,
  direction: 'BUY' | 'SELL',
) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  const magnitude = Math.abs(value)
  return formatQuantity(direction === 'SELL' ? -magnitude : magnitude)
}

/**
 * How long something lasted, as a compact label — "4h 20m", "3d 5h".
 * A duration is zone-independent by definition, so this ignores the active
 * timezone entirely. Returns null when either end is missing or the span is
 * negative (clock skew between IG's open time and our execution time).
 */
export function formatDurationBetween(
  from: string | Date | null | undefined,
  to: string | Date | null | undefined,
) {
  if (!from || !to) return null
  const start = typeof from === 'string' ? new Date(from) : from
  const end = typeof to === 'string' ? new Date(to) : to
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null

  const totalMinutes = Math.floor((end.getTime() - start.getTime()) / 60_000)
  if (totalMinutes < 0) return null
  if (totalMinutes < 1) return '<1m'
  if (totalMinutes < 60) return `${totalMinutes}m`

  const hours = Math.floor(totalMinutes / 60)
  if (hours < 24) {
    const minutes = totalMinutes % 60
    return minutes ? `${hours}h ${minutes}m` : `${hours}h`
  }

  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  return remainingHours ? `${days}d ${remainingHours}h` : `${days}d`
}

export function formatRelativeTime(value: string | Date | null | undefined) {
  if (!value) return null
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return null

  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000)
  const absSeconds = Math.abs(diffSeconds)
  const rtf = new Intl.RelativeTimeFormat('en-GB', { numeric: 'auto' })

  if (absSeconds < 60) return rtf.format(diffSeconds, 'second')
  if (absSeconds < 3600) return rtf.format(Math.round(diffSeconds / 60), 'minute')
  if (absSeconds < 86400) return rtf.format(Math.round(diffSeconds / 3600), 'hour')
  if (absSeconds < 604800) return rtf.format(Math.round(diffSeconds / 86400), 'day')
  return rtf.format(Math.round(diffSeconds / 604800), 'week')
}
