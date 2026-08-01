import { Link } from 'react-router'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useSystemStatus } from '@/hooks/useSystem'
import { formatDateTime, formatRelativeTime } from '@/lib/format'
import { useTimezone } from '@/context/TimezoneContext'
import { cn } from '@/lib/utils'

// What "TradingView status" can actually mean: TradingView never holds a
// connection open to us — it fires one plain HTTP webhook per alert and
// forgets about it (Section 5 Layer 3) — so there is no live up/down signal
// to show for TradingView itself. "Ready" here means the broker (IG) is
// connected, i.e. a signal arriving right now could actually place a trade;
// the last-signal time is shown alongside it so a client can also see
// whether alerts are actually arriving. Neither half is invented data — both
// already come from GET /system/status (igConnected, lastSignalReceivedAt),
// kept fresh here the same way Settings does: useSystemStatus already
// re-fetches on the 'system:status' and 'trade:created' socket events, so
// this needs no polling of its own.
export function TradingStatusPill() {
  // See TimezoneContext — the last-signal tooltip formats a timestamp.
  useTimezone()
  const { data, isLoading } = useSystemStatus()

  if (isLoading || !data) {
    return (
      <span className="hidden items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs text-text-tertiary sm:flex">
        <span className="h-1.5 w-1.5 rounded-full bg-text-tertiary" />
        Checking…
      </span>
    )
  }

  const { igConnected, lastSignalReceivedAt } = data
  const relativeSignal = formatRelativeTime(lastSignalReceivedAt)

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to="/settings"
            className={cn(
              'hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:flex',
              igConnected
                ? 'border-success/30 bg-success/10 text-success hover:bg-success/15'
                : 'border-danger/30 bg-danger/10 text-danger hover:bg-danger/15',
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                igConnected ? 'animate-pulse bg-success' : 'bg-danger',
              )}
            />
            {igConnected ? 'Trading ready' : 'Broker offline'}
            {relativeSignal && (
              <span
                className={cn(
                  'hidden font-normal opacity-75 md:inline',
                  igConnected ? 'text-success' : 'text-danger',
                )}
              >
                · signal {relativeSignal}
              </span>
            )}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end" className="max-w-[240px]">
          <p className="font-medium text-text-primary">
            {igConnected
              ? 'Broker connected — ready to trade'
              : 'Broker disconnected — trades cannot execute'}
          </p>
          <p className="mt-1 text-text-secondary">
            Last signal from TradingView:{' '}
            {lastSignalReceivedAt ? (
              <span title={formatDateTime(lastSignalReceivedAt)}>{relativeSignal}</span>
            ) : (
              'none received yet'
            )}
          </p>
          <p className="mt-1 text-text-tertiary">Click for full details.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
