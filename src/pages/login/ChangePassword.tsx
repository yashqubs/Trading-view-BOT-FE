import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { changeOwnPassword, getMe } from '@/api/auth'
import { useAuth } from '@/context/AuthContext'
import { AuthShell } from '@/components/common/AuthShell'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/common/PasswordInput'
import { Label } from '@/components/ui/label'

export function ChangePassword() {
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: FormEvent) {
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
      const user = await getMe()
      setUser(user)
      // Next stop is the optional 2FA prompt — only shown once, right after onboarding.
      navigate('/setup-2fa', { state: { onboarding: true } })
    } catch {
      setError('Could not update your password. Check your current password and try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthShell title="Set a new password" subtitle="This is a temporary password. Choose a new one to continue.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="current-password">Temporary password</Label>
          <PasswordInput
            id="current-password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={pending}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-password">New password</Label>
          <PasswordInput
            id="new-password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={pending}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm-password">Confirm new password</Label>
          <PasswordInput
            id="confirm-password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={pending}
          />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? 'Updating…' : 'Continue'}
        </Button>
      </form>
    </AuthShell>
  )
}
