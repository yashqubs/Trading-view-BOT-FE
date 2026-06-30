import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Check, Copy } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PasswordInput } from '@/components/common/PasswordInput'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useSystemStatus } from '@/hooks/useSystem'
import { changeOwnPassword, disableTwoFactor } from '@/api/auth'
import { useAuth } from '@/context/AuthContext'

export function Settings() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const system = useSystemStatus()
  const [copied, setCopied] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const [disable2faOpen, setDisable2faOpen] = useState(false)
  const [disable2faPassword, setDisable2faPassword] = useState('')
  const [disable2faError, setDisable2faError] = useState<string | null>(null)
  const [disabling2fa, setDisabling2fa] = useState(false)

  function copyWebhookUrl() {
    if (!system.data) return
    navigator.clipboard.writeText(system.data.webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setPending(true)
    try {
      await changeOwnPassword(currentPassword, newPassword)
      toast.success('Password updated')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      setError('Could not update password. Check your current password.')
    } finally {
      setPending(false)
    }
  }

  async function handleDisable2fa(e: FormEvent) {
    e.preventDefault()
    setDisable2faError(null)
    setDisabling2fa(true)
    try {
      const { user: updatedUser } = await disableTwoFactor(disable2faPassword)
      setUser(updatedUser)
      toast.success('Two-factor authentication disabled')
      setDisable2faOpen(false)
      setDisable2faPassword('')
    } catch {
      setDisable2faError('Incorrect password.')
    } finally {
      setDisabling2fa(false)
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
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Webhook URL</Label>
              <div className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-3 py-2.5">
                <span className="truncate text-sm text-text-primary">{system.data?.webhookUrl}</span>
                <Button variant="ghost" size="icon" onClick={copyWebhookUrl} aria-label="Copy webhook URL">
                  {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-text-tertiary">Set this as the webhook URL on both TradingView alerts.</p>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
              <Label>IG connection</Label>
              <Badge variant={system.data?.igConnected ? 'success' : 'danger'}>
                {system.data?.igConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
          </div>
        )}
      </Card>

      <Card className="animate-fade-slide-in">
        <CardHeader>
          <CardTitle>Change password</CardTitle>
        </CardHeader>
        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="settings-current-password">Current password</Label>
            <PasswordInput
              id="settings-current-password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={pending}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="settings-new-password">New password</Label>
              <PasswordInput
                id="settings-new-password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={pending}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="settings-confirm-password">Confirm new password</Label>
              <PasswordInput
                id="settings-confirm-password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={pending}
              />
            </div>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? 'Updating…' : 'Update password'}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="animate-fade-slide-in">
        <CardHeader>
          <CardTitle>Two-factor authentication</CardTitle>
        </CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-text-primary">
              Status:{' '}
              <Badge variant={user?.twoFactorEnabled ? 'success' : 'neutral'}>
                {user?.twoFactorEnabled ? 'Enabled' : 'Off'}
              </Badge>
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              Optional. When enabled, a 6-digit code is emailed to you each time you sign in.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            {user?.twoFactorEnabled ? (
              <Dialog
                open={disable2faOpen}
                onOpenChange={(next) => {
                  setDisable2faOpen(next)
                  if (!next) {
                    setDisable2faPassword('')
                    setDisable2faError(null)
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="secondary">Disable 2FA</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Disable two-factor authentication?</DialogTitle>
                    <DialogDescription>
                      You will only need your email and password to sign in. Confirm with your password to
                      continue.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleDisable2fa} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="disable-2fa-password">Password</Label>
                      <PasswordInput
                        id="disable-2fa-password"
                        autoComplete="current-password"
                        autoFocus
                        value={disable2faPassword}
                        onChange={(e) => setDisable2faPassword(e.target.value)}
                        disabled={disabling2fa}
                      />
                    </div>
                    {disable2faError && <p className="text-sm text-danger">{disable2faError}</p>}
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setDisable2faOpen(false)}
                        disabled={disabling2fa}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" variant="destructive" disabled={disabling2fa}>
                        {disabling2fa ? 'Disabling…' : 'Disable'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            ) : (
              <Button variant="secondary" onClick={() => navigate('/setup-2fa')}>
                Enable 2FA
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
