import { type FormEvent, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Mail, ShieldCheck } from 'lucide-react'
import {
  setupTwoFactor,
  verifyTwoFactor,
  skipTwoFactor,
  resendTwoFactorSetupCode,
  type TwoFactorSetup,
} from '@/api/auth'
import { useAuth } from '@/context/AuthContext'
import { AuthShell } from '@/components/common/AuthShell'
import { Button } from '@/components/ui/button'
import { OtpInput } from '@/components/common/OtpInput'
import { Skeleton } from '@/components/ui/skeleton'

type Step = 'prompt' | 'code'

export function Setup2FA() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, setUser } = useAuth()
  const onboarding = Boolean((location.state as { onboarding?: boolean } | null)?.onboarding)
  const alreadyEnabled = user?.twoFactorEnabled ?? false

  const [step, setStep] = useState<Step>(onboarding && !alreadyEnabled ? 'prompt' : 'code')
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [resending, setResending] = useState(false)
  const [skipping, setSkipping] = useState(false)

  useEffect(() => {
    if (step !== 'code') return
    setupTwoFactor()
      .then(setSetup)
      .catch(() => setError('Could not send verification code. Refresh to try again.'))
  }, [step])

  async function verify(submittedCode: string) {
    setError(null)
    setPending(true)
    try {
      const { user: updatedUser } = await verifyTwoFactor(submittedCode)
      setUser(updatedUser)
      navigate('/')
    } catch {
      setError('Invalid or expired code. Please try again.')
    } finally {
      setPending(false)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (code.length !== 6) {
      setError('Enter the 6-digit code from your email.')
      return
    }
    await verify(code)
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

  if (step === 'prompt') {
    return (
      <AuthShell
        title="Add an extra layer of security?"
        subtitle="When enabled, we'll email you a 6-digit code each time you sign in."
      >
        <div className="flex flex-col items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div className="flex w-full flex-col gap-2">
            <Button type="button" onClick={() => setStep('code')}>
              Enable two-factor authentication
            </Button>
            <button
              type="button"
              className="text-xs text-text-tertiary hover:text-text-secondary disabled:opacity-50"
              onClick={handleSkip}
              disabled={skipping}
            >
              {skipping ? 'Skipping…' : 'Not now'}
            </button>
          </div>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={alreadyEnabled ? 'Update two-factor authentication' : 'Set up two-factor authentication'}
      subtitle={
        alreadyEnabled
          ? 'We will send a new 6-digit code to your email to confirm the change.'
          : 'Enter the 6-digit code we just emailed you.'
      }
    >
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
            <OtpInput value={code} onChange={setCode} onComplete={verify} disabled={pending} autoFocus />
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
    </AuthShell>
  )
}
