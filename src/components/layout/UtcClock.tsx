import { useEffect, useState } from 'react'

function formatUtcTime(date: Date): string {
  return date.toLocaleTimeString('en-GB', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function UtcClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  return (
    <span className="hidden text-xs font-medium tabular-nums text-text-tertiary sm:inline" title="UTC">
      {formatUtcTime(now)} UTC
    </span>
  )
}
