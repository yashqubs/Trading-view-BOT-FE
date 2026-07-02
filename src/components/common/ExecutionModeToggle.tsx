import { Target, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ExecutionMode } from '@/types'

interface ModeOption {
  value: ExecutionMode
  label: string
  description: string
  icon: typeof Zap
}

const OPTIONS: ModeOption[] = [
  {
    value: 'MARKET',
    label: 'Market price',
    description: "Fills instantly at IG's current price",
    icon: Zap,
  },
  {
    value: 'SIGNAL_PRICE',
    label: 'Signal price',
    description: 'Limit order at the exact signal price — may not fill',
    icon: Target,
  },
]

interface ExecutionModeToggleProps {
  value: ExecutionMode
  onChange: (mode: ExecutionMode) => void
  disabled?: boolean
  /** Force a single column regardless of viewport — for narrow contexts like
   * modals, where sm:grid-cols-2 would trigger off the browser width rather
   * than the actual space available inside the dialog. */
  stacked?: boolean
}

export function ExecutionModeToggle({ value, onChange, disabled, stacked }: ExecutionModeToggleProps) {
  return (
    <div role="radiogroup" className={cn('grid grid-cols-1 gap-2', !stacked && 'sm:grid-cols-2')}>
      {OPTIONS.map((option) => {
        const isActive = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              'group relative flex items-start gap-2.5 overflow-hidden rounded-xl border px-3.5 py-3 text-left transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
              isActive
                ? 'border-transparent bg-gradient-to-br from-accent to-stat-violet text-accent-foreground shadow-[0_0_18px_rgb(var(--accent-rgb)/0.4)]'
                : 'border-border bg-surface text-text-secondary hover:border-accent/40 hover:bg-surface-2 hover:text-text-primary',
              disabled && 'pointer-events-none opacity-50',
            )}
          >
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                isActive ? 'bg-white/15' : 'bg-accent-soft text-accent group-hover:bg-accent/20',
              )}
            >
              <option.icon className="h-4 w-4" />
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm font-semibold">{option.label}</span>
              <span
                className={cn(
                  'text-[11px] leading-snug',
                  isActive ? 'text-accent-foreground/85' : 'text-text-tertiary',
                )}
              >
                {option.description}
              </span>
            </span>
            {isActive && (
              <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
            )}
          </button>
        )
      })}
    </div>
  )
}
