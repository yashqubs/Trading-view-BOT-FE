/**
 * The portal shows one set of clocks for a bot that trades US markets from a
 * UK IG account, watched from India. "8:42 pm" means nothing without saying
 * where, so the zone is an explicit, persisted choice rather than whatever
 * the viewer's laptop happens to be set to.
 *
 * Everything on the wire is UTC (ISO 8601 from the API); the zone applies at
 * render time only. Nothing here changes what's stored, filtered, or sent.
 */

export const TIME_ZONE_IDS = ['UK', 'INDIA', 'USA'] as const
export type TimeZoneId = (typeof TIME_ZONE_IDS)[number]

export interface TimeZoneOption {
  id: TimeZoneId
  label: string
  city: string
  /** IANA zone — handles BST/EDT transitions on its own, so no DST logic here. */
  ianaZone: string
}

export const TIME_ZONES: Record<TimeZoneId, TimeZoneOption> = {
  UK: { id: 'UK', label: 'UK', city: 'London', ianaZone: 'Europe/London' },
  INDIA: { id: 'INDIA', label: 'India', city: 'Mumbai', ianaZone: 'Asia/Kolkata' },
  USA: { id: 'USA', label: 'USA', city: 'New York', ianaZone: 'America/New_York' },
}

export const DEFAULT_TIME_ZONE: TimeZoneId = 'UK'
export const TIME_ZONE_STORAGE_KEY = 'portal-timezone'

export function isTimeZoneId(value: unknown): value is TimeZoneId {
  return typeof value === 'string' && (TIME_ZONE_IDS as readonly string[]).includes(value)
}

export function readStoredTimeZone(): TimeZoneId {
  const stored = localStorage.getItem(TIME_ZONE_STORAGE_KEY)
  return isTimeZoneId(stored) ? stored : DEFAULT_TIME_ZONE
}

// ─── Active zone ──────────────────────────────────────────────────────────────

// A module-level mirror of the React state, so the plain formatters in
// lib/format.ts stay plain functions — `formatDateTime(iso)` at ~15 call
// sites rather than every one of them having to thread a zone through props.
// TimezoneProvider owns writes to this; it is the single source of the value
// and re-renders the tree on change, so the two can't drift.
let activeZone: TimeZoneId = DEFAULT_TIME_ZONE

export function setActiveTimeZone(id: TimeZoneId) {
  activeZone = id
}

export function getActiveTimeZone(): TimeZoneId {
  return activeZone
}

export function activeIanaZone(): string {
  return TIME_ZONES[activeZone].ianaZone
}

/**
 * The zone's short name right now — "BST", "IST", "EDT". Read from Intl
 * rather than hardcoded, so it follows daylight saving without a table to
 * maintain (London is GMT in January and BST in July).
 */
export function timeZoneAbbreviation(id: TimeZoneId, at: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONES[id].ianaZone,
    timeZoneName: 'short',
  }).formatToParts(at)
  return parts.find((part) => part.type === 'timeZoneName')?.value ?? ''
}

/** Wall-clock time in that zone right now, e.g. "8:42 pm" — for the picker. */
export function timeZoneClock(id: TimeZoneId, at: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONES[id].ianaZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(at)
}

/**
 * Signed hour difference from the viewer's own clock, e.g. +5.5 for India
 * seen from the UK. Shown in the picker so the offset is concrete instead of
 * requiring mental arithmetic.
 */
export function timeZoneOffsetFromLocal(id: TimeZoneId, at: Date = new Date()): number {
  const inZone = new Date(at.toLocaleString('en-US', { timeZone: TIME_ZONES[id].ianaZone }))
  const local = new Date(at.toLocaleString('en-US'))
  return Math.round(((inZone.getTime() - local.getTime()) / 3_600_000) * 10) / 10
}

export function formatOffsetLabel(hours: number): string {
  if (hours === 0) return 'same as you'
  const sign = hours > 0 ? '+' : '−'
  const abs = Math.abs(hours)
  const whole = Math.floor(abs)
  const minutes = Math.round((abs - whole) * 60)
  return `${sign}${whole}${minutes ? `:${String(minutes).padStart(2, '0')}` : ''} hr`
}
