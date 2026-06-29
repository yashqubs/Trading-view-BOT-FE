import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium',
    'transition-all duration-150',
    'active:scale-[0.97]',
    'disabled:pointer-events-none disabled:opacity-40',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
    'select-none',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: [
          'bg-accent text-accent-foreground',
          'hover:brightness-110 hover:shadow-[0_0_12px_rgba(34,211,238,0.3)]',
        ].join(' '),
        secondary: [
          'bg-transparent border border-border text-text-primary',
          'hover:bg-surface-2 hover:border-text-tertiary',
        ].join(' '),
        destructive: [
          'bg-transparent border border-danger/40 text-danger',
          'hover:bg-danger/10 hover:border-danger',
        ].join(' '),
        ghost: [
          'bg-transparent text-text-secondary',
          'hover:bg-surface-2 hover:text-text-primary',
        ].join(' '),
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        default: 'h-10 px-4',
        lg: 'h-11 px-6 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
