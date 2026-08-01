import { createContext, type ReactNode, useContext, useMemo, useState } from 'react'
import {
  DEFAULT_TIME_ZONE,
  TIME_ZONES,
  TIME_ZONE_STORAGE_KEY,
  type TimeZoneId,
  type TimeZoneOption,
  readStoredTimeZone,
  setActiveTimeZone,
} from '@/lib/timezone'

interface TimezoneContextValue {
  timeZone: TimeZoneId
  zone: TimeZoneOption
  setTimeZone: (id: TimeZoneId) => void
}

const TimezoneContext = createContext<TimezoneContextValue | null>(null)

export function TimezoneProvider({ children }: { children: ReactNode }) {
  const [timeZone, setStateTimeZone] = useState<TimeZoneId>(() => {
    // The module mirror in lib/timezone.ts must hold the stored zone before
    // the first child renders, not after the first effect — otherwise every
    // date paints in the default zone and visibly re-flows a tick later.
    // A lazy initializer is the earliest synchronous point available, and it
    // is idempotent, so StrictMode's double-invoke is harmless. Doing this at
    // module scope instead would read localStorage once per page load and
    // then silently diverge from state on any later mount.
    const initial = typeof window === 'undefined' ? DEFAULT_TIME_ZONE : readStoredTimeZone()
    setActiveTimeZone(initial)
    return initial
  })

  const value = useMemo<TimezoneContextValue>(
    () => ({
      timeZone,
      zone: TIME_ZONES[timeZone],
      setTimeZone: (id: TimeZoneId) => {
        // Update the module mirror first: consumers re-render off the state
        // change below, and they must not read a stale zone while doing it.
        setActiveTimeZone(id)
        localStorage.setItem(TIME_ZONE_STORAGE_KEY, id)
        setStateTimeZone(id)
      },
    }),
    [timeZone],
  )

  return <TimezoneContext.Provider value={value}>{children}</TimezoneContext.Provider>
}

/**
 * Subscribes a component to the active zone.
 *
 * Any component that renders a formatted timestamp must call this even if it
 * ignores the return value — `formatDateTime` reads the zone from a module
 * variable, so without a context subscription the component simply won't
 * re-render when the zone changes and will sit there showing the old clock.
 */
export function useTimezone() {
  const ctx = useContext(TimezoneContext)
  if (!ctx) throw new Error('useTimezone must be used within TimezoneProvider')
  return ctx
}
