import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { cn } from '@/lib/utils'

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      // Base
      'peer relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full',
      // Border & transition
      'transition-all duration-200 ease-in-out',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
      // Disabled
      'disabled:cursor-not-allowed disabled:opacity-40',
      // States
      'data-[state=checked]:bg-accent data-[state=checked]:border-transparent',
      'data-[state=unchecked]:bg-surface-2 data-[state=unchecked]:border data-[state=unchecked]:border-border',
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        'pointer-events-none block h-[18px] w-[18px] rounded-full shadow-md ring-0',
        'transition-transform duration-200 ease-in-out',
        // Checked: white thumb, shifted right
        'data-[state=checked]:translate-x-[22px] data-[state=checked]:bg-white',
        // Unchecked: muted thumb, at left
        'data-[state=unchecked]:translate-x-[3px] data-[state=unchecked]:bg-text-tertiary',
      )}
    />
  </SwitchPrimitive.Root>
))
Switch.displayName = SwitchPrimitive.Root.displayName

export { Switch }
