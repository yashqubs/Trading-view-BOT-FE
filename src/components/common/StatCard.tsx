import { type ComponentType, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCountUp } from '@/hooks/useCountUp'
import { cn } from '@/lib/utils'

/** Named accents drawn from the `--stat-*` design tokens (see index.css). */
export type StatAccent = 'accent' | 'violet' | 'indigo' | 'blue' | 'sky' | 'teal' | 'orange' | 'rose'

const ACCENT_VAR: Record<StatAccent, string> = {
  accent: 'var(--accent)',
  violet: 'var(--stat-violet)',
  indigo: 'var(--stat-indigo)',
  blue: 'var(--stat-blue)',
  sky: 'var(--stat-sky)',
  teal: 'var(--stat-teal)',
  orange: 'var(--stat-orange)',
  rose: 'var(--stat-rose)',
}

interface StatCardProps {
  label: string
  value: number
  format?: (value: number) => string
  trend?: number
  loading?: boolean
  action?: ReactNode
  warning?: boolean
  /** Route to navigate to on click — makes the card a link to the relevant detail page. */
  to?: string
  icon?: ComponentType<{ className?: string }>
  accent?: StatAccent
}

export function StatCard({
  label,
  value,
  format,
  trend,
  loading,
  action,
  warning,
  to,
  icon: Icon,
  accent = 'accent',
}: StatCardProps) {
  const animated = useCountUp(value)
  const accentVar = ACCENT_VAR[accent]

  if (loading) {
    return (
      <Card className="animate-fade-slide-in justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-3 h-8 w-28" />
      </Card>
    )
  }

  const content = (
    <Card
      className={cn(
        'group animate-fade-slide-in justify-between',
        warning && 'border-warning/40',
        to &&
          'card-glow cursor-pointer transition-colors hover:border-[color:color-mix(in_srgb,var(--stat-accent)_40%,transparent)]',
      )}
      style={{ '--stat-accent': accentVar } as CSSProperties}
    >
      <span className="stat-accent-bar" />
      <div className="flex items-start justify-between">
        <p className="text-[13px] text-text-secondary">{label}</p>
        {Icon ? (
          <span className="stat-icon-badge shrink-0 transition-transform duration-200 group-hover:scale-105">
            <Icon className="h-4 w-4" />
          </span>
        ) : (
          action
        )}
      </div>
      <div>
        <p className="tabular-nums mt-2 text-[30px] font-semibold tracking-tight text-text-primary">
          {format ? format(animated) : Math.round(animated)}
        </p>
        {trend !== undefined && (
          <div
            className={cn(
              'mt-1 inline-flex items-center gap-1 text-xs font-medium',
              trend >= 0 ? 'text-success' : 'text-danger',
            )}
          >
            {trend >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
    </Card>
  )

  if (!to) return content

  return (
    <Link to={to} className="block h-full rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
      {content}
    </Link>
  )
}
