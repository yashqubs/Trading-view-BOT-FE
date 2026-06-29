import { cn } from '@/lib/utils'

export function ProgressBar({ value, warningAt = 80 }: { value: number; warningAt?: number }) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
      <div
        className={cn('h-full rounded-full transition-all', clamped >= warningAt ? 'bg-warning' : 'bg-accent')}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
