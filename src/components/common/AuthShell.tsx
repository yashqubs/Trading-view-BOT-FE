import { type ReactNode, useRef, useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface AuthShellProps {
  title: string
  subtitle: string
  children: ReactNode
  className?: string
}

const MAX_TILT_DEG = 7

const PARTICLES = [
  { top: '12%', left: '8%', size: 6, delay: '0s' },
  { top: '22%', left: '88%', size: 4, delay: '1.5s' },
  { top: '70%', left: '12%', size: 5, delay: '3s' },
  { top: '80%', left: '85%', size: 7, delay: '0.8s' },
  { top: '45%', left: '5%', size: 3, delay: '2.2s' },
  { top: '38%', left: '93%', size: 4, delay: '4s' },
]

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function AuthShell({ title, subtitle, children, className }: AuthShellProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const frame = useRef<number | null>(null)
  const [active, setActive] = useState(false)

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (prefersReducedMotion()) return
    const card = cardRef.current
    if (!card) return

    const rect = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5

    if (frame.current) cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      card.style.setProperty('--ry', `${px * MAX_TILT_DEG * 2}deg`)
      card.style.setProperty('--rx', `${py * -MAX_TILT_DEG * 2}deg`)
      card.style.setProperty('--tz', '12px')
    })
  }

  function handleMouseLeave() {
    const card = cardRef.current
    if (!card) return
    if (frame.current) cancelAnimationFrame(frame.current)
    // Remove the inline overrides so the CSS resting-tilt default takes over again.
    card.style.removeProperty('--ry')
    card.style.removeProperty('--rx')
    card.style.removeProperty('--tz')
    setActive(false)
  }

  return (
    <div className="auth-aurora flex min-h-full items-center justify-center bg-bg px-4 py-10">
      <div className="auth-aurora-core" />
      <div className="auth-grid-floor" />
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="auth-particle"
          style={{
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
          }}
        />
      ))}

      <div
        className="auth-tilt-wrap relative z-10 w-full max-w-sm"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setActive(true)}
        onMouseLeave={handleMouseLeave}
      >
        <Card
          ref={cardRef}
          className={cn(
            'auth-tilt-card animate-fade-in-opacity relative w-full border-white/10 bg-surface/80 backdrop-blur-xl',
            active && 'auth-tilt-card--active',
            className,
          )}
        >
          <div className="auth-card-glow" />
          <div className="mb-6 flex flex-col items-center text-center" style={{ transform: 'translateZ(32px)' }}>
            <span className="auth-badge-wrap relative mb-3 h-12 w-12">
              <span className="auth-badge-shadow absolute inset-0 rounded-xl bg-accent" />
              <span className="auth-badge relative flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <TrendingUp className="h-5 w-5" />
              </span>
            </span>
            <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
              TradingBot Portal
            </p>
            <p className="mt-2 text-lg font-medium text-text-primary">{title}</p>
            <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
          </div>
          <div style={{ transform: 'translateZ(16px)' }}>{children}</div>
        </Card>
      </div>
    </div>
  )
}
