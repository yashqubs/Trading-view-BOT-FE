import { useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router'
import { Moon, Sun, Sunrise, Sunset, type LucideIcon } from 'lucide-react'
import { NAV_ITEMS } from './nav-items'
import { BotToggle } from './BotToggle'
import { ThemeToggle } from './ThemeToggle'
import { TimeZoneToggle } from './TimeZoneToggle'
import { TradingStatusPill } from './TradingStatusPill'
import { UserMenu } from './UserMenu'
import { useAuth } from '@/context/AuthContext'
import { useTimezone } from '@/context/TimezoneContext'
import { TIME_ZONES } from '@/lib/timezone'

// The sidebar and page heading already say what page you're on, so the top
// bar doesn't repeat a third copy of the label. Instead it surfaces the
// ticker crumb (only meaningful context it uniquely has) plus a live
// time-of-day greeting, so the header actually changes as the day goes on
// instead of showing the same static string on every screen.
function useTickerCrumb(): string | undefined {
  const { pathname } = useLocation()
  const { ticker } = useParams()
  const onKnownRoute = NAV_ITEMS.some((item) =>
    item.end ? pathname === item.to : pathname.startsWith(item.to),
  )
  return onKnownRoute ? ticker : undefined
}

function getGreeting(hour: number): { text: string; icon: LucideIcon } {
  if (hour < 5) return { text: 'Still trading late', icon: Moon }
  if (hour < 12) return { text: 'Good morning', icon: Sunrise }
  if (hour < 17) return { text: 'Good afternoon', icon: Sun }
  if (hour < 21) return { text: 'Good evening', icon: Sunset }
  return { text: 'Good evening', icon: Moon }
}

export function TopBar() {
  const { user } = useAuth()
  const { timeZone } = useTimezone()
  const crumb = useTickerCrumb()
  const [now, setNow] = useState(() => new Date())

  // Minute-granularity is plenty for a greeting/date — avoids a per-second
  // re-render tax on every page for something nobody reads that precisely.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  // The greeting and date follow the selected display zone, not the viewer's
  // machine — "Good evening" while the header says it's 9am in the zone
  // you're reading the rest of the page in would be nonsense.
  const ianaZone = TIME_ZONES[timeZone].ianaZone
  const zonedHour = Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: ianaZone, hour: 'numeric', hour12: false })
      .format(now)
      // hour12:false yields "24" rather than "00" at midnight in en-GB.
      .replace('24', '0'),
  )

  const { text, icon: Icon } = getGreeting(zonedHour)
  const firstName = user?.name.split(' ')[0]
  const dateLabel = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: ianaZone,
  }).format(now)

  return (
    <header className="flex h-16 items-center justify-between gap-2 border-b border-border bg-surface/80 px-3 shadow-[var(--shadow-sm)] backdrop-blur-md sm:gap-4 sm:px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-stat-violet text-accent-foreground shadow-[0_0_14px_rgb(var(--accent-rgb)/0.4)]">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-text-primary">
            {text}
            {firstName ? `, ${firstName}` : ''}
          </h2>
          <p className="hidden truncate text-xs text-text-tertiary md:block">
            {dateLabel}
            {crumb ? ` · Viewing ${crumb}` : ''}
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
        <TradingStatusPill />
        <div className="hidden h-6 w-px bg-border sm:block" />
        <TimeZoneToggle />
        <BotToggle />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  )
}
