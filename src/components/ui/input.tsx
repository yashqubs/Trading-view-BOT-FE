import * as React from 'react'
import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        // Layout & shape
        'flex h-10 w-full rounded-lg border border-border bg-surface-2 px-3',
        // Typography
        'text-sm text-text-primary',
        // Placeholder
        'placeholder:text-text-tertiary',
        // Transitions
        'transition-colors duration-150',
        // Focus ring
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-transparent',
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
