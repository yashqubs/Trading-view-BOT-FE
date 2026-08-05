import { type FormEvent, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Mail } from 'lucide-react'
import axios from 'axios'
import {
  login,
  loginWithTwoFactor,
  resendLoginTwoFactorCode,
  forgotPassword,
  resetPassword,
  getMe,
} from '@/api/auth'
import { clearServerSession } from '@/api/axios'
import { useAuth } from '@/context/AuthContext'
import { AuthShell } from '@/components/common/AuthShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/common/PasswordInput'
import { OtpInput } from '@/components/common/OtpInput'
import { Label } from '@/components/ui/label'

// Every failure that isn't plainly "wrong credentials" gets its own message.
// Collapsing all of them into the caller's fallback is how a broken cookie jar
// and a rate-limit lockout both spent weeks masquerading as "Incorrect email or
// password" — the one message that tells the user to do the exact thing that
// cannot possibly help.
//
//   no response  — never reached the server: offline, CORS, mixed content.
//   403          — CsrfGuard. The jar is inconsistent, not the password.
//   429          — throttled. Retrying immediately just extends the window.
//   5xx          — the server broke; the credentials were never judged.
function describeError(err: unknown, fallback: string): string {
  if (!axios.isAxiosError(err)) return fallback

  if (!err.response) {
    return 'Cannot reach the server. Check your connection and try again.'
  }

  const status = err.response.status
  if (status === 403) {
    return 'Your browser was holding a stale session. It has been cleared — please try again.'
  }
  if (status === 429) {
    return 'Too many attempts. Please wait a few minutes and try again.'
  }
  if (status >= 500) {
    return 'The server had a problem handling that. Please try again in a moment.'
  }
  return fallback
}

type Step = 'credentials' | 'twofactor' | 'forgot'
type ForgotStage = 'email' | 'code' | 'password'

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setUser, user, loading: authLoading } = useAuth()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/'
  const [step, setStep] = useState<Step>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [twoFactorMessage, setTwoFactorMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [resending, setResending] = useState(false)
  const [forgotStage, setForgotStage] = useState<ForgotStage>('email')
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotCode, setForgotCode] = useState('')
  const [forgotNewPassword, setForgotNewPassword] = useState('')
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('')
  const [forgotResending, setForgotResending] = useState(false)
  const jarReset = useRef(false)

  // Reaching the login screen with no session is the moment to guarantee a
  // clean cookie jar, before any credentials are typed against it. Whatever is
  // left over is dead by definition — the session probe just failed — but it is
  // httpOnly, so only the server can remove it, and while it sits there it can
  // still break things: a leftover csrf_token that no longer matches, or a
  // dead-but-present refresh_token that suppresses the backend's own cleanup.
  //
  // This is the belt to the interceptor's braces. The interceptor clears the
  // jar when *it* gives up, but nothing covers the jar being poisoned some
  // other way — a half-finished login, a config change, a session killed from
  // another device, or a tab left open across a deploy. Doing it here means
  // "just reload the login page" is always a complete fix, which is what
  // clearing cookies by hand was standing in for.
  useEffect(() => {
    if (authLoading || user || jarReset.current) return
    jarReset.current = true
    void clearServerSession()
  }, [authLoading, user])

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
        navigate(from, { replace: true })
        return
      }

      // requiresPasswordChange — no user in the response yet, but the pending
      // cookie already grants /auth/me so we can populate the session before
      // routing to /change-password. Carry the temp password the user just
      // typed along in router state so ChangePassword doesn't make them
      // retype it a second time.
      const user = await getMe()
      setUser(user)
      navigate('/change-password', { state: { tempPassword: password } })
    } catch (err) {
      setError(describeError(err, 'Incorrect email or password.'))
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
      navigate(from, { replace: true })
    } catch (err) {
      setError(describeError(err, 'Invalid or expired code. Please try again.'))
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

  async function handleForgotEmailSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!forgotEmail) {
      setError('Enter your email.')
      return
    }

    setPending(true)
    try {
      await forgotPassword(forgotEmail)
      // Always advance, regardless of whether the email is actually registered —
      // the backend response never reveals that, so neither can the UI.
      setForgotStage('code')
    } catch (err) {
      setError(describeError(err, 'Something went wrong. Please try again.'))
    } finally {
      setPending(false)
    }
  }

  async function handleForgotResend() {
    setError(null)
    setForgotResending(true)
    try {
      await forgotPassword(forgotEmail)
      toast.success('A new code has been sent.')
    } catch (err) {
      setError(describeError(err, 'Could not resend code. Try again in a moment.'))
    } finally {
      setForgotResending(false)
    }
  }

  function handleForgotCodeComplete(submittedCode: string) {
    setForgotCode(submittedCode)
    setError(null)
    setForgotStage('password')
  }

  async function handleForgotPasswordSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (forgotNewPassword.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setPending(true)
    try {
      await resetPassword(forgotEmail, forgotCode, forgotNewPassword)
      toast.success('Password updated. Sign in with your new password.')
      backToLogin()
    } catch (err) {
      // The code may have been wrong or expired — send them back to re-enter it
      // rather than making them retype the new password too. A network-level
      // failure (server unreachable) is different: the code was never even
      // checked, so don't discard it or bounce them back a step.
      if (axios.isAxiosError(err) && !err.response) {
        setError(describeError(err, ''))
      } else {
        setError('That code was invalid or has expired. Please re-enter it.')
        setForgotCode('')
        setForgotStage('code')
      }
    } finally {
      setPending(false)
    }
  }

  function backToLogin() {
    setStep('credentials')
    setError(null)
    setForgotStage('email')
    setForgotEmail('')
    setForgotCode('')
    setForgotNewPassword('')
    setForgotConfirmPassword('')
  }

  async function handleResend() {
    setError(null)
    setResending(true)
    try {
      const result = await resendLoginTwoFactorCode(email, password)
      setTwoFactorMessage(result.message)
    } catch (err) {
      setError(describeError(err, 'Could not resend code. Try again in a moment.'))
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthShell
      title={
        step === 'credentials' ? 'Welcome back' : step === 'twofactor' ? 'Check your email' : 'Reset password'
      }
      subtitle={
        step === 'credentials'
          ? 'Sign in to continue'
          : step === 'twofactor'
            ? 'Enter the code we just sent you'
            : forgotStage === 'email'
              ? "We'll email you a verification code"
              : forgotStage === 'code'
                ? 'Enter the code we just sent you'
                : 'Choose a new password'
      }
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <button
                type="button"
                className="text-xs text-text-tertiary hover:text-text-secondary"
                onClick={() => {
                  setForgotEmail(email)
                  setError(null)
                  setForgotStage('email')
                  setStep('forgot')
                }}
              >
                Forgot password?
              </button>
            </div>
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
      ) : step === 'forgot' ? (
        forgotStage === 'email' ? (
          <form onSubmit={handleForgotEmailSubmit} className="flex flex-col gap-4">
            <p className="text-left text-xs text-text-secondary">
              Enter your account email and we&apos;ll send you a verification code.
            </p>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                autoComplete="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                disabled={pending}
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" disabled={pending} className="mt-1">
              {pending ? 'Sending…' : 'Send code'}
            </Button>
            <button
              type="button"
              className="text-xs text-text-tertiary hover:text-text-secondary"
              onClick={backToLogin}
            >
              Back to login
            </button>
          </form>
        ) : forgotStage === 'code' ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-2 rounded-lg border border-border bg-surface-2 p-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <p className="text-left text-xs text-text-secondary">
                If that email is registered, a 6-digit code was sent to it.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>6-digit code</Label>
              <OtpInput
                value={forgotCode}
                onChange={setForgotCode}
                onComplete={handleForgotCodeComplete}
                disabled={pending}
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <button
              type="button"
              className="text-xs text-text-tertiary hover:text-text-secondary disabled:opacity-50"
              onClick={handleForgotResend}
              disabled={forgotResending || pending}
            >
              {forgotResending ? 'Sending…' : "Didn't get a code? Resend"}
            </button>
            <button
              type="button"
              className="text-xs text-text-tertiary hover:text-text-secondary"
              onClick={backToLogin}
            >
              Back to login
            </button>
          </div>
        ) : (
          <form onSubmit={handleForgotPasswordSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="forgot-new-password">New password</Label>
              <PasswordInput
                id="forgot-new-password"
                autoComplete="new-password"
                value={forgotNewPassword}
                onChange={(e) => setForgotNewPassword(e.target.value)}
                disabled={pending}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="forgot-confirm-password">Confirm new password</Label>
              <PasswordInput
                id="forgot-confirm-password"
                autoComplete="new-password"
                value={forgotConfirmPassword}
                onChange={(e) => setForgotConfirmPassword(e.target.value)}
                disabled={pending}
              />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" disabled={pending} className="mt-1">
              {pending ? 'Updating…' : 'Reset password'}
            </Button>
            <button
              type="button"
              className="text-xs text-text-tertiary hover:text-text-secondary"
              onClick={backToLogin}
            >
              Back to login
            </button>
          </form>
        )
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
