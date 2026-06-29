import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail } from 'lucide-react'
import {
  setupTwoFactor,
  verifyTwoFactor,
  skipTwoFactor,
  resendTwoFactorSetupCode,
  type TwoFactorSetup,
} from '@/api/auth'
import { useAuth } from '@/context/AuthContext'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'

export function Setup2FA() {
  const navigate = useNavigate()
  const { user, setUser } = useAuth()
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [resending, setResending] = useState(false)
  const [skipping, setSkipping] = useState(false)

  const alreadyEnabled = user?.twoFactorEnabled ?? false

  useEffect(() => {
    setupTwoFactor()
      .then(setSetup)
      .catch(() => setError('Could not send verification code. Refresh to try again.'))
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (code.length !== 6) {
      setError('Enter the 6-digit code from your email.')
      return
    }

    setPending(true)
    try {
      const { user: updatedUser } = await verifyTwoFactor(code)
      setUser(updatedUser)
      navigate('/')
    } catch {
      setError('Invalid or expired code. Please try again.')
    } finally {
      setPending(false)
    }
  }

  async function handleResend() {
    setError(null)
    setResending(true)
    try {
      const result = await resendTwoFactorSetupCode()
      setSetup((prev) => ({ message: result.message, maskedEmail: prev?.maskedEmail }))
    } catch {
      setError('Could not resend code. Try again in a moment.')
    } finally {
      setResending(false)
    }
  }

  async function handleSkip() {
    setError(null)
    setSkipping(true)
    try {
      const { user: updatedUser } = await skipTwoFactor()
      setUser(updatedUser)
      navigate('/')
    } catch {
      setError('Could not skip setup. Please try again.')
    } finally {
      setSkipping(false)
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-bg px-4 py-10">
      <Card className="w-full max-w-md animate-fade-slide-in">
        <div className="mb-6">
          <p className="text-lg font-medium text-text-primary">
            {alreadyEnabled ? 'Update two-factor authentication' : 'Set up two-factor authentication'}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            {alreadyEnabled
              ? 'We will send a new 6-digit code to your email to confirm the change.'
              : 'Optional extra security. We will email you a 6-digit code each time you sign in.'}
          </p>
        </div>

        {!setup ? (
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3 rounded-lg border border-border bg-surface-2 p-4">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <div>
                <p className="text-sm text-text-primary">{setup.message}</p>
                {setup.maskedEmail && (
                  <p className="mt-1 text-xs text-text-secondary">Sent to {setup.maskedEmail}</p>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="setup-code">6-digit code</Label>
                <Input
                  id="setup-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  disabled={pending}
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button type="submit" disabled={pending || skipping}>
                {pending ? 'Verifying…' : 'Confirm and enable'}
              </Button>
            </form>

            <div className="mt-4 flex flex-col items-center gap-2">
              <button
                type="button"
                className="text-xs text-text-tertiary hover:text-text-secondary disabled:opacity-50"
                onClick={handleResend}
                disabled={resending || pending || skipping}
              >
                {resending ? 'Sending…' : "Didn't get a code? Resend"}
              </button>
              {!alreadyEnabled && (
                <button
                  type="button"
                  className="text-xs text-text-tertiary hover:text-text-secondary disabled:opacity-50"
                  onClick={handleSkip}
                  disabled={skipping || pending}
                >
                  {skipping ? 'Skipping…' : 'Skip for now'}
                </button>
              )}
              {alreadyEnabled && (
                <button
                  type="button"
                  className="text-xs text-text-tertiary hover:text-text-secondary"
                  onClick={() => navigate('/settings')}
                >
                  Cancel
                </button>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
