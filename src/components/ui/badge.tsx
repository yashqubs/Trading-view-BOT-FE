import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide leading-none',
  {
    variants: {
      variant: {
        neutral: 'bg-surface-2 text-text-secondary border border-border',
        success: 'bg-success/10 text-success border border-success/20',
        danger: 'bg-danger/10 text-danger border border-danger/20',
        warning: 'bg-warning/10 text-warning border border-warning/20',
        accent: 'bg-accent-soft text-accent border border-accent/20',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
