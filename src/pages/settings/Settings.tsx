import { useState } from 'react'
import { toast } from 'sonner'
import { Check, Copy, ShieldCheck } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { useSystemStatus } from '@/hooks/useSystem'
import { disableTwoFactor, enableTwoFactor } from '@/api/auth'
import { useAuth } from '@/context/AuthContext'
import { useSocketEvent } from '@/hooks/useSocketEvent'
import { socket } from '@/lib/socket'
import { formatDateTime, formatRelativeTime } from '@/lib/format'
import { useTimezone } from '@/context/TimezoneContext'
import { cn } from '@/lib/utils'

export function Settings() {
  // See TimezoneContext — "last signal received" formats a timestamp.
  useTimezone()
  const { user, setUser } = useAuth()
  const system = useSystemStatus()
  const [copied, setCopied] = useState(false)
  const [toggling2fa, setToggling2fa] = useState(false)

  // Whether THIS browser tab has a live push connection open — separate from
  // TradingView and the broker, which is why it lives here rather than
  // alongside "Broker connection" above. Was previously shown as a "Live"
  // pill in the top bar, which non-technical users read as "is TradingView
  // connected" — it never was.
  const [liveUpdates, setLiveUpdates] = useState(() => socket.connected)
  useSocketEvent('connect', () => setLiveUpdates(true))
  useSocketEvent('disconnect', () => setLiveUpdates(false))

  const twoFactorOn = user?.twoFactorEnabled ?? false

  function copyWebhookUrl() {
    if (!system.data) return
    navigator.clipboard.writeText(system.data.webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleToggle2fa(checked: boolean) {
    setToggling2fa(true)
    try {
      const { user: updatedUser } = checked ? await enableTwoFactor() : await disableTwoFactor()
      setUser(updatedUser)
      toast.success(
        checked ? 'Two-factor authentication enabled' : 'Two-factor authentication disabled',
      )
    } catch {
      toast.error('Could not update two-factor authentication')
    } finally {
      setToggling2fa(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-medium text-text-primary">Settings</h1>
        <p className="text-sm text-text-secondary">Webhook configuration, broker status, and account security.</p>
      </div>

      <Card className="animate-fade-slide-in">
        <CardHeader>
          <CardTitle>System status</CardTitle>
        </CardHeader>
        {system.isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : system.isError ? (
          <p className="text-sm text-danger">Could not load system status. Try refreshing the page.</p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Webhook URL</Label>
              <div className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-3 py-2.5">
                <span className="truncate text-sm text-text-primary">
                  {system.data?.webhookUrl || 'Not configured'}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyWebhookUrl}
                  disabled={!system.data?.webhookUrl}
                  aria-label="Copy webhook URL"
                >
                  {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-text-tertiary">Set this as the webhook URL on both TradingView alerts.</p>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
              <Label>Broker connection (IG)</Label>
              <Badge variant={system.data?.igConnected ? 'success' : 'danger'}>
                {system.data?.igConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
              <Label>Last TradingView signal</Label>
              {system.data?.lastSignalReceivedAt ? (
                <span
                  className="text-sm text-text-primary"
                  title={formatDateTime(system.data.lastSignalReceivedAt)}
                >
                  {formatRelativeTime(system.data.lastSignalReceivedAt)}
                </span>
              ) : (
                <Badge variant="neutral">None received yet</Badge>
              )}
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
              <div>
                <Label>Live updates in this browser</Label>
                <p className="mt-0.5 text-xs text-text-tertiary">
                  Whether new trades and positions appear here instantly, without a page
                  refresh. Separate from TradingView and the broker — a "disconnected" here
                  just means reload this tab.
                </p>
              </div>
              <Badge variant={liveUpdates ? 'success' : 'neutral'}>
                {liveUpdates ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
          </div>
        )}
      </Card>

      <Card className="animate-fade-slide-in">
        <CardHeader>
          <CardTitle>Two-factor authentication</CardTitle>
        </CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors',
                twoFactorOn ? 'bg-accent-soft text-accent' : 'bg-surface-2 text-text-tertiary',
              )}
            >
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm text-text-primary">
                Status:{' '}
                <Badge variant={twoFactorOn ? 'success' : 'neutral'}>
                  {twoFactorOn ? 'Enabled' : 'Off'}
                </Badge>
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                Optional. When enabled, a 6-digit code is emailed to you each time you sign in.
              </p>
            </div>
          </div>
          <div
            className={cn(
              'flex shrink-0 items-center gap-2 self-start rounded-full border px-3 py-1.5 shadow-[var(--shadow-sm)] transition-colors sm:self-auto',
              twoFactorOn ? 'border-accent/25 bg-accent-soft' : 'border-border bg-surface-2',
            )}
          >
            <span className={cn('status-dot', twoFactorOn ? 'text-accent' : 'text-text-tertiary')} />
            <span
              className={cn(
                'text-xs font-medium',
                twoFactorOn ? 'text-accent' : 'text-text-secondary',
              )}
            >
              2FA {twoFactorOn ? 'on' : 'off'}
            </span>
            <Switch
              checked={twoFactorOn}
              onCheckedChange={handleToggle2fa}
              disabled={toggling2fa}
              aria-label="Toggle two-factor authentication"
            />
          </div>
        </div>
      </Card>
    </div>
  )
}
