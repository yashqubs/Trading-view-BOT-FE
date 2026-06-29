import type { ReactNode } from 'react'
import { AlertTriangle, OctagonAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AlertBannerProps {
  variant: 'danger' | 'warning'
  children: ReactNode
}

export function AlertBanner({ variant, children }: AlertBannerProps) {
  const Icon = variant === 'danger' ? OctagonAlert : AlertTriangle

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-card border px-4 py-3 text-sm animate-fade-slide-in',
        variant === 'danger'
          ? 'border-danger/30 bg-danger/10 text-danger'
          : 'border-warning/30 bg-warning/10 text-warning',
      )}
      role="alert"
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  )
}
