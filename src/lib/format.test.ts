import { afterEach, describe, expect, it } from 'vitest'
import {
  formatCalendarDate,
  formatCount,
  formatDateTime,
  formatDurationBetween,
  formatMoney,
  formatPercent,
  formatSignedQuantity,
} from './format'
import { DEFAULT_TIME_ZONE, setActiveTimeZone } from './timezone'

afterEach(() => setActiveTimeZone(DEFAULT_TIME_ZONE))

describe('formatMoney', () => {
  it('formats to 2 decimal places with currency symbol', () => {
    expect(formatMoney(1234.5)).toBe('£1,234.50')
  })

  it('returns an em dash for nullish input', () => {
    expect(formatMoney(null)).toBe('—')
  })
})

describe('formatPercent', () => {
  it('formats to 1 decimal place', () => {
    expect(formatPercent(87.654)).toBe('87.7%')
  })
})

describe('formatCount', () => {
  it('rounds to the nearest integer', () => {
    expect(formatCount(12.6)).toBe('13')
  })
})

describe('formatSignedQuantity — IG-style size sign', () => {
  it('shows a SELL/short stake as negative', () => {
    expect(formatSignedQuantity(2.34, 'SELL')).toBe('-2.34')
  })

  it('shows a BUY/long stake as positive', () => {
    expect(formatSignedQuantity(2.34, 'BUY')).toBe('2.34')
  })

  // IG's REST API reports size unsigned today. If it ever starts signing the
  // field, re-negating would flip shorts back to positive — the exact bug the
  // Math.abs normalization prevents.
  it('normalizes an already-negative value instead of double-negating it', () => {
    expect(formatSignedQuantity(-2.34, 'SELL')).toBe('-2.34')
    expect(formatSignedQuantity(-2.34, 'BUY')).toBe('2.34')
  })

  it('strips trailing zeros the same way as unsigned sizes', () => {
    expect(formatSignedQuantity(10, 'SELL')).toBe('-10')
    expect(formatSignedQuantity(1.5, 'SELL')).toBe('-1.5')
  })

  it('renders an em dash for a missing size rather than "-0"', () => {
    expect(formatSignedQuantity(null, 'SELL')).toBe('—')
    expect(formatSignedQuantity(undefined, 'BUY')).toBe('—')
  })
})

describe('formatDateTime — display timezone', () => {
  // 03:30 UTC lands on three different clocks, and for New York a different
  // calendar day — the case that makes an unlabelled timestamp misleading.
  const instant = '2026-08-01T03:30:00.000Z'

  it('renders in UK time', () => {
    setActiveTimeZone('UK')
    expect(formatDateTime(instant)).toBe('01 Aug 2026, 4:30 am')
  })

  it('renders in India time', () => {
    setActiveTimeZone('INDIA')
    expect(formatDateTime(instant)).toBe('01 Aug 2026, 9:00 am')
  })

  it('renders in US Eastern time, rolling back to the previous day', () => {
    setActiveTimeZone('USA')
    expect(formatDateTime(instant)).toBe('31 Jul 2026, 11:30 pm')
  })
})

describe('formatCalendarDate — zone-independent', () => {
  // Chart buckets are already calendar dates. Shifting them by a zone would
  // slide a day's totals onto the wrong label.
  it('renders the same date whatever the display zone', () => {
    setActiveTimeZone('USA')
    const inUsa = formatCalendarDate('2026-08-01')
    setActiveTimeZone('INDIA')
    expect(formatCalendarDate('2026-08-01')).toBe(inUsa)
    expect(inUsa).toBe('1 Aug')
  })
})

describe('formatDurationBetween', () => {
  it.each([
    ['2026-08-01T00:00:00Z', '2026-08-01T00:00:30Z', '<1m'],
    ['2026-08-01T00:00:00Z', '2026-08-01T00:45:00Z', '45m'],
    ['2026-08-01T00:00:00Z', '2026-08-01T04:00:00Z', '4h'],
    ['2026-08-01T00:00:00Z', '2026-08-01T04:20:00Z', '4h 20m'],
    ['2026-08-01T00:00:00Z', '2026-08-04T05:00:00Z', '3d 5h'],
    ['2026-08-01T00:00:00Z', '2026-08-04T00:00:00Z', '3d'],
  ])('%s to %s is %s', (from, to, expected) => {
    expect(formatDurationBetween(from, to)).toBe(expected)
  })

  it('returns null for a missing end or a negative span', () => {
    expect(formatDurationBetween('2026-08-01T00:00:00Z', null)).toBeNull()
    expect(formatDurationBetween(null, '2026-08-01T00:00:00Z')).toBeNull()
    // Clock skew between IG's open time and our execution time must not
    // surface as a nonsense "held -3m".
    expect(formatDurationBetween('2026-08-01T01:00:00Z', '2026-08-01T00:00:00Z')).toBeNull()
  })
})
