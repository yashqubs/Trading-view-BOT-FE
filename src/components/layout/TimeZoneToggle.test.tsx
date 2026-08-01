import { afterEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { TimeZoneToggle } from './TimeZoneToggle'
import { TimezoneProvider } from '@/context/TimezoneContext'
import { formatDateTime } from '@/lib/format'
import {
  DEFAULT_TIME_ZONE,
  TIME_ZONE_STORAGE_KEY,
  getActiveTimeZone,
  setActiveTimeZone,
} from '@/lib/timezone'

afterEach(() => {
  localStorage.clear()
  setActiveTimeZone(DEFAULT_TIME_ZONE)
})

function renderToggle() {
  render(
    <TimezoneProvider>
      <TimeZoneToggle />
    </TimezoneProvider>,
  )
}

function openPicker() {
  fireEvent.click(screen.getByRole('button', { name: /display timezone/i }))
}

/**
 * The clickable row for a zone, scoped to the open popover — the trigger
 * also renders the active zone's label, so an unscoped text query matches
 * twice.
 */
function zoneOption(label: string): HTMLElement {
  const el = within(screen.getByRole('dialog')).getByText(label).closest('button')
  if (!el) throw new Error(`No option button found for ${label}`)
  return el
}

// 03:30 UTC is 4:30am in London, 9:00am in Mumbai, and 11:30pm the PREVIOUS
// day in New York — the spread that makes an unlabelled timestamp misleading.
const INSTANT = '2026-08-01T03:30:00.000Z'

describe('TimeZoneToggle', () => {
  it('offers all three zones, each with a live clock', () => {
    renderToggle()
    openPicker()

    for (const label of ['UK', 'India', 'USA']) {
      const option = zoneOption(label)
      // A wall clock, not a placeholder.
      expect(option.textContent).toMatch(/\d{1,2}:\d{2}\s?(am|pm)/i)
    }
  })

  // The feature is worthless if picking a zone doesn't change what timestamps
  // actually render as, so assert formatter output rather than just state.
  it('changes how timestamps format, and persists the choice', () => {
    renderToggle()
    expect(formatDateTime(INSTANT)).toBe('01 Aug 2026, 4:30 am')

    openPicker()
    fireEvent.click(zoneOption('India'))

    expect(getActiveTimeZone()).toBe('INDIA')
    expect(formatDateTime(INSTANT)).toBe('01 Aug 2026, 9:00 am')
    expect(localStorage.getItem(TIME_ZONE_STORAGE_KEY)).toBe('INDIA')
  })

  it('restores the stored zone on the next mount', () => {
    localStorage.setItem(TIME_ZONE_STORAGE_KEY, 'USA')
    renderToggle()

    expect(getActiveTimeZone()).toBe('USA')
    expect(formatDateTime(INSTANT)).toBe('31 Jul 2026, 11:30 pm')
  })

  it('marks only the active zone as current', () => {
    renderToggle()
    openPicker()

    expect(zoneOption('UK')).toHaveAttribute('aria-current', 'true')
    expect(zoneOption('India')).toHaveAttribute('aria-current', 'false')
    expect(zoneOption('USA')).toHaveAttribute('aria-current', 'false')
  })
})
