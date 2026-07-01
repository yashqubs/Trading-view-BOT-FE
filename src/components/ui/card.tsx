import * as React from 'react'
import { cn } from '@/lib/utils'

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative flex h-full flex-col overflow-hidden rounded-card border border-border p-5',
        // Faint top-to-bottom sheen over the surface colour for a touch of
        // glass depth on every card — no motion, no implied clickability
        // (interactive cards opt into more via card-glow).
        'bg-surface bg-gradient-to-b from-white/[0.03] to-transparent',
        'shadow-[var(--shadow-card),0_1px_0_0_rgba(255,255,255,0.04)_inset]',
        'transition-all duration-200',
        className,
      )}
      {...props}
    />
  ),
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('mb-4 flex items-center justify-between', className)} {...props} />
  ),
)
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-sm font-medium uppercase tracking-wide text-text-secondary', className)}
      {...props}
    />
  ),
)
CardTitle.displayName = 'CardTitle'

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn(className)} {...props} />,
)
CardContent.displayName = 'CardContent'

export { Card, CardHeader, CardTitle, CardContent }
