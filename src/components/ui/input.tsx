import * as React from 'react'
import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, onWheel, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      // Number inputs change value on scroll while focused — almost never
      // wanted (a stray scroll while reading the page silently edits a real
      // money field). Blurring on wheel stops it; blur happens before the
      // browser applies the scroll delta, so the value never changes.
      onWheel={
        type === 'number'
          ? (e) => {
              e.currentTarget.blur()
              onWheel?.(e)
            }
          : onWheel
      }
      className={cn(
        // Layout & shape
        'flex h-10 w-full rounded-lg border border-border bg-surface-2 px-3 shadow-[var(--shadow-sm)]',
        // Typography
        'text-sm text-text-primary',
        // Placeholder
        'placeholder:text-text-tertiary',
        // Transitions
        'transition-colors duration-150',
        // Focus ring
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-transparent',
        'focus-visible:shadow-[0_0_0_4px_rgb(var(--accent-rgb)/0.12)]',
        // Hover
        'hover:border-text-tertiary',
        // Disabled
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface',
        // Time/date inputs — consistent height
        type === 'time' || type === 'date' ? 'cursor-pointer' : '',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'

export { Input }
