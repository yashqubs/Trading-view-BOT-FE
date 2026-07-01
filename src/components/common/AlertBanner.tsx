import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ChevronRight, OctagonAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AlertBannerProps {
  variant: 'danger' | 'warning'
  children: ReactNode
  /** Route to navigate to on click — makes the banner a link to the records it's about. */
  to?: string
}

export function AlertBanner({ variant, children, to }: AlertBannerProps) {
  const Icon = variant === 'danger' ? OctagonAlert : AlertTriangle

  const content = (
    <div
      className={cn(
        'flex items-center gap-3 rounded-card border px-4 py-3 text-sm backdrop-blur-sm animate-fade-slide-in',
        variant === 'danger'
          ? 'border-danger/30 bg-danger/[0.08] text-danger'
          : 'border-warning/30 bg-warning/[0.08] text-warning',
        to && 'transition-all',
        to && variant === 'danger' && 'hover:border-danger/50 hover:bg-danger/[0.14]',
        to && variant === 'warning' && 'hover:border-warning/50 hover:bg-warning/[0.14]',
      )}
      role={to ? undefined : 'alert'}
    >
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          variant === 'danger' ? 'bg-danger/15' : 'bg-warning/15',
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 font-medium">{children}</span>
      {to && <ChevronRight className="h-4 w-4 shrink-0 opacity-60" />}
    </div>
  )

  if (!to) return content

  return (
    <Link
      to={to}
      role="alert"
      className="block rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      {content}
    </Link>
  )
}
