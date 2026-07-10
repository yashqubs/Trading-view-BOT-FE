import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { enableTwoFactor, skipTwoFactor } from '@/api/auth'
import { useAuth } from '@/context/AuthContext'
import { AuthShell } from '@/components/common/AuthShell'
import { Button } from '@/components/ui/button'

export function Setup2FA() {
  const navigate = useNavigate()
  const { setUser } = useAuth()

  const [error, setError] = useState<string | null>(null)
  const [enabling, setEnabling] = useState(false)
  const [skipping, setSkipping] = useState(false)

  async function handleEnable() {
    setError(null)
    setEnabling(true)
    try {
      const { user: updatedUser } = await enableTwoFactor()
      setUser(updatedUser)
      navigate('/')
    } catch {
      setError('Could not enable two-factor authentication. Please try again.')
    } finally {
      setEnabling(false)
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
    <AuthShell
      title="Add an extra layer of security?"
      subtitle="When enabled, we'll email you a 6-digit code each time you sign in. You can change this anytime in Settings."
    >
      <div className="flex flex-col items-center gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <div className="flex w-full flex-col gap-2">
          <Button type="button" onClick={handleEnable} disabled={enabling || skipping}>
            {enabling ? 'Enabling…' : 'Enable two-factor authentication'}
          </Button>
          <button
            type="button"
            className="text-xs text-text-tertiary hover:text-text-secondary disabled:opacity-50"
            onClick={handleSkip}
            disabled={skipping || enabling}
          >
            {skipping ? 'Skipping…' : 'Not now'}
          </button>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </AuthShell>
  )
}
