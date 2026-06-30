import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { login, loginWithTwoFactor, resendLoginTwoFactorCode, getMe } from '@/api/auth'
import { useAuth } from '@/context/AuthContext'
import { AuthShell } from '@/components/common/AuthShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/common/PasswordInput'
import { OtpInput } from '@/components/common/OtpInput'
import { Label } from '@/components/ui/label'

type Step = 'credentials' | 'twofactor'

export function Login() {
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [step, setStep] = useState<Step>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [twoFactorMessage, setTwoFactorMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [resending, setResending] = useState(false)

  async function handleCredentialsSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError('Enter your email and password.')
      return
    }

    setPending(true)
    try {
      const result = await login(email, password)
      if (result.requires2fa) {
        setTwoFactorMessage(result.message ?? 'A 6-digit code was sent to your email.')
        setStep('twofactor')
        return
      }

      if (result.user) {
        setUser(result.user)
        navigate('/')
        return
      }

      // requiresPasswordChange — no user in the response yet, but the pending
      // cookie already grants /auth/me so we can populate the session before
      // routing to /change-password.
      const user = await getMe()
      setUser(user)
      navigate('/change-password')
    } catch {
      setError('Incorrect email or password.')
    } finally {
      setPending(false)
    }
  }

  async function verifyTwoFactor(submittedCode: string) {
    setError(null)
    setPending(true)
    try {
      const { user } = await loginWithTwoFactor(email, password, submittedCode)
      setUser(user)
      navigate('/')
    } catch {
      setError('Invalid or expired code. Please try again.')
    } finally {
      setPending(false)
    }
  }

  async function handleTwoFactorSubmit(e: FormEvent) {
    e.preventDefault()
    if (code.length !== 6) {
      setError('Enter the 6-digit code from your email.')
      return
    }
    await verifyTwoFactor(code)
  }

  async function handleResend() {
    setError(null)
    setResending(true)
    try {
      const result = await resendLoginTwoFactorCode(email, password)
      setTwoFactorMessage(result.message)
    } catch {
      setError('Could not resend code. Try again in a moment.')
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthShell
      title={step === 'credentials' ? 'Welcome back' : 'Check your email'}
      subtitle={step === 'credentials' ? 'Sign in to continue' : 'Enter the code we just sent you'}
    >
      {step === 'credentials' ? (
        <form onSubmit={handleCredentialsSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={pending}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={pending}
            />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={pending} className="mt-1">
            {pending ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleTwoFactorSubmit} className="flex flex-col gap-4">
          {twoFactorMessage && (
            <div className="flex items-start gap-2 rounded-lg border border-border bg-surface-2 p-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <p className="text-left text-xs text-text-secondary">{twoFactorMessage}</p>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label>6-digit code</Label>
            <OtpInput value={code} onChange={setCode} onComplete={verifyTwoFactor} disabled={pending} autoFocus />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={pending} className="mt-1">
            {pending ? 'Verifying…' : 'Verify'}
          </Button>
          <button
            type="button"
            className="text-xs text-text-tertiary hover:text-text-secondary disabled:opacity-50"
            onClick={handleResend}
            disabled={resending || pending}
          >
            {resending ? 'Sending…' : "Didn't get a code? Resend"}
          </button>
          <button
            type="button"
            className="text-xs text-text-tertiary hover:text-text-secondary"
            onClick={() => {
              setStep('credentials')
              setCode('')
              setError(null)
              setTwoFactorMessage(null)
            }}
          >
            Back to login
          </button>
        </form>
      )}
    </AuthShell>
  )
}
