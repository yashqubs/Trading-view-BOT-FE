import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCountUp } from '@/hooks/useCountUp'
import { cn } from '@/lib/utils'

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
}

export function StatCard({ label, value, format, trend, loading, action, warning, to }: StatCardProps) {
  const animated = useCountUp(value)

  if (loading) {
    return (
      <Card className="animate-fade-slide-in">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-3 h-8 w-28" />
      </Card>
    )
  }

  const content = (
    <Card
      className={cn(
        'animate-fade-slide-in',
        warning && 'border-warning/40',
        to && 'card-glow cursor-pointer transition-colors hover:border-accent/30',
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-[13px] text-text-secondary">{label}</p>
        {action}
      </div>
      <p className="tabular-nums mt-2 text-[30px] font-medium text-text-primary">
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
    </Card>
  )

  if (!to) return content

  return (
    <Link to={to} className="block rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
      {content}
    </Link>
  )
}
