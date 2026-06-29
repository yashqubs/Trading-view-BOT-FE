import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { changeOwnPassword, getMe } from '@/api/auth'
import { useAuth } from '@/context/AuthContext'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
      navigate('/')
    } catch {
      setError('Could not update your password. Check your current password and try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-bg px-4">
      <Card className="w-full max-w-sm animate-fade-slide-in">
        <div className="mb-6">
          <p className="text-lg font-medium text-text-primary">Set a new password</p>
          <p className="mt-1 text-sm text-text-secondary">
            This is a temporary password. Choose a new one to continue.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="current-password">Temporary password</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={pending}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={pending}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input
              id="confirm-password"
              type="password"
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
      </Card>
    </div>
  )
}
